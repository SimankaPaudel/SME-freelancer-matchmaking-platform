import "./Home.css";

export default function Home() {
  return (
    <div className="home">
      <div className="home-container">
        <h1>Find Work. Hire Talent.</h1>
        <p>
          A modern freelancing platform connecting skilled professionals with
          growing businesses.
        </p>

        <div className="home-actions">
          <button className="primary-btn">Get Started</button>
          <button className="secondary-btn">Learn More</button>
        </div>
      </div>
    </div>
  );
}
