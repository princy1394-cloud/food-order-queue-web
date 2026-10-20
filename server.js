import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
]);

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let requestPath;
  try {
    requestPath = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Invalid URL");
    return;
  }

  const relativePath = requestPath.replace(/^[/\\]+/, "") || "index.html";
  const filePath = path.resolve(projectRoot, relativePath);
  const allowedRoot = `${projectRoot}${path.sep}`;

  if (filePath !== projectRoot && !filePath.startsWith(allowedRoot)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const fileStats = statSync(filePath);
    if (!fileStats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Length": fileStats.size,
      "Content-Type":
        mimeTypes.get(path.extname(filePath)) ??
        "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") {
      console.error(`Unable to serve ${filePath}:`, error);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Could not serve this file");
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Food Order Queue is available at http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("Could not start the local web server:", error.message);
  process.exitCode = 1;
});
