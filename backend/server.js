// =============================================================
// server.js — SnapDeals Express API Server
// =============================================================
// This is the main entry point for the backend.
// It sets up Express, CORS, rate limiting, and mounts routes.
// Run with: node server.js
// =============================================================

// Step 1: Load environment variables from .env file
// This must be called BEFORE importing any other local modules
// so that process.env values are available everywhere.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Import our deals router (handles /api/deals)
const dealsRouter = require("./routes/deals");

// Import the cron job that refreshes deals every 6 hours
const { startCronJob } = require("./routes/deals");

// =============================================================
// App Setup
// =============================================================
const app = express();
const PORT = process.env.PORT || 5000;

// Step 2: Enable CORS
// This allows our frontend (running on a different port/domain)
// to make requests to this backend.
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:5173", // Vite default dev port
  "http://localhost:4173", // Vite preview port
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., curl, Postman, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed for this origin: " + origin));
    },
    methods: ["GET"],
    optionsSuccessStatus: 200,
  })
);

// Step 3: Parse JSON request bodies
app.use(express.json());

// Step 4: Rate limiting
// Prevents abuse — max 100 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait 15 minutes before trying again.",
  },
});
app.use("/api", limiter);

// =============================================================
// Routes
// =============================================================

// Health check — useful for Render.com uptime monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "SnapDeals API",
  });
});

// Main deals API — all deal endpoints are handled in routes/deals.js
app.use("/api/deals", dealsRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error("[SnapDeals Error]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// =============================================================
// Start Server
// =============================================================
app.listen(PORT, () => {
  console.log(`✅ SnapDeals API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Deals API:    http://localhost:${PORT}/api/deals`);
  console.log("─".repeat(52));

  // Step 5: Start the background cron job (refreshes deals every 6 hours)
  startCronJob();
});
