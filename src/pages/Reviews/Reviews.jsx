import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { fetchReviews, submitReview } from "../../services/reviewService";
import { ListSkeleton } from "../../components/dashboard/Skeleton";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const StarRating = ({ value, onChange, size = "w-7 h-7" }) => {
  const [hover, setHover] = useState(0);
  const active = value || hover;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          onMouseEnter={onChange ? () => setHover(n) : undefined}
          onMouseLeave={onChange ? () => setHover(0) : undefined}
          onClick={onChange ? () => onChange(n) : undefined}
          className={`p-0 bg-transparent border-none ${onChange ? "cursor-pointer" : "cursor-default"}`}
          disabled={!onChange}
        >
          <Star
            className={`${size} ${
              n <= active
                ? "text-yellow-500 fill-yellow-500"
                : "text-base-content/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewForm = ({ user, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [dish, setDish] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating || !text.trim() || !dish.trim()) {
      toast.error("Please fill in rating, dish, and your review.");
      return;
    }
    if (!user) {
      toast.error("Please login to submit a review.");
      return;
    }
    setSubmitting(true);
    try {
      const review = await submitReview({
        dish: dish.trim(),
        rating,
        text: text.trim(),
      });
      onSubmitted(review);
      toast.success("Review submitted! Thanks for your feedback. ⭐");
      setRating(0);
      setText("");
      setDish("");
    } catch (err) {
      toast.error(
        err?.response?.data?.error || err?.message || "Could not submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="card bg-base-100 shadow-md p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Write a Review</h2>
        <p className="text-base-content/60 mb-4">
          Login to share your experience and rating.
        </p>
        <Link to="/login" className="btn btn-primary">
          Login to Review
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="card bg-base-100 shadow-md p-6 space-y-4"
    >
      <h2 className="text-xl font-bold">Write a Review</h2>

      <div>
        <label className="label">
          <span className="label-text">Dish / Restaurant</span>
        </label>
        <input
          className="input input-bordered w-full"
          value={dish}
          onChange={(e) => setDish(e.target.value)}
          placeholder="Which dish did you try?"
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="label-text mr-2">Rating:</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="label">
          <span className="label-text">Your Review</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows="3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell us about your experience..."
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary w-fit px-8"
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Submit Review"
        )}
      </button>
    </form>
  );
};

const Reviews = () => {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchReviews();
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const visible =
    activeTab === "all"
      ? reviews
      : reviews.filter((r) => r.rating === Number(activeTab));

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <div className="my-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Reviews & Ratings</h1>
        <p className="text-base-content/60 mt-2">
          See what customers think and share your own experience.
        </p>
        <div className="inline-flex items-center gap-2 mt-4 badge badge-lg badge-secondary">
          <span className="text-2xl">★</span>
          <span className="text-xl font-bold">{avg}</span>
          <span className="text-base-content/60">
            ({reviews.length} reviews)
          </span>
        </div>
      </div>

      <ReviewForm user={user} onSubmitted={(rev) => setReviews((prev) => [rev, ...prev])} />

      <div className="mt-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", 5, 4, 3, 2, 1].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn btn-sm ${
                activeTab === tab ? "btn-primary" : "btn-ghost border border-base-300"
              }`}
            >
              {tab === "all" ? "All" : `${tab} ★`}
            </button>
          ))}
        </div>

        {loading ? (
          <ListSkeleton rows={6} />
        ) : (
          <div className="space-y-4">
            {visible.length === 0 ? (
              <p className="text-center text-base-content/50 py-8">
                {reviews.length === 0
                  ? "No reviews yet. Be the first to share your experience!"
                  : `No ${activeTab}-star reviews yet.`}
              </p>
            ) : (
              visible.map((r) => (
                <div key={r.id} className="card bg-base-100 shadow-md">
                  <div className="card-body p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <span className="font-bold text-primary-content">
                            {r.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{r.name}</p>
                          <p className="text-xs text-base-content/60">
                            {r.dish}
                            {r.created_at ? (
                              <>
                                {" · "}
                                {formatDate(r.created_at)}
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <StarRating value={r.rating} size="w-4 h-4" />
                    </div>
                    <p className="mt-3 text-base-content/80">{r.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
