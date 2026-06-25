const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    dishId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    dishName: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dish", dishSchema);
