import { NextRequest, NextResponse } from "next/server";
import { getLatestMDXFiles } from "@/lib/mdx-utils";

export interface DocFile {
  title: string;
  description: string;
  slug: string[];
  href: string;
  lastModified: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "4");

    const latestFiles = await getLatestMDXFiles(limit);

    const docs = latestFiles.map((file) => ({
      title: file.data.title,
      description: file.data.description,
      slug: file.slug,
      href: file.url,
      lastModified: file.lastModified.toISOString(),
    }));

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
