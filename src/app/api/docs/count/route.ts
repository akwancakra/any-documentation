import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getDocsStorage } from "@/lib/docs-storage";
import { scanMDXRelKeys } from "@/lib/mdx-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  let total = 0;
  let totalSize = 0;
  let updatedThisMonth = 0;

  try {
    const storage = getDocsStorage();
    const keys = await scanMDXRelKeys();
    total = keys.length;
    const now = new Date();
    const thisMonth = now.getUTCMonth();
    const thisYear = now.getUTCFullYear();

    for (const key of keys) {
      const head = await storage.head(key);
      if (!head) continue;
      totalSize += head.size;
      const mtime = head.lastModified;
      if (
        mtime.getUTCMonth() === thisMonth &&
        mtime.getUTCFullYear() === thisYear
      ) {
        updatedThisMonth++;
      }
    }
  } catch {
    total = 0;
    totalSize = 0;
    updatedThisMonth = 0;
  }

  const totalSizeMB = +(totalSize / (1024 * 1024)).toFixed(2);
  return NextResponse.json({ total, totalSizeMB, updatedThisMonth });
}
