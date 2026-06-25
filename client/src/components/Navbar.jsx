export default function Navbar({ isConnected }) {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-brand">
        <div className="navbar-logo" aria-hidden="true">🍽️</div>
        <div>
          <div className="navbar-title">DishBoard</div>
          <div className="navbar-subtitle">Dish Management Dashboard</div>
        </div>
      </div>

      <div className="navbar-right">
        <div
          className={`connection-badge ${isConnected ? "connected" : "disconnected"}`}
          title={isConnected ? "Socket.IO real-time updates active" : "Socket.IO reconnecting..."}
          role="status"
          aria-live="polite"
        >
          <div className="badge-content">
            <div className="badge-main">
              <span className="dot" />
              {isConnected ? "Live" : "Offline"}
            </div>
            <div className="badge-sub">
              Socket.IO · {isConnected ? "Connected" : "Reconnecting..."}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
