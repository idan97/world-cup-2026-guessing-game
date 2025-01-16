import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from 'cors';
import authRoutes from "./routes/auth";

dotenv.config();

const PORT = process.env.PORT || 8000;
const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your_db";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/auth", authRoutes);

// Start the server
const startServer = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("Database connected");
    app.listen(PORT, () =>
      console.log("Server running on http://localhost:" + PORT)
    );
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();