# DishBoard — Project & Code Explanation

> **A full-stack, real-time Dish Management Dashboard**  
> Built with React + Node.js + Express + Socket.IO + MongoDB

---

## 📁 Project Structure

```
Dish/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── App.jsx             # Root component — state, logic, layout
│       ├── api.js              # HTTP fetch functions (REST calls)
│       ├── useSocket.js        # Custom React hook — Socket.IO connection
│       ├── index.css           # All styles (dark theme, glassmorphism)
│       └── components/
│           ├── Navbar.jsx      # Top navbar with Live/Offline badge
│           ├── DishCard.jsx    # Individual dish card with toggle button
│           └── ToastContainer  # Floating notification popup
│
└── server/                     # Node.js backend
    ├── server.js               # Express + Socket.IO + MongoDB entry point
    ├── seed.js                 # Script to populate DB with 20 dishes
    ├── .env                    # Environment variables (MongoDB URI, PORT)
    ├── models/
    │   └── Dish.js             # Mongoose schema/model
    └── routes/
        └── dishes.js           # REST API route handlers
```

---

## 🧠 What the Project Does

**DishBoard** is a real-time dish management dashboard for a restaurant/food business. It allows:

- Viewing all dishes (20 dishes) with their name, image, and status
- **Publishing or unpublishing** a dish with a single click
- **Filtering** dishes by All / Published / Unpublished
- **Live sync** — when any dish status changes (from the dashboard or directly in MongoDB), all connected browser tabs update **automatically within 5 seconds** without page refresh
- A **real-time connection badge** in the navbar showing Socket.IO status

---

## 🗄️ Backend — Server Side

### 1. `server/models/Dish.js` — Database Schema

```js
const dishSchema = new mongoose.Schema({
  dishId:      { type: String, required: true, unique: true },
  dishName:    { type: String, required: true },
  imageUrl:    { type: String, required: true },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });
```

**Explanation:**
- Defines the shape of each dish document stored in MongoDB
- `dishId` is a custom ID like `dish_001` (not MongoDB's default `_id`)
- `isPublished` controls whether a dish is visible/live on the menu
- `timestamps: true` automatically adds `createdAt` and `updatedAt` fields

---

### 2. `server/routes/dishes.js` — REST API Endpoints

Three endpoints are exposed:

| Method | Route | What it does |
|--------|-------|--------------|
| `GET` | `/api/dishes` | Returns all 20 dishes sorted by newest first |
| `GET` | `/api/dishes/:dishId` | Returns a single dish by its custom ID |
| `PATCH` | `/api/dishes/:dishId/toggle` | Flips `isPublished` true→false or false→true |

**Key logic in the toggle route:**
```js
dish.isPublished = !dish.isPublished;   // flip the value
await dish.save();                       // save to MongoDB

// After saving, broadcast the change to ALL connected browser clients
const io = req.app.get("io");
io.emit("dish:updated", {
  dishId: dish.dishId,
  isPublished: dish.isPublished,
  dishName: dish.dishName,
});
```

The `io.emit("dish:updated", ...)` call is how the real-time update works — every connected browser client immediately receives the new status and updates the UI without a page refresh.

---

### 3. `server/server.js` — Main Server

This is the core of the backend. It does four things:

**① Sets up Express + Socket.IO:**
```js
const app = express();
const server = http.createServer(app);       // wrap Express with raw HTTP
const io = new Server(server, { cors: ... }); // attach Socket.IO to it
app.set("io", io);                           // share io with route handlers
```

**② Connects to MongoDB:**
```js
await mongoose.connect(process.env.MONGODB_URI);
```

**③ Tries MongoDB Change Streams (for Atlas / replica sets):**
```js
const changeStream = Dish.watch([], { fullDocument: "updateLookup" });
changeStream.on("change", (change) => {
  io.emit("dish:updated", { ... });  // push DB changes to all browsers
});
```
This only works on MongoDB Atlas or a replica set. On a local standalone MongoDB, it gracefully falls back to polling.

**④ Polling fallback (every 5 seconds):**
```js
setInterval(async () => {
  const dishes = await Dish.find({}, "dishId isPublished dishName");
  dishes.forEach((d) => {
    if (prev.isPublished !== d.isPublished) {
      io.emit("dish:updated", { ... });  // broadcast any detected change
    }
  });
}, 5000);
```
This ensures that even when you edit a dish directly in **MongoDB Compass**, the dashboard updates within 5 seconds automatically.

---

### 4. `server/seed.js` — Database Seeder

A standalone script to populate the database with 20 dishes:

```js
await Dish.deleteMany({});         // clears existing data
await Dish.insertMany(dishes);     // inserts fresh 20 dishes
await mongoose.disconnect();       // closes DB connection
```

**How to run it:**
```bash
cd server
node seed.js
```

> ⚠️ Running seed.js **wipes all existing data** and re-inserts the 20 hardcoded dishes. Run it only once for setup, or when you want to reset.

---

## 🖥️ Frontend — Client Side

### 5. `client/src/api.js` — HTTP Layer

A thin wrapper around the browser's `fetch` API:

```js
// Fetch all dishes
export async function fetchDishes() {
  const res = await fetch("http://localhost:5000/api/dishes");
  const json = await res.json();
  return json.data;  // returns the array of dish objects
}

// Toggle a dish's published status
export async function toggleDish(dishId) {
  const res = await fetch(`http://localhost:5000/api/dishes/${dishId}/toggle`, {
    method: "PATCH",
  });
  const json = await res.json();
  return json.data;  // returns the updated dish object
}
```

---

### 6. `client/src/useSocket.js` — Real-Time Hook

A custom React hook that manages the Socket.IO connection:

```js
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    socket = io("http://localhost:5000");  // connect to server

    socket.on("connect", ()    => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    // When server emits "dish:updated", store it in state
    socket.on("dish:updated", (data) => setLastUpdate({ ...data }));

    return () => socket.disconnect();  // cleanup on unmount
  }, []);

  return { isConnected, lastUpdate };
}
```

`lastUpdate` holds the most recently changed dish from the server. `App.jsx` watches it and instantly updates the dish list.

---

### 7. `client/src/App.jsx` — Root Component

The brain of the frontend. Manages all state:

| State | Purpose |
|-------|---------|
| `dishes` | Full array of all dish objects |
| `loading` | Shows spinner while fetching |
| `error` | Shows error message if API fails |
| `filter` | `"all"` / `"published"` / `"unpublished"` |
| `toasts` | Array of popup notification messages |

**How real-time updates flow into the UI:**
```js
// When socket receives a dish:updated event:
useEffect(() => {
  if (!lastUpdate) return;

  // Find and update just that one dish in state (no full page reload)
  setDishes((prev) =>
    prev.map((d) =>
      d.dishId === lastUpdate.dishId
        ? { ...d, isPublished: lastUpdate.isPublished }
        : d
    )
  );

  // Show a toast popup if the change came from outside (Compass/external)
  if (lastUpdate.source === "external") {
    addToast(`📡 External change: "${lastUpdate.dishName}" is now ...`, "info");
  }
}, [lastUpdate]);
```

---

### 8. `client/src/components/Navbar.jsx` — Navigation Bar

Displays the app logo, title, and the connection badge:

```jsx
<div className={`connection-badge ${isConnected ? "connected" : "disconnected"}`}>
  <div className="badge-main">
    <span className="dot" />
    {isConnected ? "Live" : "Offline"}        {/* big text */}
  </div>
  <div className="badge-sub">
    Socket.IO · {isConnected ? "Connected" : "Reconnecting..."}  {/* small text below */}
  </div>
