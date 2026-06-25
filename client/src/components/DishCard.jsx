import { useState } from "react";
import { toggleDish } from "../api";

export default function DishCard({ dish, onToggled, addToast }) {
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const updated = await toggleDish(dish.dishId);
      onToggled(updated);
      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 900);
      addToast(
        `${updated.dishName} is now ${updated.isPublished ? "✅ Published" : "⛔ Unpublished"}`,
        updated.isPublished ? "success" : "info"
      );
    } catch (err) {
      addToast(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const isPublished = dish.isPublished;

  return (
    <div
      className={`dish-card ${isPublished ? "published" : "unpublished"} ${highlighted ? "updated" : ""}`}
      id={`card-${dish.dishId}`}
    >
      {/* Image */}
      <div className="dish-image-wrapper">
        <img
          className="dish-image"
          src={dish.imageUrl}
          alt={dish.dishName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
          }}
        />
        <div className="dish-image-overlay" />
        <span className={`status-badge ${isPublished ? "published" : "unpublished"}`}>
          {isPublished ? "● Live" : "○ Hidden"}
        </span>
      </div>

      {/* Body */}
      <div className="dish-body">
        <p className="dish-id">{dish.dishId}</p>
        <h2 className="dish-name">{dish.dishName}</h2>

        <button
          id={`toggle-${dish.dishId}`}
          className={`toggle-btn ${isPublished ? "unpublish" : "publish"}`}
          onClick={handleToggle}
          disabled={loading}
          aria-label={`${isPublished ? "Unpublish" : "Publish"} ${dish.dishName}`}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Updating...
            </>
          ) : isPublished ? (
            <>⛔ Unpublish</>
          ) : (
            <>🚀 Publish</>
          )}
        </button>
      </div>
    </div>
  );
}
