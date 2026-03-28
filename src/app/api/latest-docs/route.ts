import { NextRequest, NextResponse } from "next/server";
import { getLatestMDXFiles } from "@/lib/mdx-utils";

export interface DocFile {
  title: string;
  description: string;
  slug: string[];
  href: string;
  lastModified: string; // ISO string format for JSON serialization
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "4");

    console.log(`[Latest Docs API] Request for ${limit} latest docs`);

    // Get latest MDX files directly from filesystem
    const latestFiles = await getLatestMDXFiles(limit);

    console.log(
      `[Latest Docs API] Found ${latestFiles.length} files from filesystem`
    );

    // Convert to our DocFile format
    const docs = latestFiles.map((file) => ({
      title: file.data.title,
      description: file.data.description,
      slug: file.slug,
      href: file.url,
      lastModified: file.lastModified.toISOString(), // Convert Date to ISO string
    }));

    console.log(`[Latest Docs API] Returning ${docs.length} docs:`, docs);

    return NextResponse.json(docs, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error getting latest docs:", error);
    return NextResponse.json(
      { error: "Failed to get latest documents" },
      { status: 500 }
    );
  }
}
