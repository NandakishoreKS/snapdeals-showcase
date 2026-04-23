// =============================================================
// routes/deals.js — /api/deals Route Handler + Cron Cache
// =============================================================
// This file does three things:
//   1. Handles GET /api/deals (with optional query filters)
//   2. Manages the deals.json cache file
//   3. Exports startCronJob() to refresh data every 6 hours
// =============================================================

const express = require("express");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

// Import our API service modules
const { fetchAmazonDeals } = require("../services/amazon");
const { fetchFlipkartDeals } = require("../services/flipkart");

const router = express.Router();

// Path to the local cache file — stored in the backend/ folder
const CACHE_FILE = path.join(__dirname, "..", "deals.json");

// =============================================================
// Cache Helpers
// =============================================================

/**
 * Reads deals from the local deals.json cache file.
 * Returns an empty array if the file doesn't exist or is corrupted.
 */
function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      console.warn("[Cache] deals.json not found — returning empty array");
      return [];
    }
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed.deals || [];
  } catch (error) {
    console.error("[Cache] Failed to read deals.json:", error.message);
    return [];
  }
}

/**
 * Writes the provided deals array to deals.json with a timestamp.
 * This is called after a successful API refresh.
 */
function writeCache(deals) {
  try {
    const payload = {
      lastRefreshed: new Date().toISOString(),
      totalDeals: deals.length,
      deals: deals,
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), "utf-8");
    console.log(`[Cache] ✅ Saved ${deals.length} deals to deals.json at ${payload.lastRefreshed}`);
  } catch (error) {
    console.error("[Cache] ❌ Failed to write deals.json:", error.message);
  }
}

/**
 * Reads the last refreshed timestamp from the cache file.
 * Returns null if the file doesn't exist.
 */
function getCacheTimestamp() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed.lastRefreshed || null;
  } catch {
    return null;
  }
}

// =============================================================
// Core: Refresh Deals from APIs
// =============================================================

/**
 * Fetches fresh deals from Amazon and Flipkart in parallel.
 * If both fail, the cache is left untouched (fallback stays valid).
 * If at least one succeeds, the cache is updated.
 */
async function refreshDeals() {
  console.log("\n[Refresh] ⏳ Starting deal refresh...");

  // Run both API calls in parallel — if one fails, the other still works
  const [amazonDeals, flipkartDeals] = await Promise.allSettled([
    fetchAmazonDeals(),
    fetchFlipkartDeals(),
  ]);

  const amazon = amazonDeals.status === "fulfilled" ? amazonDeals.value : [];
  const flipkart = flipkartDeals.status === "fulfilled" ? flipkartDeals.value : [];

  if (amazonDeals.status === "rejected") {
    console.error("[Refresh] Amazon fetch failed:", amazonDeals.reason?.message);
  }
  if (flipkartDeals.status === "rejected") {
    console.error("[Refresh] Flipkart fetch failed:", flipkartDeals.reason?.message);
  }

  // Merge all deals from both platforms
  const combined = [...amazon, ...flipkart];

  if (combined.length === 0) {
    console.warn("[Refresh] ⚠️  No deals fetched from any API. Cache not updated — serving existing fallback.");
    return;
  }

  // Sort by highest discount percentage (best deals first)
  combined.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));

  // Save to cache file
  writeCache(combined);
  console.log(`[Refresh] ✅ Refresh complete. ${combined.length} deals cached (Amazon: ${amazon.length}, Flipkart: ${flipkart.length})`);
}

// =============================================================
// Cron Job: Auto-refresh every 6 hours
// =============================================================

// Starts the background cron job.
// Called once from server.js on startup.
// Cron schedule: "0 */6 * * *" = runs at 00:00, 06:00, 12:00, 18:00 every day
function startCronJob() {
  console.log("[Cron] ✅ Scheduled deal refresh every 6 hours");

  // Run immediately on server start (populate cache right away)
  refreshDeals().catch((error) => {
    console.error("[Cron] Initial refresh failed:", error.message);
  });

  // Then schedule to run every 6 hours
  cron.schedule("0 */6 * * *", () => {
    console.log(`\n[Cron] ⏰ Triggered scheduled refresh at ${new Date().toISOString()}`);
    refreshDeals().catch((error) => {
      console.error("[Cron] Scheduled refresh failed:", error.message);
    });
  });
}

// =============================================================
// GET /api/deals
// =============================================================
// Query params (all optional):
//   ?category=Electronics  — filter by category name (case-insensitive)
//   ?platform=amazon       — filter by platform ("amazon" or "flipkart")
//   ?search=keyword        — filter by keyword in title (bonus)
//
// Returns: JSON array of deal objects, sorted by discount % descending
// =============================================================

router.get("/", (req, res) => {
  try {
    // Step 1: Load deals from cache (always serve from cache for speed)
    let deals = readCache();
    const cacheTimestamp = getCacheTimestamp();

    if (deals.length === 0) {
      // Cache is completely empty (first run, no APIs configured yet)
      return res.json({
        success: true,
        lastRefreshed: null,
        totalDeals: 0,
        deals: [],
        message: "No deals available yet. Please configure API keys and restart the server.",
      });
    }

    // Step 2: Apply filters from query string
    const { category, platform, search } = req.query;

    // Filter by category (case-insensitive)
    if (category && category.toLowerCase() !== "all") {
      deals = deals.filter(
        (deal) => deal.category?.toLowerCase() === category.toLowerCase() ||
                  deal.tag?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by platform ("amazon" or "flipkart")
    if (platform && platform.toLowerCase() !== "all") {
      deals = deals.filter(
        (deal) => deal.platform?.toLowerCase() === platform.toLowerCase() ||
                  deal.store?.toLowerCase() === platform.toLowerCase()
      );
    }

    // Filter by search keyword (title + store + tag)
    if (search && search.trim()) {
      const keyword = search.trim().toLowerCase();
      deals = deals.filter(
        (deal) =>
          deal.title?.toLowerCase().includes(keyword) ||
          deal.store?.toLowerCase().includes(keyword) ||
          deal.tag?.toLowerCase().includes(keyword) ||
          deal.detail?.toLowerCase().includes(keyword)
      );
    }

    // Step 3: Return the filtered results
    return res.json({
      success: true,
      lastRefreshed: cacheTimestamp,
      totalDeals: deals.length,
      filters: { category: category || null, platform: platform || null, search: search || null },
      deals: deals,
    });
  } catch (error) {
    console.error("[GET /api/deals] Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to load deals. Please try again.",
      deals: [],
    });
  }
});

// =============================================================
// POST /api/deals/refresh  (manual refresh trigger)
// Useful for testing — lets you force a refresh without waiting 6 hours
// =============================================================
router.post("/refresh", async (req, res) => {
  try {
    console.log("[Manual Refresh] Triggered via POST /api/deals/refresh");
    await refreshDeals();
    const deals = readCache();
    return res.json({
      success: true,
      message: `Refresh complete. ${deals.length} deals cached.`,
      lastRefreshed: getCacheTimestamp(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Refresh failed: " + error.message,
    });
  }
});

module.exports = router;
module.exports.startCronJob = startCronJob;
module.exports.refreshDeals = refreshDeals;
