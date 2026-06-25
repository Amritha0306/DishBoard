import { useEffect, useRef, useState } from "react";

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="alert">
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
