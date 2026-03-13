import { useEffect, useState } from "react";
import { getReviewsForUser } from "../services/reviewService";
import "./Review.css";

// ─── Static stars display ────────────────────────────────────
function Stars({ value, size = "md" }) {
  const full = Math.floor(value || 0);
  const half = (value || 0) - full >= 0.4;
  return (
    <span className={`stars-display stars-${size}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star-icon ${
            s <= full ? "star-full" : s === full + 1 && half ? "star-half" : "star-empty"
          }`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ─── Mini stat bar ───────────────────────────────────────────
function StatBar({ label, value }) {
  if (!value) return null;
  const pct = ((value / 5) * 100).toFixed(0);
  return (
    <div className="stat-bar-row">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="stat-bar-value">{value}</span>
    </div>
  );
}

// ─── Rating distribution (1–5 star counts) ──────────────────
function RatingDistribution({ reviews }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.averageRating) === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="rating-dist">
      {counts.map(({ star, count }) => (
        <div key={star} className="dist-row">
          <span className="dist-star">{star} ★</span>
          <div className="dist-track">
            <div
              className="dist-fill"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="dist-count">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Single Review Card ──────────────────────────────────────
function ReviewCard({ review }) {
  const isSMEReview = review.reviewType === "SME_TO_FREELANCER";
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`review-card ${isSMEReview ? "card-sme" : "card-freelancer"}`}>
      <div className="review-card-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.reviewerId?.fullName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="reviewer-name">
              {review.reviewerId?.fullName || "Anonymous"}
            </div>
            <div className="reviewer-meta">
              <span className={`role-tag role-${review.reviewerId?.role?.toLowerCase()}`}>
                {review.reviewerId?.role || "User"}
              </span>
              {review.projectId?.title && (
                <span className="project-tag">📁 {review.projectId.title}</span>
              )}
            </div>
          </div>
        </div>
        <div className="card-rating-summary">
          <Stars value={review.averageRating} size="sm" />
          <span className="avg-label">{review.averageRating}/5</span>
          <span className="review-date">{date}</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="review-breakdown">
        {isSMEReview ? (
          <>
            {review.qualityRating && <span className="breakdown-chip">Quality {review.qualityRating}★</span>}
            {review.communicationRating && <span className="breakdown-chip">Communication {review.communicationRating}★</span>}
            {review.punctualityRating && <span className="breakdown-chip">Punctuality {review.punctualityRating}★</span>}
            {review.professionalismRating && <span className="breakdown-chip">Professionalism {review.professionalismRating}★</span>}
          </>
        ) : (
          <>
            {review.sme_professionalismRating && <span className="breakdown-chip chip-sme">Professionalism {review.sme_professionalismRating}★</span>}
            {review.sme_communicationRating && <span className="breakdown-chip chip-sme">Communication {review.sme_communicationRating}★</span>}
            {review.paymentTimelinessRating && <span className="breakdown-chip chip-sme">Payment Timeliness {review.paymentTimelinessRating}★</span>}
          </>
        )}
      </div>

      {review.comment && (
        <blockquote className="review-comment">
          <span className="quote-mark">"</span>
          {review.comment}
          <span className="quote-mark">"</span>
        </blockquote>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────
export default function FreelancerReviews({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "sme" | "freelancer"

  useEffect(() => {
    if (!userId) return;
    getReviewsForUser(userId)
      .then((res) => {
        setReviews(res.data.reviews || []);
        setStats(res.data.stats || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = reviews.filter((r) => {
    if (filter === "sme") return r.reviewType === "SME_TO_FREELANCER";
    if (filter === "freelancer") return r.reviewType === "FREELANCER_TO_SME";
    return true;
  });

  if (loading) {
    return (
      <div className="reviews-section">
        <div className="review-loading">
          <div className="review-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-section">
      <div className="reviews-section-title">
        <h2>Reviews & Ratings</h2>
        {stats && stats.totalReviews > 0 && (
          <span className="reviews-count">{stats.totalReviews} reviews</span>
        )}
      </div>

      {stats && stats.totalReviews > 0 ? (
        <>
          {/* Summary panel */}
          <div className="reviews-summary">
            <div className="summary-score">
              <div className="big-score">{stats.averageRating}</div>
              <Stars value={stats.averageRating} size="lg" />
              <div className="score-label">Overall Rating</div>
            </div>

            <RatingDistribution reviews={reviews} />

            <div className="stat-bars">
              <StatBar label="Quality" value={stats.breakdown?.quality} />
              <StatBar label="Communication" value={stats.breakdown?.communication} />
              <StatBar label="Punctuality" value={stats.breakdown?.punctuality} />
              <StatBar label="Professionalism" value={stats.breakdown?.professionalism} />
              <StatBar label="Payment Timeliness" value={stats.breakdown?.paymentTimeliness} />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="review-filters">
            {[
              { key: "all", label: "All Reviews" },
              { key: "sme", label: "From Clients" },
              { key: "freelancer", label: "From Freelancers" },
            ].map((f) => (
              <button
                key={f.key}
                className={`filter-tab ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Review cards */}
          <div className="review-cards-list">
            {filtered.length === 0 ? (
              <p className="no-reviews-filter">No reviews in this category yet.</p>
            ) : (
              filtered.map((r) => <ReviewCard key={r._id} review={r} />)
            )}
          </div>
        </>
      ) : (
        <div className="no-reviews">
          <div className="no-reviews-icon">☆</div>
          <p>No reviews yet. Complete a project to receive your first review!</p>
        </div>
      )}
    </div>
  );
}

