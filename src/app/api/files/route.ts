import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  appendActivityLog,
  activityLogUserFromSession,
} from "@/lib/activity-log-store";

interface FileTreeNode {
  name: string;
  children?: string[];
}

const docsDir = path.join(process.cwd(), "content", "docs");

function relDocsPosix(fullPath: string): string {
  return path.relative(docsDir, fullPath).replace(/\\/g, "/");
}

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    return null;
  }
  return session;
}

async function buildFileTree(dir: string, tree: Record<string, FileTreeNode>) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const relativeDir = path.relative(docsDir, dir);
  // Normalize path separator to forward slash for consistency
  const parentId =
    relativeDir === "" ? "docs" : relativeDir.replace(/\\/g, "/");

  if (!tree[parentId]) {
    tree[parentId] = {
      name: path.basename(dir),
      children: [],
    };
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(docsDir, fullPath);
    // Normalize path separator to forward slash for consistency
    const id = relativePath.replace(/\\/g, "/");

    if (entry.isDirectory()) {
      tree[id] = { name: entry.name, children: [] };
      tree[parentId].children?.push(id);
      await buildFileTree(fullPath, tree);
    } else if (entry.isFile()) {
      tree[id] = { name: entry.name };
      tree[parentId].children?.push(id);
    }
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  try {
    const fileTree: Record<string, FileTreeNode> = {
      docs: {
        name: "docs",
        children: [],
      },
    };
    await buildFileTree(docsDir, fileTree);

    // Sort children: folders first, then files alphabetically
    for (const key in fileTree) {
      fileTree[key].children?.sort((a, b) => {
        const aIsFolder = !!fileTree[a].children;
        const bIsFolder = !!fileTree[b].children;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.localeCompare(b);
      });
    }

    return NextResponse.json({ tree: fileTree, rootId: "docs" });
  } catch (error) {
    console.error("Failed to build file tree:", error);
    return NextResponse.json(
      { error: "Failed to read directory structure." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const { folderPath } = await request.json();

    if (!folderPath || typeof folderPath !== "string") {
      return NextResponse.json(
        { message: "Folder path is required." },
        { status: 400 }
      );
    }

    const fullPath = path.join(docsDir, folderPath);

    // Security check
    if (!fullPath.startsWith(docsDir)) {
      return NextResponse.json(
        { message: "Invalid folder path." },
        { status: 403 }
      );
    }

    await fs.mkdir(fullPath, { recursive: true });

    await appendActivityLog({
      type: "folder_create",
      path: folderPath.replace(/\\/g, "/"),
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Folder created successfully." });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { message: "Failed to create folder." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const { itemPath } = await request.json();

    if (!itemPath || typeof itemPath !== "string") {
      return NextResponse.json(
        { message: "Item path is required." },
        { status: 400 }
      );
    }

    const fullPath = path.join(docsDir, itemPath);

    // Security check
    if (!fullPath.startsWith(docsDir)) {
      return NextResponse.json(
        { message: "Invalid file path." },
        { status: 403 }
      );
    }

    // Check if file or folder exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { message: "File or folder not found." },
        { status: 404 }
      );
    }

    // Check if it's a directory or file
    const stat = await fs.stat(fullPath);
    const isDirectory = stat.isDirectory();
    if (isDirectory) {
      await fs.rmdir(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }

    await appendActivityLog({
      type: "delete",
      file: itemPath.replace(/\\/g, "/"),
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
      isDirectory,
    });

    return NextResponse.json({
      message: "File or folder deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete file/folder:", error);
    return NextResponse.json(
      { message: "Failed to delete file or folder." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const body = await request.json();

    // Check if this is a move operation
    if (body.action === "move") {
      const { sourcePath, targetPath } = body;

      if (
        !sourcePath ||
        typeof sourcePath !== "string" ||
        !targetPath ||
        typeof targetPath !== "string"
      ) {
        return NextResponse.json(
          {
            message:
              "Source path and target path are required for move operation.",
          },
          { status: 400 }
        );
      }

      const fullSourcePath = path.join(docsDir, sourcePath);

      // Handle special case for root "docs" folder
      let fullTargetPath: string;
      let targetDir: string;

      if (targetPath === "docs") {
        // Moving to root docs folder
        targetDir = docsDir;
        fullTargetPath = path.join(docsDir, path.basename(sourcePath));
      } else {
        // Moving to subfolder
        targetDir = path.join(docsDir, targetPath);
        fullTargetPath = path.join(
          docsDir,
          targetPath,
          path.basename(sourcePath)
        );
      }

      // Security check
      if (
        !fullSourcePath.startsWith(docsDir) ||
        !fullTargetPath.startsWith(docsDir)
      ) {
        return NextResponse.json(
          { message: "Invalid file path." },
          { status: 403 }
        );
      }

      // Check if source exists
      try {
        await fs.access(fullSourcePath);
      } catch {
        return NextResponse.json(
          { message: "Source file or folder not found." },
          { status: 404 }
        );
      }

      // Check if target directory exists
      try {
        const stat = await fs.stat(targetDir);
        if (!stat.isDirectory()) {
          return NextResponse.json(
            { message: "Target must be a folder." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { message: "Target folder not found." },
          { status: 404 }
        );
      }

      // Check if target already exists
      try {
        await fs.access(fullTargetPath);
        return NextResponse.json(
          {
            message:
              "A file or folder with that name already exists in the target folder.",
          },
          { status: 409 }
        );
      } catch {
        // Target doesn't exist, which is good
      }

      // Prevent moving a folder into itself
      if (fullTargetPath.startsWith(fullSourcePath + path.sep)) {
        return NextResponse.json(
          { message: "Cannot move a folder into itself." },
          { status: 400 }
        );
      }

      await fs.rename(fullSourcePath, fullTargetPath);

      await appendActivityLog({
        type: "move",
        from: sourcePath.replace(/\\/g, "/"),
        to: relDocsPosix(fullTargetPath),
        user: activityLogUserFromSession(session),
        time: new Date().toISOString(),
      });

      return NextResponse.json({
        message: "File or folder moved successfully.",
      });
    }

    // Original rename operation
    const { oldPath, newName } = body;

    if (
      !oldPath ||
      typeof oldPath !== "string" ||
      !newName ||
      typeof newName !== "string"
    ) {
      return NextResponse.json(
        { message: "Old path and new name are required." },
        { status: 400 }
      );
    }

    const fullOldPath = path.join(docsDir, oldPath);
    const parentDir = path.dirname(fullOldPath);
    const fullNewPath = path.join(parentDir, newName);

    // Security check
    if (!fullOldPath.startsWith(docsDir) || !fullNewPath.startsWith(docsDir)) {
      return NextResponse.json(
        { message: "Invalid file path." },
        { status: 403 }
      );
    }

    // Check if old file exists
    try {
      await fs.access(fullOldPath);
    } catch {
      return NextResponse.json(
        { message: "File or folder not found." },
        { status: 404 }
      );
    }

    // Check if new name already exists
    try {
      await fs.access(fullNewPath);
      return NextResponse.json(
        { message: "A file or folder with that name already exists." },
        { status: 409 }
      );
    } catch {
      // New name doesn't exist, which is good
    }

    await fs.rename(fullOldPath, fullNewPath);

    await appendActivityLog({
      type: "rename",
      from: oldPath.replace(/\\/g, "/"),
      to: relDocsPosix(fullNewPath),
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "File or folder renamed successfully.",
    });
  } catch (error) {
    console.error("Failed to rename/move file/folder:", error);
    return NextResponse.json(
      { message: "Failed to rename or move file or folder." },
      { status: 500 }
    );
  }
}
