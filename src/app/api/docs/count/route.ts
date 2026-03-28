import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const docsDir = path.join(process.cwd(), "content/docs");
  let total = 0;
  let totalSize = 0;
  let updatedThisMonth = 0;
  try {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith(".mdx"));
    total = files.length;
    const now = new Date();
    const thisMonth = now.getUTCMonth();
    const thisYear = now.getUTCFullYear();
    totalSize = files.reduce((acc, file) => {
      const stat = fs.statSync(path.join(docsDir, file));
      // Hitung updatedThisMonth
      const mtime = new Date(stat.mtime);
      if (mtime.getUTCMonth() === thisMonth && mtime.getUTCFullYear() === thisYear) {
        updatedThisMonth++;
      }
      return acc + stat.size;
    }, 0);
  } catch (e) {
    total = 0;
    totalSize = 0;
    updatedThisMonth = 0;
  }
  const totalSizeMB = +(totalSize / (1024 * 1024)).toFixed(2);
  return NextResponse.json({ total, totalSizeMB, updatedThisMonth });
} 