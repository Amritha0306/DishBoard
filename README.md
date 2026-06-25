# 🍽️ DishBoard — Dish Management Dashboard

A full-stack real-time dish management app built with React, Node.js, MongoDB, and Socket.IO.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally (`mongodb://localhost:27017`) **or** an Atlas connection string

---

### 1. Start MongoDB
Make sure MongoDB is running locally:
```bash
# Windows (if installed as a service)
net start MongoDB

# Or start manually
mongod --dbpath "C:\data\db"
```

---

### 2. Setup & Run the Backend

```bash
cd server
npm install          # Already done
npm run seed         # Seed the database with sample dishes
npm run dev          # Start server with nodemon (hot-reload)
```

Server runs at: **http://localhost:5000**

---

### 3. Setup & Run the Frontend

```bash
cd client
npm install          # Already done
npm run dev          # Start Vite dev server
```

Dashboard runs at: **http://localhost:5173**

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/dishes` | Fetch all dishes |
| `GET`  | `/api/dishes/:dishId` | Fetch a single dish |
| `PATCH`| `/api/dishes/:dishId/toggle` | Toggle `isPublished` |
| `GET`  | `/health` | Server health check |

---

## 🔌 Real-Time Events (Socket.IO)

| Event | Direction | Payload |
|-------|-----------|---------|
| `dish:updated` | Server → Client | `{ dishId, isPublished, dishName, source? }` |

The `source: "external"` flag indicates the change came directly from the database (change stream), not from the API.

---

## 🗂️ Project Structure

```
Dish/
├── server/
│   ├── models/Dish.js        # Mongoose schema
│   ├── routes/dishes.js      # REST API
│   ├── seed.js               # DB seeder
│   ├── server.js             # Express + Socket.IO
│   └── .env                  # Config (MONGODB_URI, PORT)
│
└── client/
    └── src/
        ├── components/
        │   ├── DishCard.jsx
        │   ├── Navbar.jsx
        │   └── ToastContainer.jsx
        ├── App.jsx
        ├── api.js
        ├── useSocket.js
        └── index.css
```

---

## 🎯 Features

- ✅ **Dashboard** — Browse all dishes with images and status
- ✅ **Toggle** — Publish/unpublish any dish with one click
- ✅ **Real-Time** — Socket.IO pushes updates to all connected clients instantly
- ✅ **DB Change Stream** — External DB changes also reflect in the UI (bonus)
- ✅ **Filter Tabs** — View All / Published / Unpublished dishes
- ✅ **Stats Bar** — Live counts of total, published, unpublished dishes
- ✅ **Toast Notifications** — Contextual feedback for every action
- ✅ **Dark Mode UI** — Premium glassmorphism design
