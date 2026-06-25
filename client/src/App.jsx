import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import DishCard from "./components/DishCard";
import ToastContainer from "./components/ToastContainer";
import { fetchDishes } from "./api";
import { useSocket } from "./useSocket";

function App() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "published" | "unpublished"
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const { isConnected, lastUpdate } = useSocket();

  // ── Load dishes ──────────────────────────────────────────────
  const loadDishes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDishes();
      setDishes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  // ── Socket real-time updates ──────────────────────────────────
  useEffect(() => {
    if (!lastUpdate) return;

    setDishes((prev) =>
      prev.map((d) =>
        d.dishId === lastUpdate.dishId
          ? { ...d, isPublished: lastUpdate.isPublished }
          : d
      )
    );

    // Show toast for external (DB change stream) updates
    if (lastUpdate.source === "external") {
      addToast(
        `📡 External change: "${lastUpdate.dishName}" is now ${lastUpdate.isPublished ? "Published" : "Unpublished"}`,
        "info"
      );
    }
  }, [lastUpdate]);

  // ── Toast helper ─────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ── Update dish in state after toggle ─────────────────────────
  const handleToggled = useCallback((updated) => {
    setDishes((prev) =>
      prev.map((d) => (d.dishId === updated.dishId ? { ...d, isPublished: updated.isPublished } : d))
    );
  }, []);

  // ── Stats ─────────────────────────────────────────────────────
  const total = dishes.length;
  const published = dishes.filter((d) => d.isPublished).length;
  const unpublished = total - published;

  // ── Filtered dishes ───────────────────────────────────────────
  const filteredDishes = dishes.filter((d) => {
    if (filter === "published") return d.isPublished;
    if (filter === "unpublished") return !d.isPublished;
    return true;
  });

  return (
    <>
      <Navbar isConnected={isConnected} />

      <main className="main-container" id="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Dish <span>Management</span>
            </h1>
            <p className="dashboard-desc">
              Manage, publish, and monitor your menu items in real-time
            </p>
          </div>
        </header>

        {/* Stats Bar */}
        {!loading && !error && (
          <div className="stats-bar" role="region" aria-label="Dish statistics">
            <div className="stat-chip">
              <span className="stat-icon">🍽️</span>
              <div className="stat-info">
                <div className="stat-value">{total}</div>
                <div className="stat-label">Total Dishes</div>
              </div>
            </div>
            <div className="stat-chip">
              <span className="stat-icon">✅</span>
              <div className="stat-info">
                <div className="stat-value">{published}</div>
                <div className="stat-label">Published</div>
              </div>
            </div>
            <div className="stat-chip">
              <span className="stat-icon">⛔</span>
              <div className="stat-info">
                <div className="stat-value">{unpublished}</div>
                <div className="stat-label">Unpublished</div>
              </div>
            </div>

          </div>
        )}

        {/* Filter Tabs */}
        {!loading && !error && (
          <div className="filter-tabs" role="tablist" aria-label="Filter dishes">
            {[
              { key: "all", label: `All (${total})` },
              { key: "published", label: `Published (${published})` },
              { key: "unpublished", label: `Unpublished (${unpublished})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                id={`tab-${key}`}
                className={`tab-btn ${filter === key ? "active" : ""}`}
                onClick={() => setFilter(key)}
                role="tab"
                aria-selected={filter === key}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-container" aria-busy="true" aria-label="Loading dishes">
            <div className="loading-spinner-lg" />
            <p className="loading-text">Fetching dishes from database...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="error-container" role="alert">
            <span className="error-icon">⚠️</span>
            <h2 className="error-title">Could not load dishes</h2>
            <p className="error-desc">
              {error}. Make sure the server is running on port 5000.
            </p>
            <button className="retry-btn" id="retry-btn" onClick={loadDishes}>
              Retry
            </button>
          </div>
        )}

        {/* Dish Grid */}
        {!loading && !error && (
          <>
            {filteredDishes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p>No dishes in this category</p>
              </div>
            ) : (
              <div className="dish-grid" role="list" aria-label="Dishes grid">
                {filteredDishes.map((dish) => (
                  <DishCard
                    key={dish.dishId}
                    dish={dish}
                    onToggled={handleToggled}
                    addToast={addToast}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </>
  );
}

export default App;
