import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { resetPassword } from "../../services/authService";

const ForgotPassword = () => {
  const location = useLocation();

  const prefill = (
    location.state?.email || ""
  ).trim().toLowerCase();
  const from = typeof location.state?.from === "string" ? location.state.from : null;

  const [email, setEmail] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: value });
      setSentTo(value);
      toast.success("Reset link sent!");
    } catch (err) {
      toast.error(err?.message || "Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-12 flex justify-center px-4">
      <div className="card bg-base-100 shadow-md w-full max-w-md">
        <div className="card-body">
          <Link to={from || "/auth"} className="btn btn-ghost btn-sm w-fit gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mt-2">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>

          <h1 className="card-title text-2xl justify-center mt-2">
            Forgot Password?
          </h1>
          <p className="text-center text-base-content/60 text-sm">
            Enter the email address linked to your account and we&apos;ll send
            you a link to reset your password.
          </p>

          {sentTo ? (
            <div className="mt-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/30">
                <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-base-content">
                  A password reset link has been sent to{" "}
                  <strong className="break-all">{sentTo}</strong>. Check your
                  inbox (and spam folder) and follow the link to set a new
                  password.
                </p>
              </div>
              <p className="text-center text-sm text-base-content/60 mt-4">
                Didn&apos;t receive it?{" "}
                <button
                  type="button"
                  className="link link-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  Resend link
                </button>
              </p>
              <Link to={from || "/auth"} className="btn btn-outline w-full mt-5">
                Back to Login
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                className="btn btn-primary w-full"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;