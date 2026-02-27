import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import complaintsRoutes from "./routes/complaints.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/admin", adminRoutes);

// Root test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});