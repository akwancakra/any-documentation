import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  appendActivityLog,
  activityLogUserFromSession,
} from "@/lib/activity-log-store";

const docsDir = path.resolve(process.cwd(), "content", "docs");

function escapeYaml(str: string) {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}

function isSafeDocPath(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return resolved.startsWith(docsDir + path.sep) || resolved === docsDir;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { filePath, content, metadata, isUpdate, originalPath } = await request.json();

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { message: "File path is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }

    // Ensure the file has .mdx extension
    const mdxFilePath = filePath.endsWith(".mdx") ? filePath : `${filePath}.mdx`;
    const fullPath = path.resolve(docsDir, mdxFilePath);

    // Security: prevent path traversal
    if (!isSafeDocPath(fullPath)) {
      return NextResponse.json(
        { message: "Invalid file path" },
        { status: 403 }
      );
    }

    // For update mode, use original path to check if file exists
    if (isUpdate && originalPath) {
      const originalMdxPath = originalPath.endsWith(".mdx") ? originalPath : `${originalPath}.mdx`;
      const originalFullPath = path.resolve(docsDir, originalMdxPath);

      if (!isSafeDocPath(originalFullPath)) {
        return NextResponse.json(
          { message: "Invalid original file path" },
          { status: 403 }
        );
      }
      
      try {
        await fs.access(originalFullPath);
        
        // If the paths are different, we need to rename/move the file
        if (originalFullPath !== fullPath) {
          // Create directory for new path if it doesn't exist
          const dirPath = path.dirname(fullPath);
          await fs.mkdir(dirPath, { recursive: true });

          // Delete the old file after writing the new one
          await fs.unlink(originalFullPath);
        }
      } catch {
        return NextResponse.json(
          { message: "File not found for update" },
          { status: 404 }
        );
      }
    } else if (!isUpdate) {
      // For new files, check if file already exists
      try {
        await fs.access(fullPath);
        return NextResponse.json(
          { message: "File already exists" },
          { status: 409 }
        );
      } catch {
        // File doesn't exist, which is good for new files
      }
    }

    // Create directory if it doesn't exist
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });

    // Create frontmatter with metadata — escape values to prevent YAML injection
    const frontmatter = `---
title: "${escapeYaml(String(metadata?.title || "Untitled"))}"
description: "${escapeYaml(String(metadata?.description || ""))}"
---

`;

    const fullContent = frontmatter + content;

    // Write file
    await fs.writeFile(fullPath, fullContent, "utf-8");

    await appendActivityLog({
      type: isUpdate ? "update" : "create",
      file: mdxFilePath,
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
    });

    // Comprehensive revalidation to ensure changes are visible
    const docsPath = `/docs/${mdxFilePath.replace(/\.mdx$/, "")}`;
    
    // Revalidate specific page
    revalidatePath(docsPath);

    // Revalidate the layout and all docs pages
    revalidatePath("/docs", "layout");
    revalidatePath("/docs", "page");
    
    // Also revalidate the root docs if it's index.mdx
    if (mdxFilePath === "index.mdx") {
      revalidatePath("/docs");
    }
    
    // Force revalidate with tag
    revalidateTag("docs-content");

    return NextResponse.json({
      message: isUpdate ? "File updated successfully" : "File saved successfully",
      filePath: mdxFilePath,
    });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json(
      { message: "Failed to save file" },
      { status: 500 }
    );
  }
} 