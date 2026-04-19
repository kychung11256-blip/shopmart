import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // CRITICAL: Add verification file handler BEFORE any other middleware
  // This must be the very first middleware to intercept requests
  app.use((req, res, next) => {
    // Apple Pay domain verification - must be served as application/json
    if (req.url === '/.well-known/apple-developer-merchantid-domain-association') {
      const filePath = path.resolve(
        import.meta.dirname,
        '../..',
        'client',
        'public',
        '.well-known',
        'apple-developer-merchantid-domain-association'
      );
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/json');
        res.sendFile(filePath);
        return;
      }
    }
    // Check if this is a verification file request
    if (req.url && /^\/cryptomus_[a-f0-9]+\.html$/.test(req.url)) {
      const match = req.url.match(/cryptomus_([a-f0-9]+)\.html/);
      if (match) {
        const token = match[1];
        if (token === "20a47093") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.send(`cryptomus=${token}`);
          return;
        }
      }
    }
    next();
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Handle verification files BEFORE serving static files
  app.use((req, res, next) => {
    // Apple Pay domain verification - must be served as application/json
    if (req.url === '/.well-known/apple-developer-merchantid-domain-association') {
      const filePath = path.resolve(distPath, '.well-known', 'apple-developer-merchantid-domain-association');
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/json');
        res.sendFile(filePath);
        return;
      }
    }
    if (req.url && /^\/cryptomus_[a-f0-9]+\.html$/.test(req.url)) {
      const match = req.url.match(/cryptomus_([a-f0-9]+)\.html/);
      if (match) {
        const token = match[1];
        if (token === "20a47093") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.send(`cryptomus=${token}`);
          return;
        }
      }
    }
    next();
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
