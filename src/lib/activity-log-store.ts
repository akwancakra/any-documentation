import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/** Baris `file_activity_logs` untuk mapping ke `ActivityLogEntry`. */
export type FileActivityLogRow = {
  createdAt: Date;
  actionType: string;
  actorLabel: string;
  targetFile: string | null;
  targetPath: string | null;
  fromPath: string | null;
  toPath: string | null;
  isDirectory: boolean | null;
};

export const ACTIVITY_LOG_MAX_ENTRIES = 50;

export type ActivityLogType =
  | "create"
  | "update"
  | "delete"
  | "folder_create"
  | "move"
  | "rename";

export type ActivityLogEntry =
  | {
      type: "create" | "update";
      file: string;
      user: string;
      time: string;
    }
  | {
      type: "delete";
      file: string;
      user: string;
      time: string;
      isDirectory?: boolean;
    }
  | {
      type: "folder_create";
      path: string;
      user: string;
      time: string;
    }
  | {
      type: "move";
      from: string;
      to: string;
      user: string;
      time: string;
    }
  | {
      type: "rename";
      from: string;
      to: string;
      user: string;
      time: string;
    };

export function activityLogUserFromSession(
  session: Session | null | undefined
): string {
  if (!session?.user) return "unknown";
  const u = session.user as {
    name?: string | null;
    email?: string | null;
    id?: string;
  };
  return u.name || u.email || u.id || "unknown";
}

function entryToCreateData(entry: ActivityLogEntry): {
  actionType: string;
  actorLabel: string;
  targetFile: string | null;
  targetPath: string | null;
  fromPath: string | null;
  toPath: string | null;
  isDirectory: boolean | null;
} {
  const base = {
    actionType: entry.type,
    actorLabel: entry.user,
  };
  switch (entry.type) {
    case "create":
    case "update":
      return {
        ...base,
        targetFile: entry.file,
        targetPath: null,
        fromPath: null,
        toPath: null,
        isDirectory: null,
      };
    case "delete":
      return {
        ...base,
        targetFile: entry.file,
        targetPath: null,
        fromPath: null,
        toPath: null,
        isDirectory:
          entry.isDirectory === undefined ? null : entry.isDirectory,
      };
    case "folder_create":
      return {
        ...base,
        targetFile: null,
        targetPath: entry.path,
        fromPath: null,
        toPath: null,
        isDirectory: null,
      };
    case "move":
    case "rename":
      return {
        ...base,
        targetFile: null,
        targetPath: null,
        fromPath: entry.from,
        toPath: entry.to,
        isDirectory: null,
      };
  }
}

export function fileActivityRowToEntry(row: FileActivityLogRow): ActivityLogEntry {
  const time = row.createdAt.toISOString();
  const user = row.actorLabel;
  switch (row.actionType) {
    case "create":
    case "update":
      return {
        type: row.actionType,
        file: row.targetFile ?? "",
        user,
        time,
      };
    case "delete":
      return {
        type: "delete",
        file: row.targetFile ?? "",
        user,
        time,
        ...(row.isDirectory != null ? { isDirectory: row.isDirectory } : {}),
      };
    case "folder_create":
      return {
        type: "folder_create",
        path: row.targetPath ?? "",
        user,
        time,
      };
    case "move":
    case "rename":
      return {
        type: row.actionType,
        from: row.fromPath ?? "",
        to: row.toPath ?? "",
        user,
        time,
      };
    default:
      return {
        type: "update",
        file: row.targetFile ?? row.targetPath ?? "?",
        user,
        time,
      };
  }
}

/** Simpan ke DB; error diabaikan agar tidak mengganggu operasi utama. */
export async function appendActivityLog(entry: ActivityLogEntry): Promise<void> {
  try {
    const parsed = new Date(entry.time);
    const createdAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    const data = entryToCreateData(entry);

    await prisma.fileActivityLog.create({
      data: {
        ...data,
        createdAt,
      },
    });

    const count = await prisma.fileActivityLog.count();
    if (count > ACTIVITY_LOG_MAX_ENTRIES) {
      const excess = count - ACTIVITY_LOG_MAX_ENTRIES;
      const oldest = await prisma.fileActivityLog.findMany({
        orderBy: { createdAt: "asc" },
        take: excess,
        select: { id: true },
      });
      await prisma.fileActivityLog.deleteMany({
        where: { id: { in: oldest.map((o: { id: string }) => o.id) } },
      });
    }
  } catch {
    // abaikan
  }
}
