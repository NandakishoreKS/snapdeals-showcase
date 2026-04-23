// =============================================================
// services/flipkart.js — Flipkart Affiliate Feed API
// =============================================================
// This file fetches deals from the Flipkart Affiliate Feed API.
//
// NOTE: The Flipkart Affiliate Feed API is officially deprecated
// and may have limited availability. We handle failures gracefully.
//
// REQUIREMENTS:
//   - A Flipkart Affiliate account: https://affiliate.flipkart.com
//   - Fill FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN in .env
//
// API DOCS: https://affiliate.flipkart.com/static-pages/api-docs
// =============================================================

const axios = require("axios");

// The Flipkart Affiliate "All Offers" feed endpoint
// This returns a list of current deals across all categories
const FLIPKART_FEED_URL =
  "https://affiliate-api.flipkart.net/affiliate/offers/v1/feeds/all";

// =============================================================
// Helper: Format a number as Indian Rupees
// =============================================================
function formatINR(amount) {
  if (!amount && amount !== 0) return "N/A";
  return "₹" + Number(amount).toLocaleString("en-IN");
}

// =============================================================
// Helper: Map a Flipkart category string to a normalized label
// =============================================================
function normalizeCategory(category) {
  if (!category) return "Other";
  const lower = category.toLowerCase();
  if (lower.includes("electronic") || lower.includes("mobil") || lower.includes("laptop")) return "Electronics";
  if (lower.includes("fashion") || lower.includes("cloth") || lower.includes("apparel") || lower.includes("shoes")) return "Fashion";
  if (lower.includes("home") || lower.includes("kitchen") || lower.includes("furniture")) return "Home & Kitchen";
  if (lower.includes("beauty") || lower.includes("health") || lower.includes("personal")) return "Beauty";
  return "Other";
}

// =============================================================
// Main Export: fetchFlipkartDeals()
// =============================================================
async function fetchFlipkartDeals() {
  // Check if credentials are configured
  if (!process.env.FLIPKART_AFFILIATE_ID || !process.env.FLIPKART_AFFILIATE_TOKEN) {
    console.warn("[Flipkart] Skipping — credentials not configured in .env");
    return [];
  }

  try {
    console.log("[Flipkart] Fetching deals from Affiliate Feed API...");

    // Step 1: Make the HTTP request to Flipkart's feed endpoint
    // Authentication is done via request headers
    const response = await axios.get(FLIPKART_FEED_URL, {
      headers: {
        // Flipkart requires these two auth headers
        "Fk-Affiliate-Id": process.env.FLIPKART_AFFILIATE_ID,
        "Fk-Affiliate-Token": process.env.FLIPKART_AFFILIATE_TOKEN,
        "Accept": "application/json",
        "User-Agent": "SnapDeals-Backend/1.0",
      },
      timeout: 15000, // 15 second timeout — fail fast if API is slow
      // Flipkart returns gzipped JSON in some cases
      decompress: true,
    });

    // Step 2: Validate response structure
    // Flipkart API returns: { products: [...] } or { offers: [...] }
    const data = response.data;
    const rawProducts =
      data?.products ||
      data?.offers ||
      data?.result?.products ||
      [];

    if (!rawProducts.length) {
      console.warn("[Flipkart] API returned no products. The feed may be empty or the API is deprecated.");
      return [];
    }

    console.log(`[Flipkart] Raw products received: ${rawProducts.length}`);

    // Step 3: Transform each Flipkart item into our normalized deal format
    // This format matches the Deal type used in the React frontend exactly
    const deals = rawProducts
      .map((product) => {
        // --- Safely extract Flipkart product fields ---
        // Flipkart field names vary slightly between API versions
        const title =
          product.productName ||
          product.name ||
          product.title ||
          "Unknown Product";

        const image =
          product.imageUrls?.["400x400"] ||
          product.imageUrl ||
          product.image ||
          null;

        // Affiliate link — always use the trackingUrl for commission tracking
        const affiliateUrl =
          product.productBaseUrl ||
          product.url ||
          product.affiliateUrl ||
          "#";

        // Prices — Flipkart returns them as strings or numbers
        const dealPriceRaw =
          product.price?.value ||
          product.sellingPrice?.value ||
          product.discountedPrice ||
          product.price ||
          null;

        const originalPriceRaw =
          product.maximumRetailPrice?.value ||
          product.originalPrice?.value ||
          product.mrp ||
          null;

        // Skip items without pricing
        if (!dealPriceRaw) return null;

        const dealPrice = Number(String(dealPriceRaw).replace(/[^0-9.]/g, ""));
        const originalPrice = originalPriceRaw
          ? Number(String(originalPriceRaw).replace(/[^0-9.]/g, ""))
          : dealPrice;

        // Calculate discount %
        const discountPercent =
          originalPrice > dealPrice
            ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
            : (product.discount
              ? parseInt(product.discount)
              : 0);

        // Only include items with real discounts
        if (discountPercent < 5) return null;

        // Detect the category from Flipkart's category fields
        const rawCategory =
          product.categoryPath ||
          product.categoryName ||
          product.category ||
          "";
        const category = normalizeCategory(rawCategory);

        // Build the normalized deal object matching the frontend's Deal type
        return {
          store: "Flipkart",
          title: title,
          price: formatINR(dealPrice),           // e.g. "₹31,990"
          original: formatINR(originalPrice),     // e.g. "₹52,900"
          off: `${discountPercent}% OFF`,         // e.g. "40% OFF"
          tag: category,                          // e.g. "Electronics"
          link: affiliateUrl,                     // Affiliate tracking URL
          detail: `${discountPercent}% discount on ${title}. Verified Flipkart deal.`,
          image: image,                           // Product image URL
          platform: "flipkart",                   // For platform filtering
          category: category,                     // For category filtering
          discountPercent: discountPercent,       // Raw number for sorting
        };
      })
      .filter(Boolean); // Remove null entries

    console.log(`[Flipkart] ✅ Got ${deals.length} valid deals`);
    return deals;
  } catch (error) {
    // Specific error handling for common Flipkart API issues
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("[Flipkart] ❌ Authentication failed. Check FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN in .env");
    } else if (error.response?.status === 404) {
      console.error("[Flipkart] ❌ Feed endpoint not found. The Flipkart Affiliate Feed API may be fully deprecated.");
    } else if (error.code === "ECONNABORTED") {
      console.error("[Flipkart] ❌ Request timed out after 15 seconds.");
    } else {
      console.error("[Flipkart] ❌ Error:", error.message || error);
    }

    // Return empty array — Amazon results will still be served
    return [];
  }
}

module.exports = { fetchFlipkartDeals };
