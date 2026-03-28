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
      "files"
    );
    const filePath = safeResolvePath(allowedDir, filename);

    if (!filePath) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
