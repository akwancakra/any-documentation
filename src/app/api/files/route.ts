import { NextResponse } from "next/server";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  appendActivityLog,
  activityLogUserFromSession,
} from "@/lib/activity-log-store";
import { getDocsStorage } from "@/lib/docs-storage";
import { normalizeDocRelKey } from "@/lib/docs-storage/keys";
import { buildDocsFileTree } from "@/lib/docs-file-tree";
import { revalidateDocsContent } from "@/lib/docs-revalidate";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return null;
  }
  return session;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const storage = getDocsStorage();
    const { tree, rootId } = await buildDocsFileTree(storage);
    return NextResponse.json({ tree, rootId });
  } catch (error) {
    console.error("Failed to build file tree:", error);
    return NextResponse.json(
      { error: "Failed to read directory structure." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { folderPath } = await request.json();

    if (!folderPath || typeof folderPath !== "string") {
      return NextResponse.json(
        { message: "Folder path is required." },
        { status: 400 },
      );
    }

    let rel: string;
    try {
      rel = normalizeDocRelKey(toPosix(folderPath));
    } catch {
      return NextResponse.json(
        { message: "Invalid folder path." },
        { status: 403 },
      );
    }

    const storage = getDocsStorage();
    await storage.createFolder(rel);

    await appendActivityLog({
      type: "folder_create",
      path: rel,
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
    });

    revalidateDocsContent();
    return NextResponse.json({ message: "Folder created successfully." });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { message: "Failed to create folder." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { itemPath } = await request.json();

    if (!itemPath || typeof itemPath !== "string") {
      return NextResponse.json(
        { message: "Item path is required." },
        { status: 400 },
      );
    }

    let rel: string;
    try {
      rel = normalizeDocRelKey(toPosix(itemPath));
    } catch {
      return NextResponse.json(
        { message: "Invalid file path." },
        { status: 403 },
      );
    }

    const storage = getDocsStorage();
    const isDirectory = await storage.isFolder(rel);
    if (isDirectory) {
      await storage.deletePrefix(rel);
    } else if (await storage.exists(rel)) {
      await storage.deleteKey(rel);
    } else {
      return NextResponse.json(
        { message: "File or folder not found." },
        { status: 404 },
      );
    }

    await appendActivityLog({
      type: "delete",
      file: rel,
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
      isDirectory,
    });

    revalidateDocsContent();
    return NextResponse.json({
      message: "File or folder deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete file/folder:", error);
    return NextResponse.json(
      { message: "Failed to delete file or folder." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const storage = getDocsStorage();

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
          { status: 400 },
        );
      }

      let sourceRel: string;
      let targetPathNorm: string;
      try {
        sourceRel = normalizeDocRelKey(toPosix(sourcePath));
        targetPathNorm =
          targetPath === "docs" ? "docs" : normalizeDocRelKey(toPosix(targetPath));
      } catch {
        return NextResponse.json(
          { message: "Invalid file path." },
          { status: 403 },
        );
      }

      const base = path.posix.basename(sourceRel);
      const destRel =
        targetPath === "docs" ? base : `${targetPathNorm}/${base}`;

      if (targetPath !== "docs") {
        if (!(await storage.isFolder(targetPathNorm))) {
          return NextResponse.json(
            { message: "Target folder not found." },
            { status: 404 },
          );
        }
      }

      if (
        !(await storage.exists(sourceRel)) &&
        !(await storage.isFolder(sourceRel))
      ) {
        return NextResponse.json(
          { message: "Source file or folder not found." },
          { status: 404 },
        );
      }

      if (
        (await storage.exists(destRel)) ||
        (await storage.isFolder(destRel))
      ) {
        return NextResponse.json(
          {
            message:
              "A file or folder with that name already exists in the target folder.",
          },
          { status: 409 },
        );
      }

      if (
        destRel === sourceRel ||
        destRel.startsWith(sourceRel + "/")
      ) {
        return NextResponse.json(
          { message: "Cannot move a folder into itself." },
          { status: 400 },
        );
      }

      await storage.movePath(sourceRel, destRel);

      await appendActivityLog({
        type: "move",
        from: sourceRel,
        to: destRel,
        user: activityLogUserFromSession(session),
        time: new Date().toISOString(),
      });

      revalidateDocsContent();
      return NextResponse.json({
        message: "File or folder moved successfully.",
      });
    }

    const { oldPath, newName } = body;

    if (
      !oldPath ||
      typeof oldPath !== "string" ||
      !newName ||
      typeof newName !== "string"
    ) {
      return NextResponse.json(
        { message: "Old path and new name are required." },
        { status: 400 },
      );
    }

    let oldRel: string;
    let newNameSafe: string;
    try {
      oldRel = normalizeDocRelKey(toPosix(oldPath));
      newNameSafe = normalizeDocRelKey(toPosix(newName));
    } catch {
      return NextResponse.json(
        { message: "Invalid file path." },
        { status: 403 },
      );
    }

    const parentDir =
      oldRel.includes("/") ? oldRel.slice(0, oldRel.lastIndexOf("/")) : "";
    const newRel = parentDir ? `${parentDir}/${newNameSafe}` : newNameSafe;

    if (
      !(await storage.exists(oldRel)) &&
      !(await storage.isFolder(oldRel))
    ) {
      return NextResponse.json(
        { message: "File or folder not found." },
        { status: 404 },
      );
    }

    if (
      (await storage.exists(newRel)) ||
      (await storage.isFolder(newRel))
    ) {
      return NextResponse.json(
        { message: "A file or folder with that name already exists." },
        { status: 409 },
      );
    }

    await storage.movePath(oldRel, newRel);

    await appendActivityLog({
      type: "rename",
      from: oldRel,
      to: newRel,
      user: activityLogUserFromSession(session),
      time: new Date().toISOString(),
    });

    revalidateDocsContent();
    return NextResponse.json({
      message: "File or folder renamed successfully.",
    });
  } catch (error) {
    console.error("Failed to rename/move file/folder:", error);
    return NextResponse.json(
      { message: "Failed to rename or move file or folder." },
      { status: 500 },
    );
  }
}
