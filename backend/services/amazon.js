// =============================================================
// services/amazon.js — Amazon Product Advertising API (PA API)
// =============================================================
// This file fetches deals from Amazon India using the official
// amazon-paapi npm package.
//
// REQUIREMENTS:
//   - An approved Amazon Associates (India) account
//   - PA API access (granted after making qualifying sales)
//   - Fill in AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG in .env
//
// DOCS: https://webservices.amazon.in/paapi5/documentation/
// =============================================================

const amazonPaapi = require("amazon-paapi");

// Step 1: Build the credentials object from .env values
// These are loaded by dotenv in server.js before this file runs.
const commonParameters = {
  AccessKey: process.env.AMAZON_ACCESS_KEY,
  SecretKey: process.env.AMAZON_SECRET_KEY,
  PartnerTag: process.env.AMAZON_PARTNER_TAG, // Your Associates tracking ID, e.g. "mysite-21"
  PartnerType: "Associates",
  Marketplace: "www.amazon.in",
};

// Step 2: Define which categories to search for deals
// These map to Amazon's "search index" values for India marketplace
const CATEGORIES = [
  { index: "Electronics", label: "Electronics" },
  { index: "Apparel", label: "Fashion" },
  { index: "HomeAndKitchen", label: "Home & Kitchen" },
  { index: "Beauty", label: "Beauty" },
];

// Step 3: Define the data fields we want Amazon to return for each product.
// Requesting only what we need keeps the response lean.
const RESOURCES = [
  "ItemInfo.Title",
  "Offers.Listings.Price",
  "Offers.Listings.SavingBasis",
  "Offers.Listings.DealsInfo",
  "Images.Primary.Large",
  "DetailPageURL",
];

// =============================================================
// Helper: Format a number as Indian Rupees (₹1,23,456)
// =============================================================
function formatINR(amount) {
  if (!amount && amount !== 0) return "N/A";
  return "₹" + Number(amount).toLocaleString("en-IN");
}

// =============================================================
// Helper: Fetch deals for one category from Amazon PA API
// =============================================================
async function fetchAmazonCategory(category) {
  // Check if credentials are configured
  if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY || !process.env.AMAZON_PARTNER_TAG) {
    console.warn(`[Amazon] Skipping "${category.label}" — credentials not configured in .env`);
    return [];
  }

  try {
    console.log(`[Amazon] Fetching deals for category: ${category.label}`);

    // Call the SearchItems PA API endpoint
    // Returns up to 10 items matching our search query + category
    const response = await amazonPaapi.SearchItems(commonParameters, {
      Keywords: "deals",
      SearchIndex: category.index,
      ItemCount: 10, // Fetch 10 items per category
      Resources: RESOURCES,
      // Sort by featured/relevance to get popular items
      SortBy: "Featured",
    });

    // If no results, return empty array
    if (!response?.SearchResult?.Items) {
      console.warn(`[Amazon] No items returned for category: ${category.label}`);
      return [];
    }

    const items = response.SearchResult.Items;

    // Step 4: Transform each Amazon API item into our normalized deal format
    // This format matches the Deal type used in the React frontend
    const deals = items
      .map((item) => {
        // --- Extract product details safely ---
        const title = item.ItemInfo?.Title?.DisplayValue || "Unknown Product";
        const image = item.Images?.Primary?.Large?.URL || null;
        const affiliateUrl = item.DetailPageURL || "#";

        // Deal price (what customer pays now)
        const dealPriceRaw = item.Offers?.Listings?.[0]?.Price?.Amount;
        // Original price (before discount / "struck through" price)
        const originalPriceRaw = item.Offers?.Listings?.[0]?.SavingBasis?.Amount;

        // Skip items that don't have pricing data
        if (!dealPriceRaw) return null;

        const dealPrice = Number(dealPriceRaw);
        const originalPrice = originalPriceRaw ? Number(originalPriceRaw) : dealPrice;

        // Calculate discount percentage
        const discountPercent =
          originalPrice > dealPrice
            ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
            : 0;

        // Only include items that actually have a discount
        if (discountPercent < 5) return null;

        // Build the normalized deal object
        // Field names match the frontend's Deal type exactly:
        // { store, title, price, original, off, tag, link, detail }
        return {
          store: "Amazon",
          title: title,
          price: formatINR(dealPrice),           // e.g. "₹1,499"
          original: formatINR(originalPrice),     // e.g. "₹4,990"
          off: `${discountPercent}% OFF`,         // e.g. "70% OFF"
          tag: category.label,                    // e.g. "Electronics"
          link: affiliateUrl,                     // Affiliate tracking URL
          detail: `${discountPercent}% discount on ${title}. Verified Amazon India deal.`,
          image: image,                           // Product image URL (bonus field)
          platform: "amazon",                     // For platform filtering
          category: category.label,               // For category filtering
          discountPercent: discountPercent,       // Raw number for sorting
        };
      })
      .filter(Boolean); // Remove null entries (items with no price/discount)

    console.log(`[Amazon] ✅ Got ${deals.length} deals for ${category.label}`);
    return deals;
  } catch (error) {
    // Log the error but don't crash — return empty array so other APIs still work
    console.error(`[Amazon] ❌ Error fetching ${category.label}:`, error.message || error);
    return [];
  }
}

// =============================================================
// Main Export: fetchAmazonDeals()
// Fetches deals from all categories in parallel for speed
// =============================================================
async function fetchAmazonDeals() {
  console.log("[Amazon] Starting deal fetch for all categories...");

  // Run all category fetches in parallel (faster than sequential)
  const results = await Promise.allSettled(CATEGORIES.map(fetchAmazonCategory));

  // Flatten all category results into a single array
  const allDeals = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  console.log(`[Amazon] Total deals fetched: ${allDeals.length}`);
  return allDeals;
}

module.exports = { fetchAmazonDeals };
