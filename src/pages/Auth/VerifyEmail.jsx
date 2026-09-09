import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import {
  verifyEmail,
  resendVerification,
  readSignupSession,
  saveSignupSession,
} from "../../services/authService";
import { ROLES, ROLE_DASHBOARD } from "../../utils/roles";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

/**
 * Where should the user be taken after a successful verification?
 * Pending/rejected owners & riders still need to see their review page,
 * everyone else goes straight to their dashboard.
 */
function dashboardFor(user) {
  if (user?.role === ROLES.restaurantOwner && user?.status !== "active") {
    return "/restaurant-owner/verification";
  }
  if (user?.role === ROLES.rider && user?.status !== "active") {
    return "/rider/verification";
  }
  return ROLE_DASHBOARD[user?.role] || "/";
}

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const completeVerification = useAuthStore((s) => s.completeVerification);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  // In the (stateless) signup flow the user is NOT signed in yet, so the email
  // comes from the signup form's navigation state / sessionStorage, never from
  // store.user. Guarded by useMemo against malformed location state.
  const email = useMemo(() => {
    const fromUser = user?.email;
    const fromState = location.state?.email;
    const fromQuery = new URLSearchParams(location.search).get("email");
    const fromSession = readSignupSession().email;
    return (
      (fromUser || fromState || fromSession || fromQuery || "")
        .toString()
        .trim()
        .toLowerCase()
    );
  }, [user?.email, location.state, location.search]);

  // The signed verification token is the ONLY thing identifying the pending
  // signup (server stores nothing). Restored from navigation state or
  // sessionStorage so a page refresh keeps it alive.
  const [verificationToken, setVerificationToken] = useState(() => {
    const fromState = location.state?.verificationToken;
    const fromSession = readSignupSession().verificationToken;
    return (fromState || fromSession || "").trim();
  });

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef([]);

  // Focus the first box on mount.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Countdown ticker for the resend cooldown.
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH;

  const focusIndex = (i) => {
    const el = inputsRef.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleChange = (i, raw) => {
    if (error) setError("");
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = value;
    setDigits(next);
    // Auto-advance to the next box when a digit is entered.
    if (value && i < OTP_LENGTH - 1) focusIndex(i + 1);
    // Auto-submit when the last digit is filled.
    if (value && i === OTP_LENGTH - 1 && next.join("").length === OTP_LENGTH) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      focusIndex(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusIndex(i - 1);
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      focusIndex(i + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    if (error) setError("");
    const filled = Array(OTP_LENGTH).fill("");
    [...pasted.slice(0, OTP_LENGTH)].forEach((ch, i) => {
      filled[i] = ch;
    });
    setDigits(filled);
    const last = Math.min(pasted.length, OTP_LENGTH);
    focusIndex(last - 1);
    if (filled.join("").length === OTP_LENGTH) handleVerify(filled.join(""));
  };

  const handleVerify = async (code = otp) => {
    if (!email) {
      setError("No email address found. Please go back and sign up again.");
      return;
    }
    if (!verificationToken) {
      setError(
        "No verification session found. Please sign up again to receive a new code."
      );
      return;
    }
    if (!code || code.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setVerifying(true);
    try {
      const { user: verifiedUser, customToken } = await verifyEmail({
        email,
        otp: code,
        verificationToken,
      });
      // Backend just created the REAL account (isVerified: true). Sign in with
      // the Firebase custom token + persist the fresh profile before leaving.
      await completeVerification({ user: verifiedUser, customToken });
      await fetchMe();
      toast.success("Email verified! Your account is active.");
      navigate(dashboardFor(verifiedUser || user), { replace: true });
    } catch (err) {
      const message = err?.message || "Verification failed. Please try again.";
      setError(message);
      toast.error(message);
      // A wrong code makes the backend re-sign the token (attempt counter) —
      // keep the stored session in sync so the next attempt still works.
      if (err?.verificationToken) {
        setVerificationToken(err.verificationToken);
        saveSignupSession({ email, verificationToken: err.verificationToken });
      }
      // If the code was invalid, clear the boxes so retyping is easy.
      if (message.toLowerCase().includes("invalid")) {
        setDigits(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending || countdown > 0) return;
    if (!email) {
      setError("No email address found. Please go back and sign up again.");
      return;
    }
    if (!verificationToken) {
      setError(
        "No verification session found. Please sign up again to receive a new code."
      );
      return;
    }
    setResending(true);
    setError("");
    try {
      const res = await resendVerification({ email, verificationToken });
      // The new code invalidates the old one; use the freshly issued token.
      if (res?.verificationToken) {
        setVerificationToken(res.verificationToken);
        saveSignupSession({ email, verificationToken: res.verificationToken });
      }
      toast.success("A new code has been sent to your email.");
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(RESEND_COOLDOWN_SECONDS);
      inputsRef.current[0]?.focus();
    } catch (err) {
      const message = err?.message || "Could not resend the code.";
      setError(message);
      toast.error(message);
      // If the backend told us how long until the next resend is allowed,
      // reflect that with a countdown so the button re-enables on time.
      if (err?.retryAfterMs > 0) {
        setCountdown(Math.max(1, Math.ceil(err.retryAfterMs / 1000)));
      }
    } finally {
      setResending(false);
    }
  };

  const resendLabel = (() => {
    if (resending) return "Sending...";
    if (countdown > 0) return `Resend in ${countdown}s`;
    return "Resend Code";
  })();

  return (
    <div className="my-12 flex justify-center px-4">
      <div className="card bg-base-100 shadow-md w-full max-w-md">
        <div className="card-body">
          <Link to="/" className="btn btn-ghost btn-sm w-fit gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mt-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>

          <h1 className="card-title text-2xl justify-center mt-2">
            Verify Your Email
          </h1>
          <p className="text-center text-base-content/60 text-sm">
            Enter the 6-digit code we sent to
          </p>
          <p className="text-center font-semibold text-base-content flex items-center justify-center gap-1 mt-1">
            <Mail className="w-4 h-4 text-primary" />
            <span className="break-all">{email || "your email"}</span>
          </p>

          {/* OTP input boxes */}
          <div className="mt-6 flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={2}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => handlePaste(e)}
                aria-label={`Digit ${i + 1}`}
                className={`input input-bordered w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold ${
                  d ? "input-primary" : ""
                }`}
              />
            ))}
          </div>

          {/* Inline error */}
          {error && (
            <p className="text-center text-sm text-error mt-3" role="alert">
              {error}
            </p>
          )}

          {/* Verify button */}
          <button
            className="btn btn-primary w-full mt-5 gap-2"
            disabled={verifying || !isComplete}
            onClick={() => handleVerify()}
          >
            {verifying ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Verify Email
              </>
            )}
          </button>

          <p className="text-center text-sm text-base-content/50">
            Didn&apos;t receive the code? Check your spam folder, or
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="btn btn-outline w-full gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {resendLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;