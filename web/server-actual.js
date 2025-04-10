console.log("🔥🔥🔥 THIS IS THE RIGHT SERVER");
const express = require("express");
const cors = require("cors");
const verifyRequest = require("./middleware/verifyRequest");
const upsellRoute = require("./routes/upsell");
const analyticsRoute = require("./routes/analytics");
const abTestRoute = require("./routes/abtest");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

console.log("🧠 Loaded server.js for COBOT PRO - Revolutionary Upsell App");

// Mount API routes
app.use("/api/upsell", verifyRequest, upsellRoute);
app.use("/api/analytics", verifyRequest, analyticsRoute);
app.use("/api/abtest", verifyRequest, abTestRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.send("Cobot Pro Revolutionary Upsell App Backend Running ✅");
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});