import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const fs = await import('fs');
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production or client/public in development
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "client", "public");

  // Serve static files with proper MIME types
  app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
      // Set proper content type for HTML files
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    }
  }));

  // Handle client-side routing - serve index.html for all routes
  // But first check if the file exists in static directory
  app.get("*", (req, res) => {
    const filePath = path.join(staticPath, req.path);
    // Check if file exists in static directory
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    // Otherwise serve index.html for SPA routing
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
