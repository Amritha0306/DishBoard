const express = require("express");
const router = express.Router();
const Dish = require("../models/Dish");

// GET /api/dishes - Fetch all dishes
router.get("/", async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ createdAt: -1 });
    res.json({ success: true, data: dishes });
  } catch (error) {
    console.error("Error fetching dishes:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dishes" });
  }
});

// PATCH /api/dishes/:dishId/toggle - Toggle isPublished status
router.patch("/:dishId/toggle", async (req, res) => {
  try {
    const { dishId } = req.params;

    const dish = await Dish.findOne({ dishId });
    if (!dish) {
      return res
        .status(404)
        .json({ success: false, message: `Dish with ID '${dishId}' not found` });
    }

    dish.isPublished = !dish.isPublished;
    await dish.save();

    // Emit Socket.IO event to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("dish:updated", {
        dishId: dish.dishId,
        isPublished: dish.isPublished,
        dishName: dish.dishName,
      });
    }

    res.json({
      success: true,
      message: `Dish '${dish.dishName}' is now ${dish.isPublished ? "published" : "unpublished"}`,
      data: dish,
    });
  } catch (error) {
    console.error("Error toggling dish status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to toggle dish status" });
  }
});

// GET /api/dishes/:dishId - Get a single dish
router.get("/:dishId", async (req, res) => {
  try {
    const dish = await Dish.findOne({ dishId: req.params.dishId });
    if (!dish) {
      return res.status(404).json({ success: false, message: "Dish not found" });
    }
    res.json({ success: true, data: dish });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dish" });
  }
});

module.exports = router;
