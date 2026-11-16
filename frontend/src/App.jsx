
import { useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:3000";

function App() {
  const [form, setForm] = useState({
    name: "",
    amount: "499",
    currency: "INR",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          amountMinorUnits: Math.round(Number(form.amount) * 100),
          currency: form.currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to process order");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (minorUnits) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: form.currency,
    }).format(Number(minorUnits) / 100);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">M</div>
          <span>mini<span className="brand-light">commerce</span></span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          <div className="nav-item active">
            <span>▦</span> Overview
          </div>
          <div className="nav-item">
            <span>◫</span> Orders
          </div>
          <div className="nav-item">
            <span>♙</span> Customers
          </div>
          <div className="nav-item">
            <span>⇄</span> Transactions
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="service-indicator">
            <span className="status-dot"></span>
            <div>
              <strong>Development mode</strong>
              <small>Local services</small>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin</strong>
              <small>MiniCommerce</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / Overview</div>
            <h1>Dashboard</h1>
          </div>

          <div className="topbar-right">
            <span className="live-indicator">
              <span className="status-dot"></span>
              System operational
            </span>
            <div className="top-avatar">A</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <h2>Welcome to MiniCommerce 👋</h2>
            <p>Manage orders and observe your microservices in action.</p>
          </div>
          <div className="date-label">MICROSERVICES DEMO</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-heading">
              <span>Total services</span>
              <span className="stat-icon purple">◈</span>
            </div>
            <div className="stat-value">03</div>
            <div className="stat-caption">Express · Java · Python</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading">
              <span>Communication</span>
              <span className="stat-icon blue">⇄</span>
            </div>
            <div className="stat-value">gRPC</div>
            <div className="stat-caption">HTTP/2 · Protobuf</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading">
              <span>Order gateway</span>
              <span className="stat-icon green">⌘</span>
            </div>
            <div className="stat-value">REST</div>
            <div className="stat-caption">Express · Port 3000</div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel order-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">ORDER MANAGEMENT</span>
                <h3>Create a new order</h3>
                <p>Submit an order through your microservices.</p>
              </div>
              <div className="panel-icon">↗</div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Customer name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter customer name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">Order amount</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="499.00"
                    value={form.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="amount-preview">
                <span>Total payment</span>
                <strong>
                  {formatAmount(
                    Math.round((Number(form.amount) || 0) * 100)
                  )}
                </strong>
              </div>

              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? "Processing order..." : "Create order"}
                <span>→</span>
              </button>

              {error && <div className="error-message">{error}</div>}
            </form>
          </div>

          <div className="panel architecture-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SYSTEM ARCHITECTURE</span>
                <h3>Service communication</h3>
                <p>How your order travels through the system.</p>
              </div>
            </div>

            <div className="architecture-flow">
              <div className="architecture-node gateway">
                <div className="node-icon">JS</div>
                <div>
                  <strong>Order Service</strong>
                  <small>Node.js · Express · 3000</small>
                </div>
                <span className="node-status">REST</span>
              </div>

              <div className="flow-connectors">
                <span>gRPC ↓</span>
                <span>gRPC ↓</span>
              </div>

              <div className="service-nodes">
                <div className="architecture-node">
                  <div className="node-icon java">J</div>
                  <div>
                    <strong>User Service</strong>
                    <small>Java · 50051</small>
                  </div>
                </div>

                <div className="architecture-node">
                  <div className="node-icon python">Py</div>
                  <div>
                    <strong>Payment Service</strong>
                    <small>Python · 50052</small>
                  </div>
                </div>
              </div>

              <div className="architecture-note">
                <span>ⓘ</span>
                Shared Protobuf contracts enable cross-language communication.
              </div>
            </div>
          </div>
        </section>

        {result && (
          <section className="panel result-panel">
            <div className="result-header">
              <div>
                <span className="eyebrow">TRANSACTION RESULT</span>
                <h3>Order processed successfully</h3>
              </div>
              <span className="success-badge">✓ Successful</span>
            </div>

            <div className="result-grid">
              <div className="result-item">
                <span>Order ID</span>
                <strong>{result.order.orderId}</strong>
              </div>
              <div className="result-item">
                <span>Customer</span>
                <strong>{result.order.user.name}</strong>
              </div>
              <div className="result-item">
                <span>User ID</span>
                <strong>{result.order.user.userId}</strong>
              </div>
              <div className="result-item">
                <span>Transaction ID</span>
                <strong>{result.order.payment.transactionId}</strong>
              </div>
              <div className="result-item">
                <span>Payment status</span>
                <strong className="payment-success">
                  {result.order.payment.success ? "Paid" : "Failed"}
                </strong>
              </div>
              <div className="result-item">
                <span>Payment message</span>
                <strong>{result.order.payment.message}</strong>
              </div>
            </div>
          </section>
        )}

        <footer className="footer">
          <span>MiniCommerce © 2026</span>
          <span>Built to explore distributed systems & gRPC</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
