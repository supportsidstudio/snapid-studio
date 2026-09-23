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

  // Cross-Origin Isolation headers for multi-threaded WASM SIMD support
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Backward compatibility endpoint for cached browser clients
  app.post("/api/enhance-photo", (req, res) => {
    const { image } = req.body || {};
    return res.json({
      success: true,
      enhancedImage: image || null,
      fallback: true,
      message: "Enhancement is processed locally in-browser via WebGPU/WASM"
    });
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

  const staticFileOptions = {
    maxAge: "30d",
    setHeaders: (res: express.Response, filePath: string) => {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.onnx') || filePath.endsWith('.onnx.gz')) {
        res.setHeader('Content-Type', filePath.endsWith('.gz') ? 'application/gzip' : 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.mjs') || filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  };

  // Explicitly mount /models and /onnxruntime (including /src prefixes for Vite dev mode)
  app.use(['/models', '/src/models'], express.static(path.join(process.cwd(), "public/models"), staticFileOptions));
  app.use(['/onnxruntime', '/src/onnxruntime'], express.static(path.join(process.cwd(), "public/onnxruntime"), staticFileOptions));

  // Serve static files from public directory with proper MIME types and caching
  app.use(express.static(path.join(process.cwd(), "public"), staticFileOptions));

  // Explicitly prevent *.wasm, *.mjs, or *.onnx requests from ever returning HTML (prevents "Unexpected token '<'" / MIME warnings)
  app.use((req, res, next) => {
    if (req.path.endsWith('.wasm')) {
      return res.status(404).setHeader('Content-Type', 'application/wasm').end();
    }
    if (req.path.endsWith('.mjs')) {
      return res.status(404).setHeader('Content-Type', 'application/javascript').end();
    }
    if (req.path.endsWith('.onnx')) {
      return res.status(404).setHeader('Content-Type', 'application/octet-stream').end();
    }
    next();
  });

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
