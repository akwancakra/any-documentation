import { NextResponse } from "next/server";
import matter from "gray-matter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getDocsStorage } from "@/lib/docs-storage";
import { normalizeDocRelKey } from "@/lib/docs-storage/keys";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const { searchParams } = new URL(
      req.url,
      `http://${req.headers.get("host")}`,
    );
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 },
      );
    }

    let mdxFilePath: string;
    try {
      const raw =
        filePath.endsWith(".mdx") ? filePath : `${filePath}.mdx`;
      mdxFilePath = normalizeDocRelKey(raw.replace(/\\/g, "/"));
    } catch {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    const storage = getDocsStorage();
    const fileContent = await storage.getText(mdxFilePath);
    if (fileContent === null) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { data, content } = matter(fileContent);

    return NextResponse.json({
      success: true,
      metadata: data,
      content: content,
      filePath: mdxFilePath,
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 },
    );
  }
}
