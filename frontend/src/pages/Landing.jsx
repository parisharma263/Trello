import { Link } from 'react-router-dom';
import '../Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      {/* 1. Navbar */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          <h2>Trello Clone</h2>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="auth-buttons">
          <Link to="/login" className="btn-login">Log in</Link>
          <Link to="/signup" className="btn-signup">Sign up</Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Manage your tasks smarter.</h1>
          <p className="hero-subtitle">
            Boost your productivity, collaborate seamlessly, and keep all your work perfectly organized in one place.
          </p>
          <Link to="/signup">
            <button className="cta-main-btn">Get Started — It's Free</button>
          </Link>
        </div>
        <div className="hero-visual">
          <div className="clean-hero-card">
            <div className="hero-list-item"><span className="check-icon">✓</span> Board Created</div>
            <div className="hero-list-item"><span className="check-icon">✓</span> Task Moved</div>
            <div className="hero-list-item"><span className="check-icon">✓</span> Goal Reached</div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-heading">Why choose us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Drag & Drop Boards</h3>
            <p>Organize your tasks visually. Move cards across lists effortlessly mimicking natural workflows.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Task Management</h3>
            <p>Add descriptions, due dates, checklists, and labels to keep everything perfectly granular.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-time Updates</h3>
            <p>Your workspace is deeply synchronized. Experience frictionless collaboration instantly.</p>
          </div>
        </div>
      </section>

      {/* 4. CTA Section */}
      <section id="pricing" className="cta-section">
        <div className="cta-box">
          <h2>Start organizing your work today</h2>
          <p>Join thousands of powerful teams pushing productivity forward.</p>
          <form className="email-cta-form" onSubmit={(e) => { e.preventDefault(); }}>
            <input type="email" placeholder="Enter your email" required />
            <Link to="/signup" className="cta-link-wrapper"><button type="submit">Sign Up</button></Link>
          </form>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">Trello Clone</div>
          <div className="footer-links">
            <a href="#!">Privacy Policy</a>
            <a href="#!">Terms of Service</a>
            <a href="#!">Contact Us</a>
          </div>
        </div>
        <p className="copyright">© 2026 Trello Clone. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
