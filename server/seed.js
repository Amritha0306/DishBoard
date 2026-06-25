require("dotenv").config();
const mongoose = require("mongoose");
const Dish = require("./models/Dish");

const dishes = [
  {
    dishId: "dish_001",
    dishName: "Margherita Pizza",
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_002",
    dishName: "Spaghetti Carbonara",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_003",
    dishName: "Butter Chicken",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80",
    isPublished: false,
  },
  {
    dishId: "dish_004",
    dishName: "Sushi Platter",
    imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_005",
    dishName: "Beef Tacos",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
    isPublished: false,
  },
  {
    dishId: "dish_006",
    dishName: "Caesar Salad",
    imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_007",
    dishName: "Pad Thai",
    imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_008",
    dishName: "Chicken Burger",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    isPublished: false,
  },
  {
    dishId: "dish_009",
    dishName: "Mango Cheesecake",
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80",
    isPublished: true,
  },
  {
    // Masala Dosa — AI-generated image of the actual dish
    dishId: "dish_010",
    dishName: "Masala Dosa",
    imageUrl: "http://localhost:5000/images/masala_dosa.png",
    isPublished: false,
  },
  {
    dishId: "dish_011",
    dishName: "Grilled Salmon",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_012",
    dishName: "Chocolate Lava Cake",
    imageUrl: "http://localhost:5000/images/chocolate_lava_cake.png",
    isPublished: true,
  },
  {
    dishId: "dish_013",
    dishName: "Paneer Tikka",
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_014",
    dishName: "Ramen Noodles",
    imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_015",
    dishName: "Biryani",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
    isPublished: false,
  },
  {
    dishId: "dish_016",
    dishName: "Avocado Toast",
    imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_017",
    dishName: "BBQ Ribs",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    isPublished: false,
  },
  {
    dishId: "dish_018",
    dishName: "Tiramisu",
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_019",
    dishName: "Greek Salad",
    imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",
    isPublished: true,
  },
  {
    dishId: "dish_020",
    dishName: "Penne Arrabbiata",
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80",
    isPublished: false,
  },
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dishdb";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Dish.deleteMany({});
    console.log("🗑️  Cleared existing dishes");

    // Insert seed data
    const inserted = await Dish.insertMany(dishes);
    console.log(`🌱 Seeded ${inserted.length} dishes successfully`);

    // Display the seeded dishes
    console.log("\n📋 Seeded Dishes:");
    inserted.forEach((d) => {
      console.log(
        `  [${d.dishId}] ${d.dishName} — ${d.isPublished ? "✅ Published" : "❌ Unpublished"}`
      );
    });
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

seed();
