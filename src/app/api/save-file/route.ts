import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  appendActivityLog,
  activityLogUserFromSession,
} from "@/lib/activity-log-store";
import { getDocsStorage } from "@/lib/docs-storage";
import { normalizeDocRelKey } from "@/lib/docs-storage/keys";
import { revalidateDocsContent } from "@/lib/docs-revalidate";

function escapeYaml(str: string) {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { filePath, content, metadata, isUpdate, originalPath } =
      await request.json();

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { message: "File path is required" },
        { status: 400 },
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 },
      );
    }

    let mdxFilePath: string;
    try {
      const raw =
        filePath.endsWith(".mdx") ? filePath : `${filePath}.mdx`;
      mdxFilePath = normalizeDocRelKey(raw.replace(/\\/g, "/"));
    } catch {
      return NextResponse.json(
        { message: "Invalid file path" },
        { status: 403 },
      );
    }

    const storage = getDocsStorage();
    let previousMdxRelPath: string | undefined;

    if (isUpdate && originalPath) {
      let originalMdxPath: string;
      try {
        const raw =
          originalPath.endsWith(".mdx")
            ? originalPath
            : `${originalPath}.mdx`;
        originalMdxPath = normalizeDocRelKey(raw.replace(/\\/g, "/"));
      } catch {
        return NextResponse.json(
          { message: "Invalid original file path" },
          { status: 403 },
        );
      }

      if (!(await storage.exists(originalMdxPath))) {
        return NextResponse.json(
          { message: "File not found for update" },
          { status: 404 },
        );
      }

      if (originalMdxPath !== mdxFilePath) {
        previousMdxRelPath = originalMdxPath;
      }
    } else if (!isUpdate) {
      if (await storage.exists(mdxFilePath)) {
        return NextResponse.json(
          { message: "File already exists" },
          { status: 409 },
        );
      }
    }

    await storage.ensureParentDirsForFile(mdxFilePath);

    const frontmatter = `---
title: "${escapeYaml(String(metadata?.title || "Untitled"))}"
description: "${escapeYaml(String(metadata?.description || ""))}"
---

`;

    const fullContent = frontmatter + content;
    await storage.putText(mdxFilePath, fullContent);

    if (previousMdxRelPath) {
      await storage.deleteKey(previousMdxRelPath);
    }

    await appendActivityLog({
      type: isUpdate ? "update" : "create",
      file: mdxFilePath,
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
    });

    revalidateDocsContent({
      mdxRelPath: mdxFilePath,
      previousMdxRelPath,
    });

    return NextResponse.json({
      message: isUpdate ? "File updated successfully" : "File saved successfully",
      filePath: mdxFilePath,
    });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json(
      { message: "Failed to save file" },
      { status: 500 },
    );
  }
}
