import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SnapDeals | Premium Deals Aggregator" },
      {
        name: "description",
        content:
          "SnapDeals curates premium offers from Amazon, Flipkart, Myntra and more in one modern deals aggregator.",
      },
      { property: "og:title", content: "SnapDeals | Premium Deals Aggregator" },
      {
        property: "og:description",
        content:
          "Discover curated, verified deals from top marketplaces with SnapDeals.",
      },
    ],
  }),
  component: Index,
});

const deals = [
  {
    store: "Amazon",
    title: "NoiseFit Halo Smartwatch",
    price: "₹2,299",
    original: "₹6,999",
    off: "67% OFF",
    tag: "Flash Pick",
  },
  {
    store: "Flipkart",
    title: "Samsung 4K Crystal TV",
    price: "₹31,990",
    original: "₹52,900",
    off: "40% OFF",
    tag: "Big Save",
  },
  {
    store: "Myntra",
    title: "Roadster Denim Jacket",
    price: "₹1,199",
    original: "₹3,499",
    off: "66% OFF",
    tag: "Style Drop",
  },
  {
    store: "Amazon",
    title: "boAt Airdopes ProGear",
    price: "₹1,499",
    original: "₹4,990",
    off: "70% OFF",
    tag: "Audio Deal",
  },
  {
    store: "Flipkart",
    title: "Apple iPad 10th Gen",
    price: "₹29,999",
    original: "₹39,900",
    off: "25% OFF",
    tag: "Editor Pick",
  },
  {
    store: "Myntra",
    title: "Nike Running Sneakers",
    price: "₹3,247",
    original: "₹7,995",
    off: "59% OFF",
    tag: "Hot Trend",
  },
];

const steps = [
  ["01", "Scan", "SnapDeals tracks price drops, bank offers, coupons, and limited-time marketplace campaigns."],
  ["02", "Verify", "Every offer is filtered for quality, freshness, and real savings before it reaches your feed."],
  ["03", "Save", "Open the best deal, compare value instantly, and purchase from the source you already trust."],
];

const features = [
  ["M12 3h9m-9 9m9-9v18", "Live deal intelligence", "Fresh, curated offers from leading marketplaces without endless scrolling."],
  ["M9 12l2 2 4-4m5-7a7 7 0 11-14 0 7 7 0 0114 0z", "Verified savings", "Real discounts surfaced with original prices, markdowns, and quick context."],
  ["M13 10V3L4 14h7v7l9-11h-7z", "Fast discovery", "Premium cards, simple filters, and clear signals help shoppers decide quickly."],
  ["M5 13l4 4L19 7M5 13V5l14 2v2", "Smart alerts", "Track drops for fashion, electronics, lifestyle, and everyday essentials."],
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sd-icon">
      <path d={path} />
    </svg>
  );
}

function Index() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="snapdeals-page">
      <nav className="sd-nav" aria-label="Main navigation">
        <a href="#top" className="sd-logo" aria-label="SnapDeals home">
          <span>Snap</span>Deals
        </a>
        <div className="sd-nav-links">
          <a href="#how">How it works</a>
          <a href="#deals">Deals</a>
          <a href="#features">Features</a>
        </div>
        <a href="#deals" className="sd-nav-cta">Browse deals</a>
      </nav>

      <section id="top" className="sd-hero">
        <div className="sd-hero-copy">
          <Reveal>
            <p className="sd-kicker">India’s sharper deal discovery layer</p>
            <h1>Premium deals, caught before everyone else.</h1>
            <p className="sd-hero-text">
              SnapDeals brings the best Amazon, Flipkart, and Myntra offers into one clean feed — verified, ranked, and ready to save you money.
            </p>
            <div className="sd-actions">
              <a href="#deals" className="sd-button sd-button-primary">Explore live offers</a>
              <a href="#how" className="sd-button sd-button-secondary">See how it works</a>
            </div>
          </Reveal>
        </div>

        <Reveal className="sd-hero-visual">
          <div className="sd-orbit-card sd-orbit-main">
            <span className="sd-pill">Today’s steal</span>
            <h2>iPhone accessories bundle</h2>
            <div className="sd-price-row"><strong>₹1,899</strong><span>₹4,999</span></div>
            <div className="sd-progress"><span /></div>
          </div>
          <div className="sd-orbit-card sd-orbit-top">
            <span>Amazon</span>
            <strong>72% off</strong>
          </div>
          <div className="sd-orbit-card sd-orbit-bottom">
            <span>Myntra</span>
            <strong>Style drop</strong>
          </div>
        </Reveal>
      </section>

      <section id="how" className="sd-section sd-how">
        <Reveal className="sd-section-heading">
          <p className="sd-kicker">How it works</p>
          <h2>From noisy marketplaces to one decisive deal feed.</h2>
        </Reveal>
        <div className="sd-steps">
          {steps.map(([number, title, copy]) => (
            <Reveal key={number} className="sd-step-card">
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="deals" className="sd-section">
        <Reveal className="sd-section-heading sd-heading-row">
          <div>
            <p className="sd-kicker">Sample offers</p>
            <h2>Glassmorphism deal cards built for quick decisions.</h2>
          </div>
          <a href="#cta" className="sd-inline-link">Get deal alerts</a>
        </Reveal>
        <div className="sd-deals-grid">
          {deals.map((deal) => (
            <Reveal key={`${deal.store}-${deal.title}`} className="sd-deal-card">
              <div className="sd-card-topline">
                <span>{deal.store}</span>
                <em>{deal.tag}</em>
              </div>
              <h3>{deal.title}</h3>
              <div className="sd-price-row">
                <strong>{deal.price}</strong>
                <span>{deal.original}</span>
              </div>
              <div className="sd-deal-bottom">
                <b>{deal.off}</b>
                <a href="#cta" aria-label={`View ${deal.title} deal`}>View deal</a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="features" className="sd-section sd-features">
        <Reveal className="sd-section-heading">
          <p className="sd-kicker">Built for modern shoppers</p>
          <h2>Minimal on the surface. Powerful under the hood.</h2>
        </Reveal>
        <div className="sd-feature-grid">
          {features.map(([path, title, copy]) => (
            <Reveal key={title} className="sd-feature-card">
              <Icon path={path} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className="sd-cta" id="cta">
        <div>
          <p className="sd-kicker">Never miss a markdown</p>
          <h2>Start catching smarter deals today.</h2>
        </div>
        <a href="mailto:hello@snapdeals.example" className="sd-button sd-button-inverse">Join early access</a>
      </Reveal>

      <footer className="sd-footer">
        <a href="#top" className="sd-logo"><span>Snap</span>Deals</a>
        <div className="sd-footer-links">
          <a href="#how">Process</a>
          <a href="#deals">Offers</a>
          <a href="#features">Features</a>
          <a href="mailto:hello@snapdeals.example">Contact</a>
        </div>
        <p>© 2026 SnapDeals. Curated savings, beautifully delivered.</p>
      </footer>
    </main>
  );
}
