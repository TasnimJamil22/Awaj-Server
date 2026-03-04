import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import complaintsRoutes from "./routes/complaints.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/admin", adminRoutes);
//Making uploads folder public
//Now files are accessible via:
//http://localhost:5000/uploads/filename.jpg
app.use("/uploads", express.static("uploads"));
app.use("/api/users", userRoutes);

app.use("/api/analytics", analyticsRoutes);

// Root test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});