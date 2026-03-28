import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const docsDir = path.join(process.cwd(), "content", "docs");

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.get("host")}`);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Ensure the file has .mdx extension
    const mdxFilePath = filePath.endsWith(".mdx") ? filePath : `${filePath}.mdx`;
    const fullPath = path.join(docsDir, mdxFilePath);

    // Security check
    if (!fullPath.startsWith(docsDir)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 403 }
      );
    }

    try {
      const fileContent = await fs.readFile(fullPath, "utf-8");
      const { data, content } = matter(fileContent);

      return NextResponse.json({
        success: true,
        metadata: data,
        content: content,
        filePath: mdxFilePath,
      });
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
} 