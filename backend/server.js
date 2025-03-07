const express = require("express");
const cors = require("cors"); // Import CORS
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const aiAgentRoutes = require("./routes/aiAgentRoutes");
require("dotenv").config();

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all requests

// Routes
app.use("/api", authRoutes);
app.use("/", aiAgentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
