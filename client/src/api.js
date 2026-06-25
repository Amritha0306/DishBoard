const API_BASE = "http://localhost:5000/api";

/**
 * Fetch all dishes from the API
 */
export async function fetchDishes() {
  const res = await fetch(`${API_BASE}/dishes`);
  if (!res.ok) throw new Error(`Failed to fetch dishes: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

/**
 * Toggle the isPublished status of a dish
 * @param {string} dishId
 */
export async function toggleDish(dishId) {
  const res = await fetch(`${API_BASE}/dishes/${dishId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Toggle failed: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}
