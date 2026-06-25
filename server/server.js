require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dishRoutes = require("./routes/dishes");
const Dish = require("./models/Dish");

const app = express();
const server = http.createServer(app);

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH"],
  },
});

// Make io accessible inside route handlers
app.set("io", io);

// --- Middleware ---
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  })
);
app.use(express.json());
// Serve generated dish images as static files
app.use("/images", express.static(require("path").join(__dirname, "public", "images")));

// --- Routes ---
app.use("/api/dishes", dishRoutes);

// API Index — visiting /api shows all available endpoints
app.get("/api", (req, res) => {
  res.json({
    name: "DishBoard API",
    version: "1.0.0",
    status: "running",
    baseUrl: `http://localhost:${process.env.PORT || 5000}`,
    endpoints: [
      {
        method: "GET",
        path: "/api/dishes",
        description: "Fetch all dishes from the database",
        example: `http://localhost:${process.env.PORT || 5000}/api/dishes`,
      },
      {
        method: "GET",
        path: "/api/dishes/:dishId",
        description: "Fetch a single dish by its dishId",
        example: `http://localhost:${process.env.PORT || 5000}/api/dishes/dish_001`,
      },
      {
        method: "PATCH",
        path: "/api/dishes/:dishId/toggle",
        description: "Toggle the isPublished status of a dish",
        example: `http://localhost:${process.env.PORT || 5000}/api/dishes/dish_001/toggle`,
      },
      {
        method: "GET",
        path: "/health",
        description: "Server health check — shows DB connection state",
        example: `http://localhost:${process.env.PORT || 5000}/health`,
      },
    ],
    realTime: {
      protocol: "Socket.IO",
      event: "dish:updated",
      description: "Emitted to all clients when any dish isPublished status changes",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// --- Socket.IO Connection ---
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

// --- MongoDB Connection + Change Stream + Poll Fallback ---
async function startServer() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dishdb";

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected:", uri);

    // Track last-known state for polling fallback
    let knownState = {}; // { dishId: isPublished }

    async function buildKnownState() {
      const all = await Dish.find({}, "dishId isPublished dishName");
      all.forEach((d) => { knownState[d.dishId] = { isPublished: d.isPublished, dishName: d.dishName }; });
    }

    await buildKnownState();

    // ── Primary: MongoDB Change Stream (requires replica set / Atlas) ──
    let changeStreamActive = false;
    try {
      const changeStream = Dish.watch([], { fullDocument: "updateLookup" });

      changeStream.on("change", (change) => {
        if (change.operationType === "update" || change.operationType === "replace") {
          const doc = change.fullDocument;
          if (doc) {
            console.log(`📡 Change Stream: ${doc.dishName} → isPublished: ${doc.isPublished}`);
            knownState[doc.dishId] = { isPublished: doc.isPublished, dishName: doc.dishName };
            io.emit("dish:updated", {
              dishId: doc.dishId,
              isPublished: doc.isPublished,
              dishName: doc.dishName,
              source: "external",
            });
          }
        }
      });

      changeStream.on("error", (err) => {
        console.warn("⚠️  Change stream error:", err.message);
      });

      changeStreamActive = true;
      console.log("📡 MongoDB Change Stream active — real-time DB sync enabled");
    } catch (csErr) {
      console.warn("⚠️  Change streams not supported on standalone MongoDB. Polling fallback active.");
    }

    // ── Fallback: Poll every 5 s when change stream is unavailable ──
    // This catches any direct Compass edits even on standalone MongoDB.
    setInterval(async () => {
      try {
        const dishes = await Dish.find({}, "dishId isPublished dishName");
        dishes.forEach((d) => {
          const prev = knownState[d.dishId];
          if (!prev || prev.isPublished !== d.isPublished) {
            console.log(`🔄 Poll detected change: ${d.dishName} → isPublished: ${d.isPublished}`);
            knownState[d.dishId] = { isPublished: d.isPublished, dishName: d.dishName };
            io.emit("dish:updated", {
              dishId: d.dishId,
              isPublished: d.isPublished,
              dishName: d.dishName,
              source: "external",
            });
          }
        });
      } catch (pollErr) {
        console.warn("⚠️  Poll error:", pollErr.message);
      }
    }, 5000); // poll every 5 seconds

    console.log("🔄 Polling fallback active — Compass changes sync within 5s");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready`);
      console.log(`📋 API: http://localhost:${PORT}/api/dishes`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

