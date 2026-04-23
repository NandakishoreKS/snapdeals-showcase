import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// =============================================================
// API CONFIG
// Change this URL when deploying to production (your Render URL)
// =============================================================
const API_BASE_URL = "http://localhost:5000";

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

// Deal type — matches exactly what the backend returns.
// Fields map to the existing card HTML structure.
type Deal = {
  store: string;       // "Amazon" | "Flipkart"
  title: string;       // Product name
  price: string;       // Deal price, formatted: "₹1,499"
  original: string;    // Original price, formatted: "₹4,990"
  off: string;         // Discount label: "70% OFF"
  tag: string;         // Category label: "Electronics"
  link: string;        // Affiliate URL (opens in new tab)
  detail: string;      // Short description
  image?: string | null;
  platform?: string;   // "amazon" | "flipkart"
  category?: string;   // For filtering
  discountPercent?: number;
};

// Category filter tabs shown above the deals grid
const CATEGORY_TABS = [
  { label: "All Deals", value: "all" },
  { label: "Electronics", value: "Electronics" },
  { label: "Fashion", value: "Fashion" },
  { label: "Home & Kitchen", value: "Home & Kitchen" },
  { label: "Beauty", value: "Beauty" },
] as const;

const navItems = [
  ["#top", "Home"],
  ["#how", "How it works"],
  ["#deals", "Deals"],
  ["#features", "Features"],
  ["#cta", "Sign up"],
] as const;

// NOTE: Hardcoded deals array removed.
// Deals are now fetched live from the Express backend API.

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

  // ── API State ──────────────────────────────────────────────
  // apiDeals: full list of deals loaded from the backend
  const [apiDeals, setApiDeals] = useState<Deal[]>([]);
  // loading: true while the first fetch is in progress
  const [loading, setLoading] = useState(true);
  // error: non-null when the API fetch has failed
  const [error, setError] = useState<string | null>(null);
  // searchQuery: text typed in the search bar (client-side filter)
  const [searchQuery, setSearchQuery] = useState("");
  // activeCategory: which category tab is selected
  const [activeCategory, setActiveCategory] = useState<string>("all");
  // refreshInterval ref so we can clear it on unmount
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch deals from backend API ───────────────────────────
  const fetchDeals = useCallback(
    async (category: string = activeCategory) => {
      try {
        // Build the URL — append category filter if not "all"
        const url =
          category && category !== "all"
            ? `${API_BASE_URL}/api/deals?category=${encodeURIComponent(category)}`
            : `${API_BASE_URL}/api/deals`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Unknown API error");
        }

        setApiDeals(data.deals || []);
        setError(null);
      } catch (err) {
        console.error("[SnapDeals] Failed to fetch deals:", err);
        setError("Deals loading, please try again.");
      } finally {
        // Always stop the skeleton loader after the first attempt
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── On mount: initial fetch + 30-min auto-refresh ──────────
  useEffect(() => {
    fetchDeals("all");

    // Auto-refresh every 30 minutes (1800000 ms)
    refreshIntervalRef.current = setInterval(() => {
      console.log("[SnapDeals] Auto-refreshing deals...");
      fetchDeals(activeCategory);
    }, 30 * 60 * 1000);

    return () => {
      // Cleanup the interval when the component unmounts
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reveal animation observer ──────────────────────────────
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
  }, [apiDeals]); // Re-run when deals change so new cards get observed

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
            <p className="sd-kicker">Live offers</p>
            <h2>Real-time deals from Amazon &amp; Flipkart.</h2>
          </div>
          <a href="#cta" className="sd-inline-link">Get deal alerts</a>
        </Reveal>

        {/* ── Search Bar ───────────────────────────────────────── */}
        <Reveal className="sd-search-bar">
          <input
            id="deals-search"
            type="search"
            placeholder="Search deals — e.g. iPhone, Nike, Samsung..."
            aria-label="Search deals"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Reveal>

        {/* ── Category Filter Tabs ─────────────────────────────── */}
        <Reveal className="sd-category-tabs">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`sd-tab-btn${activeCategory === tab.value ? " is-active" : ""}`}
              onClick={() => {
                setActiveCategory(tab.value);
                setLoading(true);
                fetchDeals(tab.value);
                // Clear search when switching categories
                setSearchQuery("");
              }}
            >
              {tab.label}
            </button>
          ))}
        </Reveal>

        {/* ── Error Banner ─────────────────────────────────────── */}
        {error && !loading && (
          <div className="sd-error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchDeals(activeCategory);
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Deals Grid ───────────────────────────────────────── */}
        <div className="sd-deals-grid">
          {/* Skeleton loading cards — shown while fetching */}
          {loading && (
            <>
              {[1, 2, 3].map((n) => (
                <div key={n} className="sd-deal-card-wrap">
                  <div className="sd-deal-card sd-skeleton" aria-busy="true" aria-label="Loading deal...">
                    <div className="sd-skeleton-line sd-skeleton-short" />
                    <div className="sd-skeleton-line sd-skeleton-long" style={{ marginTop: 20 }} />
                    <div className="sd-skeleton-line sd-skeleton-medium" />
                    <div className="sd-skeleton-line sd-skeleton-short" style={{ marginTop: 30 }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Live deal cards — shown after fetch completes */}
          {!loading &&
            (() => {
              // Client-side search filter (applied on top of API category filter)
              const keyword = searchQuery.trim().toLowerCase();
              const visibleDeals = keyword
                ? apiDeals.filter(
                    (deal) =>
                      deal.title?.toLowerCase().includes(keyword) ||
                      deal.store?.toLowerCase().includes(keyword) ||
                      deal.tag?.toLowerCase().includes(keyword) ||
                      deal.detail?.toLowerCase().includes(keyword),
                  )
                : apiDeals;

              if (visibleDeals.length === 0) {
                return (
                  <div className="sd-empty-state">
                    <p>No deals found{keyword ? ` for "${searchQuery}"` : ""}.</p>
                    {keyword && (
                      <button type="button" onClick={() => setSearchQuery("")}>
                        Clear search
                      </button>
                    )}
                  </div>
                );
              }

              return visibleDeals.map((deal) => (
                <Reveal key={`${deal.store}-${deal.title}-${deal.price}`} className="sd-deal-card-wrap">
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
              ));
            })()}
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
              {/* Open affiliate link in new tab — required for affiliate compliance */}
              <a
                href={selectedDeal.link}
                target="_blank"
                rel="noopener noreferrer"
                className="sd-button sd-button-primary"
                onClick={() => setSelectedDeal(null)}
              >
                Get this deal
              </a>
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
