import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [animateStats, setAnimateStats] = useState(false);
  const [statValues, setStatValues] = useState({ freelancers: 0, projects: 0, payments: 0, satisfaction: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroOffset, setHeroOffset] = useState(0);
  const heroRef = useRef(null);

  // Parallax effect on hero section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setHeroOffset(scrollY * 0.5);
      
      // Calculate scroll progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (scrollY / docHeight) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !animateStats) {
          setAnimateStats(true);
          animateCounter();
        }
      },
      { threshold: 0.2 }
    );

    const statsSection = document.querySelector(".stats-section");
    if (statsSection) observer.observe(statsSection);
    return () => observer.disconnect();
  }, [animateStats]);

  const animateCounter = () => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setStatValues({
        freelancers: Math.floor((500 / 30) * frame),
        projects: Math.floor((200 / 30) * frame),
        payments: Math.floor((10 / 30) * frame),
        satisfaction: Math.floor((98 / 30) * frame),
      });
      if (frame >= 30) clearInterval(interval);
    }, 30);
  };

  const scrollToSection = (sectionClass) => {
    const section = document.querySelector(`.${sectionClass}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="home">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ── Hero ── */}
      <section className="hero" ref={heroRef} style={{ transform: `translateY(${heroOffset * 0.3}px)` }}>
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
          <button className="hero-scroll-hint" onClick={() => scrollToSection("stats-section")}>
            ↓ Explore More
          </button>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <p className="stat-number">{animateStats ? statValues.freelancers : 0}+</p>
            <p className="stat-label">Freelancers</p>
          </div>
          <div className="stat-item">
            <p className="stat-number">{animateStats ? statValues.projects : 0}+</p>
            <p className="stat-label">Projects Posted</p>
          </div>
          <div className="stat-item">
            <p className="stat-number">₹{animateStats ? statValues.payments : 0}L+</p>
            <p className="stat-label">Payments Processed</p>
          </div>
          <div className="stat-item">
            <p className="stat-number">{animateStats ? statValues.satisfaction : 0}%</p>
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
            <div className="how-steps-full">
              {[
                ["📝 Post a Project", "Describe your project, set a budget and deadline. Get AI-powered cost estimation instantly."],
                ["🔍 Smart Matching", "Our AI engine matches your project with the best freelancers based on skills, experience, and availability."],
                ["💬 Collaborate", "Use built-in chat and file sharing to communicate with freelancers, share requirements, and track progress."],
                ["💰 Secure Payment", "Fund escrow via eSewa. Payment is held safely and released once work is approved. No disputes."],
              ].map(([title, desc], i) => (
                <div className="how-step-full" key={i}>
                  <span className="step-num">{i + 1}</span>
                  <div><strong>{title}</strong><p>{desc}</p></div>
                </div>
              ))}
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
              ["⚖️", "Dispute Resolution", "Admin-mediated dispute resolution ensures fair outcomes for both parties if issues arise."],
              ["🎯", "Smart Matching", "AI-powered matching algorithm connects projects with the most suitable freelancers based on skills, experience, and availability."],
              ["📊", "Performance Analytics", "Track project metrics, freelancer performance, success rates, and earnings with detailed dashboards."],
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

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="section-inner">
          <h2>Loved by Freelancers & SMEs</h2>
          <p className="section-sub">Real stories from TaskHive community members</p>
          <div className="testimonials-grid">
            {[
              {
                name: "Priya Sharma",
                role: "Web Developer",
                text: "TaskHive helped me find consistent work and build my portfolio. The secure escrow system gives me peace of mind.",
                rating: 5,
              },
              {
                name: "Ramesh Poudel",
                role: "SME, Marketing Agency",
                text: "Finding vetted freelancers used to be a nightmare. Now I post projects and get quality proposals within hours.",
                rating: 5,
              },
              {
                name: "Anita Gautam",
                role: "Graphic Designer",
                text: "Professional platform with fair pricing. The payment system is transparent and reliable. Highly recommended.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className={j < testimonial.rating ? "star filled" : "star"}>★</span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <p className="author-name">{testimonial.name}</p>
                  <p className="author-role">{testimonial.role}</p>
                </div>
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
              I'm an SME — Post a Project
            </button>
            <button className="cta-btn-secondary" onClick={() => navigate("/register")}>
              I'm a Freelancer — Find Work
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

