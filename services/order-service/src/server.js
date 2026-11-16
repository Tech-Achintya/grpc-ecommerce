require("dotenv").config();

const express = require("express");
const cors = require("cors");

const orderRoutes = require("./routes/order-routes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Order Service is running"
    });
});

// Order API
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
});