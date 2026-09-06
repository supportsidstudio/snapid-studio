import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { saveFeedback, getAllFeedback, initFeedbackDb } from "./server/feedbackStore";

// Load environment variables
dotenv.config();

// Ensure feedback database is initialized
initFeedbackDb();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // POST /api/feedback - Save permanent feedback record
  app.post("/api/feedback", (req, res) => {
    try {
      const { rating, category, feedback, name } = req.body || {};

      const numRating = Number(rating);
      if (!numRating || isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          error: "Rating must be a number between 1 and 5",
        });
      }

      if (!category || typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          success: false,
          error: "Feedback category is required",
        });
      }

      const saved = saveFeedback({
        rating: numRating,
        category: category.trim(),
        feedback: typeof feedback === "string" ? feedback : "",
        name: typeof name === "string" ? name : "",
      });

      console.log(`[Feedback] New feedback received: Rating ${saved.rating} (${saved.category}) from "${saved.name || "Anonymous"}"`);

      return res.status(201).json({
        success: true,
        message: "Thank you for your feedback! It helps us improve SnapID Studio.",
        data: {
          id: saved.id,
          createdAt: saved.createdAt,
        },
      });
    } catch (err) {
      console.error("Failed to save feedback:", err);
      return res.status(500).json({
        success: false,
        error: "Internal server error occurred while saving feedback. Please try again.",
      });
    }
  });

  // GET /api/feedback - Public feedback endpoint for website visitors
  app.get("/api/feedback", (req, res) => {
    try {
      const feedbacks = getAllFeedback();
      return res.json({
        success: true,
        count: feedbacks.length,
        feedbacks,
      });
    } catch (err) {
      console.error("Failed to retrieve public feedback:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to load feedbacks",
      });
    }
  });

  // GET /api/feedback/admin - Protected / admin feedback retrieval
  app.get("/api/feedback/admin", (req, res) => {
    const adminKey = req.headers["x-admin-key"] || req.query.key;
    const configuredKey = process.env.ADMIN_SECRET_KEY || "snapid-admin-2026";

    if (adminKey !== configuredKey) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized access. Valid admin key required.",
      });
    }

    const feedbacks = getAllFeedback();
    return res.json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    });
  });

  // Serve static files from public directory with proper MIME types
  app.use(express.static(path.join(process.cwd(), "public"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));

  // Vite integration as middleware in development, or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files in production mode from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
