import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { safeResolvePath } from "@/lib/safe-path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || filename.length === 0) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const allowedDir = path.resolve(
      process.cwd(),
      "public",
      "assets",
      "images"
    );
    const filePath = safeResolvePath(allowedDir, filename);

    if (!filePath) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".png":
        contentType = "image/png";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
      default:
        contentType = "image/png";
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    if (ext === ".svg") {
      headers["Content-Disposition"] = `attachment; filename="${path.basename(filePath)}"`;
      headers["X-Content-Type-Options"] = "nosniff";
    }

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
