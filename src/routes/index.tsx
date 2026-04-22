import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

type Deal = {
  store: string;
  title: string;
  price: string;
  original: string;
  off: string;
  tag: string;
  link: string;
  detail: string;
};

const navItems = [
  ["#top", "Home"],
  ["#how", "How it works"],
  ["#deals", "Deals"],
  ["#features", "Features"],
  ["#cta", "Sign up"],
] as const;

const deals: Deal[] = [
  {
    store: "Amazon",
    title: "NoiseFit Halo Smartwatch",
    price: "₹2,299",
    original: "₹6,999",
    off: "67% OFF",
    tag: "Flash Pick",
    link: "https://snapdeals.example/deals/noisefit-halo",
    detail: "AMOLED display, premium metal build, Bluetooth calling, and a verified lightning markdown.",
  },
  {
    store: "Flipkart",
    title: "Samsung 4K Crystal TV",
    price: "₹31,990",
    original: "₹52,900",
    off: "40% OFF",
    tag: "Big Save",
    link: "https://snapdeals.example/deals/samsung-crystal-4k",
    detail: "Bank-card stacked pricing on a 43-inch 4K panel with HDR, smart apps, and low delivery fee.",
  },
  {
    store: "Myntra",
    title: "Roadster Denim Jacket",
    price: "₹1,199",
    original: "₹3,499",
    off: "66% OFF",
    tag: "Style Drop",
    link: "https://snapdeals.example/deals/roadster-denim",
    detail: "Season-ready denim layer with coupon-inclusive pricing and all core sizes currently in stock.",
  },
  {
    store: "Amazon",
    title: "boAt Airdopes ProGear",
    price: "₹1,499",
    original: "₹4,990",
    off: "70% OFF",
    tag: "Audio Deal",
    link: "https://snapdeals.example/deals/boat-airdopes-progear",
    detail: "Low-latency earbuds with fast charging, clean call mics, and a short-window launch discount.",
  },
  {
    store: "Flipkart",
    title: "Apple iPad 10th Gen",
    price: "₹29,999",
    original: "₹39,900",
    off: "25% OFF",
    tag: "Editor Pick",
    link: "https://snapdeals.example/deals/ipad-10th-gen",
    detail: "Trusted seller deal with instant card savings on the 64GB Wi‑Fi model in multiple colors.",
  },
  {
    store: "Myntra",
    title: "Nike Running Sneakers",
    price: "₹3,247",
    original: "₹7,995",
    off: "59% OFF",
    tag: "Hot Trend",
    link: "https://snapdeals.example/deals/nike-running-sneakers",
    detail: "Comfort running silhouette with fresh inventory, exchange support, and stacked style-sale pricing.",
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

const footerGroups: Array<[string, string[]]> = [
  ["Product", ["Deal feed", "Price alerts", "Browser extension", "Mobile app"]],
  ["Resources", ["Savings guide", "Marketplace reports", "Coupon playbook", "Help center"]],
  ["Company", ["About", "Careers", "Partner with us", "Press"]],
];

function Reveal({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <div id={id} className={`reveal ${className}`}>{children}</div>;
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sd-icon">
      <path d={path} />
    </svg>
  );
}

function Index() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [copiedLink, setCopiedLink] = useState("");
  const [activeSection, setActiveSection] = useState("#top");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (reducedMotion) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

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

  useEffect(() => {
    const sectionIds = navItems.map(([href]) => href.slice(1));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(`#${visible.target.id}`);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0.08, 0.18, 0.32] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedDeal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDeal(null);
    };
    document.body.classList.add("sd-modal-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("sd-modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedDeal]);

  const copyDealLink = async (deal: Deal) => {
    await navigator.clipboard.writeText(deal.link);
    setCopiedLink(deal.link);
    toast.success("Deal link copied", { description: `${deal.title} is ready to share.` });
    window.setTimeout(() => setCopiedLink(""), 1800);
  };

  const handleTilt = (event: React.PointerEvent<HTMLElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -12;
    card.style.setProperty("--tilt-x", `${y}deg`);
    card.style.setProperty("--tilt-y", `${x}deg`);
  };

  const resetTilt = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <main className="snapdeals-page">
      <nav className="sd-nav" aria-label="Main navigation">
        <a href="#top" className="sd-logo" aria-label="SnapDeals home">
          <span>Snap</span>Deals
        </a>
        <div className="sd-nav-links">
          {navItems.map(([href, label]) => (
            <a key={href} href={href} className={activeSection === href ? "is-active" : undefined}>{label}</a>
          ))}
        </div>
        <a href="#cta" className="sd-nav-cta">Join free</a>
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
            <Reveal key={`${deal.store}-${deal.title}`} className="sd-deal-card-wrap">
              <article
                className="sd-deal-card"
                onPointerMove={handleTilt}
                onPointerLeave={resetTilt}
              >
                <div className="sd-card-topline">
                  <span>{deal.store}</span>
                  <em>{deal.tag}</em>
                </div>
                <h3>{deal.title}</h3>
                <p>{deal.detail}</p>
                <div className="sd-price-row">
                  <strong>{deal.price}</strong>
                  <span>{deal.original}</span>
                </div>
                <div className="sd-deal-bottom">
                  <b>{deal.off}</b>
                  <button type="button" onClick={() => setSelectedDeal(deal)}>Quick view</button>
                </div>
                <button type="button" className="sd-copy-link" onClick={() => copyDealLink(deal)}>
                  {copiedLink === deal.link ? "Copied link" : "Copy deal link"}
                </button>
              </article>
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
          <h2>Get elite deal alerts before the crowd.</h2>
          <p>Join shoppers using SnapDeals to track trusted drops across Amazon, Flipkart, Myntra, and more.</p>
        </div>
        <div className="sd-cta-actions">
          <a href="mailto:hello@snapdeals.example" className="sd-button sd-button-inverse">Start free alerts</a>
          <a href="#deals" className="sd-cta-link">Browse sample deals</a>
        </div>
      </Reveal>

      <footer className="sd-footer">
        <div className="sd-footer-brand">
          <a href="#top" className="sd-logo"><span>Snap</span>Deals</a>
          <p>Curated savings, beautifully delivered for modern Indian shoppers.</p>
          <form className="sd-newsletter" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="newsletter-email">Deal memo</label>
            <div>
              <input id="newsletter-email" type="email" placeholder="you@example.com" aria-label="Email address" />
              <button type="submit">Subscribe</button>
            </div>
          </form>
        </div>
        <div className="sd-footer-groups">
          {footerGroups.map(([title, links]) => (
            <div key={title} className="sd-footer-group">
              <h3>{title}</h3>
              {links.map((link) => (
                <a key={link} href="#top">{link}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="sd-footer-bottom">
          <p>© 2026 SnapDeals. All rights reserved.</p>
          <div>
            <a href="#top">Privacy</a>
            <a href="#top">Terms</a>
          </div>
        </div>
      </footer>

      {selectedDeal && (
        <div className="sd-modal" role="dialog" aria-modal="true" aria-labelledby="deal-modal-title" onMouseDown={() => setSelectedDeal(null)}>
          <div className="sd-modal-card" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="sd-modal-close" onClick={() => setSelectedDeal(null)} aria-label="Close quick view">×</button>
            <span className="sd-pill">{selectedDeal.store} · {selectedDeal.tag}</span>
            <h2 id="deal-modal-title">{selectedDeal.title}</h2>
            <p>{selectedDeal.detail}</p>
            <div className="sd-price-row"><strong>{selectedDeal.price}</strong><span>{selectedDeal.original}</span></div>
            <div className="sd-modal-actions">
              <a href="#cta" className="sd-button sd-button-primary" onClick={() => setSelectedDeal(null)}>Sign up for this deal</a>
              <button type="button" className="sd-button sd-button-secondary" onClick={() => copyDealLink(selectedDeal)}>
                {copiedLink === selectedDeal.link ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
