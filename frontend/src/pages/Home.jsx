import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">🇳🇵 Nepal's #1 Freelance Platform</div>
          <h1>
            Find Work.<br />
            Hire Talent.<br />
            <span className="hero-highlight">Get Paid Safely.</span>
          </h1>
          <p className="hero-desc">
            TaskHive connects skilled freelancers with growing businesses across Nepal.
            Post projects, submit proposals, and transact securely through escrow payments.
          </p>
          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => navigate("/register")}>
              Get Started Free →
            </button>
            <button className="hero-btn-secondary" onClick={() => navigate("/login")}>
              I Have an Account
            </button>
          </div>
          <div className="hero-trust">
            <span>✅ Secure Escrow Payments</span>
            <span>✅ Verified Freelancers</span>
            <span>✅ AI Cost Estimation</span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <p className="stat-number">500+</p>
            <p className="stat-label">Freelancers</p>
          </div>
          <div className="stat-item">
            <p className="stat-number">200+</p>
            <p className="stat-label">Projects Posted</p>
          </div>
          <div className="stat-item">
            <p className="stat-number">₹10L+</p>
            <p className="stat-label">Payments Processed</p>
          </div>
          <div className="stat-item">
            <p className="stat-number">98%</p>
            <p className="stat-label">Satisfaction Rate</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-section">
        <div className="section-inner">
          <h2>How TaskHive Works</h2>
          <p className="section-sub">Simple, transparent, and secure — from posting to payment</p>
          <div className="how-grid">
            <div className="how-col">
              <h3>🏢 For SMEs</h3>
              <div className="how-steps">
                {[
                  ["Post a Project", "Describe your project, set a budget and deadline. Get AI-powered cost estimation instantly."],
                  ["Review Proposals", "Browse freelancer proposals, view CVs and portfolios, shortlist and accept the best fit."],
                  ["Fund Escrow", "Deposit payment securely via eSewa. Funds are held safely until work is approved."],
                  ["Approve & Release", "Review submitted work and release payment. Leave a review for the freelancer."],
                ].map(([title, desc], i) => (
                  <div className="how-step" key={i}>
                    <span className="step-num">{i + 1}</span>
                    <div><strong>{title}</strong><p>{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="how-divider" />
            <div className="how-col">
              <h3>👨‍💻 For Freelancers</h3>
              <div className="how-steps">
                {[
                  ["Browse Projects", "Find projects matching your skills. Filter by budget, deadline, and required expertise."],
                  ["Submit Proposal", "Send your bid with a proposal document and CV. Highlight your relevant experience."],
                  ["Complete Work", "Chat with the client, deliver quality work, and submit through the platform."],
                  ["Get Paid", "Payment is released from escrow directly to you once work is approved. Safe and guaranteed."],
                ].map(([title, desc], i) => (
                  <div className="how-step" key={i}>
                    <span className="step-num">{i + 1}</span>
                    <div><strong>{title}</strong><p>{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="section-inner">
          <h2>Why Choose TaskHive?</h2>
          <p className="section-sub">Built for Nepal's growing freelance economy</p>
          <div className="features-grid">
            {[
              ["🔒", "Escrow Protection", "Payments are held securely in escrow and only released when you approve the work. No more payment disputes."],
              ["🤖", "AI Cost Estimation", "Get instant AI-powered budget and timeline estimates based on project type, complexity, and real market data."],
              ["💬", "Real-time Chat", "Built-in messaging with file sharing keeps SMEs and freelancers connected throughout the project."],
              ["⭐", "Review System", "Transparent ratings and reviews help build trust. See who the top performers are before hiring."],
              ["📱", "eSewa Payments", "Pay and receive money using Nepal's most popular digital wallet. Fast, local, and familiar."],
              ["🛡️", "Dispute Resolution", "Admin-mediated dispute resolution ensures fair outcomes for both parties if issues arise."],
            ].map(([icon, title, desc]) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon">{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to Get Started?</h2>
          <p>Join TaskHive today — it's free to sign up</p>
          <div className="cta-actions">
            <button className="cta-btn-primary" onClick={() => navigate("/register")}>
              🏢 I'm an SME — Post a Project
            </button>
            <button className="cta-btn-secondary" onClick={() => navigate("/register")}>
              👨‍💻 I'm a Freelancer — Find Work
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <p>© 2026 TaskHive · Built for Nepal's freelance economy · Secure payments via eSewa</p>
      </footer>

    </div>
  );
}

