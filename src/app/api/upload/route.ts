import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "file";

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    const MAX_SIZE: Record<string, number> = {
      image: 10 * 1024 * 1024,
      pdf: 50 * 1024 * 1024,
      video: 100 * 1024 * 1024,
    };

    const ALLOWED_EXT: Record<string, string[]> = {
      image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      pdf: [".pdf"],
      video: [".mp4", ".webm", ".mov"],
    };

    if (!MAX_SIZE[type]) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE[type]) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT[type]?.includes(ext)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    let targetDir = "";
    let pathPrefix = "";

    if (type === "image") {
      targetDir = path.join(process.cwd(), "public", "assets", "images");
      pathPrefix = "/api/assets/images";
    } else if (type === "pdf") {
      targetDir = path.join(process.cwd(), "public", "assets", "files");
      pathPrefix = "/api/assets/files";
    } else if (type === "video") {
      targetDir = path.join(process.cwd(), "public", "assets", "videos");
      pathPrefix = "/api/assets/videos";
    } else {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Create directory if it doesn't exist
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Create unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use original filename with hash to avoid name conflicts
    const originalName = file.name;
    const fileExt = path.extname(originalName);
    const fileNameWithoutExt = path.basename(originalName, fileExt);

    // Add timestamp and short hash to ensure uniqueness
    const hash = crypto
      .createHash("md5")
      .update(fileNameWithoutExt + Date.now().toString())
      .digest("hex")
      .substring(0, 8);

    const sanitizedName = fileNameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-") // Sanitize filename
      .replace(/-+/g, "-"); // Avoid multiple dashes

    const finalFileName = `${sanitizedName}-${hash}${fileExt}`;
    const filePath = path.join(targetDir, finalFileName);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return relative path for frontend use
    const relativePath = `${pathPrefix}/${finalFileName}`;

    return NextResponse.json({
      success: true,
      path: relativePath,
      fileName: finalFileName,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the file" },
      { status: 500 }
    );
  }
}