</div>
```

The pulsing green dot animates using a CSS `@keyframes pulse-dot` animation when connected.

---

### 9. `client/src/components/DishCard.jsx` — Dish Card

Each dish renders as a card with:
- Image with hover zoom effect
- A status badge (`● Live` / `○ Hidden`) on the image corner
- The dish name and ID
- A toggle button that calls `toggleDish()` on click

```jsx
const handleToggle = async () => {
  setLoading(true);
  const updated = await toggleDish(dish.dishId);  // PATCH to API
  onToggled(updated);                              // update parent state
  addToast(`${updated.dishName} is now ${updated.isPublished ? "✅ Published" : "⛔ Unpublished"}`);
};
```

---

### 10. `client/src/components/ToastContainer.jsx` — Notifications

Renders a stack of floating notification popups at the bottom-right of the screen. Each toast auto-disappears after 3 seconds (controlled in `App.jsx` with `setTimeout`).

---

### 11. `client/src/index.css` — Styling

The entire UI uses:
- **Dark theme** with CSS custom properties (`--bg-primary`, `--accent-success`, etc.)
- **Glassmorphism** — `backdrop-filter: blur(16px)` on cards and navbar
- **Smooth animations** — card hover lift, image zoom, pulse dot, card-in entrance
- **Google Fonts Inter** for clean modern typography
- Fully **responsive** with `@media (max-width: 768px)` breakpoint

---

## 🔄 Complete Data Flow

```
User clicks "Publish" button
        ↓
DishCard.jsx → toggleDish(dishId)     [PATCH /api/dishes/:id/toggle]
        ↓
server/routes/dishes.js               [flip isPublished, save to MongoDB]
        ↓
io.emit("dish:updated", { ... })      [broadcast to ALL Socket.IO clients]
        ↓
useSocket.js → setLastUpdate(data)    [React state update]
        ↓
App.jsx → setDishes(prev.map(...))    [update only that one dish in array]
        ↓
DishCard re-renders instantly         [UI reflects new published state]
```

If changed directly in **MongoDB Compass**:
```
Compass edits isPublished
        ↓
server.js polling (every 5s)          [Dish.find() compares knownState]
        ↓
Detects change → io.emit(...)         [same path as above from here]
```

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | UI framework + build tool |
| Styling | Vanilla CSS | Dark glassmorphism design |
| HTTP Client | Fetch API | REST calls to backend |
| Real-Time | Socket.IO Client | Receive live dish updates |
| Backend | Node.js + Express | REST API server |
| Real-Time | Socket.IO Server | Push updates to all browsers |
| Database | MongoDB + Mongoose | Store dish data |
| DB Schema | Mongoose Model | Structured document validation |
| Dev Tool | nodemon | Auto-restart server on file change |

---

## 🚀 How to Run the Project

```bash
# 1. Start MongoDB (if not already running as a service)
mongod

# 2. Seed the database (only needed once)
cd server
node seed.js

# 3. Start the backend server
node server.js        # runs on http://localhost:5000

# 4. In a new terminal, start the frontend
cd client
npm run dev           # runs on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## 📡 API Endpoints Reference

| Method | URL | Response |
|--------|-----|----------|
| `GET` | `http://localhost:5000/api/dishes` | All 20 dishes |
| `GET` | `http://localhost:5000/api/dishes/dish_001` | Single dish |
| `PATCH` | `http://localhost:5000/api/dishes/dish_001/toggle` | Toggle published |
| `GET` | `http://localhost:5000/health` | Server + DB status |
| `GET` | `http://localhost:5000/api` | API documentation |
