import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitReview, getReviewByEscrow } from "../services/reviewService";
import "./Review.css";

// ─── Star Rating Widget ──────────────────────────────────────
function StarRating({ label, value, onChange, description }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-field">
      <div className="star-field-header">
        <span className="star-label">{label}</span>
        {description && <span className="star-desc">{description}</span>}
      </div>
      <div className="stars" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${(hovered || value) >= star ? "filled" : ""}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`${star} star`}
          >
            ★
          </button>
        ))}
        <span className="star-value">
          {value ? `${value}/5` : "Not rated"}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function SubmitReview() {
  const { escrowId } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // SME → Freelancer ratings
  const [quality, setQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);

  // Freelancer → SME ratings
  const [smeProfessionalism, setSmeProfessionalism] = useState(0);
  const [smeCommunication, setSmeCommunication] = useState(0);
  const [paymentTimeliness, setPaymentTimeliness] = useState(0);

  // Shared
  const [comment, setComment] = useState("");

  useEffect(() => {
    // Read role from stored user object
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setRole(user.role || "");
    } catch {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setRole(payload.role || "");
        } catch {}
      }
    }

    // Check if already reviewed
    getReviewByEscrow(escrowId)
      .then((res) => {
        if (res.data.myReview) setAlreadyReviewed(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [escrowId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const isSME = role === "SME";

    // Validation
    if (isSME && (!quality || !communication || !punctuality || !professionalism)) {
      setError("Please rate all four categories before submitting.");
      return;
    }
    if (!isSME && (!smeProfessionalism || !smeCommunication || !paymentTimeliness)) {
      setError("Please rate all three categories before submitting.");
      return;
    }
    if (isSME && !comment.trim()) {
      setError("Written feedback is required.");
      return;
    }

    const payload = {
      escrowId,
      comment,
      ...(isSME
        ? {
            qualityRating: quality,
            communicationRating: communication,
            punctualityRating: punctuality,
            professionalismRating: professionalism,
          }
        : {
            sme_professionalismRating: smeProfessionalism,
            sme_communicationRating: smeCommunication,
            paymentTimelinessRating: paymentTimeliness,
          }),
    };

    try {
      setSubmitting(true);
      await submitReview(payload);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-loading">
          <div className="review-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="review-page">
        <div className="review-done-card">
          <div className="done-icon">✓</div>
          <h2>Review Submitted</h2>
          <p>You've already reviewed this project. Thank you for your feedback!</p>
          <button className="btn-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="review-page">
        <div className="review-done-card success">
          <div className="done-icon success-icon">★</div>
          <h2>Thank You!</h2>
          <p>Thank you for sending your review.</p>
          <button className="btn-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isSME = role === "SME";

  return (
    <div className="review-page">
      <div className="review-container">
        {/* Header */}
        <div className="review-header">
          <div className="review-header-accent" />
          <div className="review-header-content">
            <span className="review-badge">
              {isSME ? "Review Freelancer" : "Review SME"}
            </span>
            <h1>Share Your Experience</h1>
            <p>
              {isSME
                ? "Your honest feedback helps the community and rewards great freelancers."
                : "Help other freelancers know what it's like to work with this client."}
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="ratings-grid">
            {isSME ? (
              <>
                <StarRating
                  label="Quality of Work"
                  description="How well did the deliverables meet your expectations?"
                  value={quality}
                  onChange={setQuality}
                />
                <StarRating
                  label="Communication"
                  description="Was the freelancer responsive and clear?"
                  value={communication}
                  onChange={setCommunication}
                />
                <StarRating
                  label="Punctuality"
                  description="Did they deliver on time or ahead of schedule?"
                  value={punctuality}
                  onChange={setPunctuality}
                />
                <StarRating
                  label="Professionalism"
                  description="Overall conduct and work ethic."
                  value={professionalism}
                  onChange={setProfessionalism}
                />
              </>
            ) : (
              <>
                <StarRating
                  label="Professionalism"
                  description="Was the SME respectful and professional throughout?"
                  value={smeProfessionalism}
                  onChange={setSmeProfessionalism}
                />
                <StarRating
                  label="Communication"
                  description="Were requirements clear and communication timely?"
                  value={smeCommunication}
                  onChange={setSmeCommunication}
                />
                <StarRating
                  label="Payment Timeliness"
                  description="Was escrow funded and payment released promptly?"
                  value={paymentTimeliness}
                  onChange={setPaymentTimeliness}
                />
              </>
            )}
          </div>

          {/* Comment */}
          <div className="comment-field">
            <label htmlFor="comment">
              Written Feedback
              {isSME && <span className="required-badge">Required</span>}
              {!isSME && <span className="optional-badge">Optional</span>}
            </label>
            <textarea
              id="comment"
              rows={5}
              placeholder={
                isSME
                  ? "Describe your experience working with this freelancer. What did they do well? What could they improve?"
                  : "Anything you'd like to share about working with this client? (optional)"
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
            <span className="char-count">{comment.length}/1000</span>
          </div>

          {error && <div className="review-error">⚠️ {error}</div>}

          <div className="review-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Submitting...
                </span>
              ) : (
                "Submit Review ★"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

