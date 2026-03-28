import React, { useEffect, useState } from "react";

function App() {
  const [orders, setOrders] = useState([]);
  const [dish, setDish] = useState("");
  const [status, setStatus] = useState("Loading...");

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
      setStatus("ok (db: connected)");
    } catch (err) {
      setStatus("db: disconnected");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Create Order
  const createOrder = async () => {
    if (!dish) return;

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ dish })
      });

      setDish("");
      fetchOrders();
    } catch (err) {
      alert("Create failed");
    }
  };

  // Delete Order 🚀
  const deleteOrder = async (id) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "DELETE"
      });
      fetchOrders();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div style={{
      backgroundColor: "#0f172a",
      minHeight: "100vh",
      color: "white",
      padding: "30px",
      fontFamily: "Arial"
    }}>
      
      {/* Title */}
      <h1 style={{ color: "#00FFD1" }}>
        🍽️ Kitchen Orders v2 🚀
      </h1>

      <p>Create orders and manage them easily.</p>

      {/* API Status */}
      <div style={{
        background: "#1e293b",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        API status: {status}
      </div>

      {/* Create Order */}
      <div style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px"
      }}>
        <input
          type="text"
          placeholder="Enter dish (e.g. Biryani)"
          value={dish}
          onChange={(e) => setDish(e.target.value)}
          style={{
            padding: "10px",
            width: "60%",
            marginRight: "10px"
          }}
        />

        <button
          onClick={createOrder}
          style={{
            padding: "10px 20px",
            backgroundColor: "#00FFD1",
            border: "none",
            cursor: "pointer"
          }}
        >
          Create Order
        </button>
      </div>

      {/* Orders Table */}
      <div style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "10px"
      }}>
        <h3>Orders</h3>

        <table width="100%" style={{ marginTop: "10px" }}>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Status</th>
              <th>Created</th>
              <th>ID</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="5">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.dish}</td>
                  <td>{order.status}</td>
                  <td>{order.created}</td>
                  <td>{order.id}</td>
                  <td>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      style={{
                        backgroundColor: "red",
                        color: "white",
                        padding: "5px 10px",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;