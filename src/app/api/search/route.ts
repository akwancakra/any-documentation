import { NextRequest, NextResponse } from "next/server";
import {
  searchMDXFiles,
  getAllMDXFiles,
  pickSearchExcerpt,
} from "@/lib/mdx-utils";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "";
    const tag = url.searchParams.get("tag");

    if (!query.trim()) {
      // If no query, return all files or filter by tag
      const allFiles = await getAllMDXFiles();

      let results = allFiles.map((file) => {
        const title = file.data.title;
        const description = file.data.description?.trim() || "";
        const excerpt = pickSearchExcerpt("", description, file.content);
        return {
          id: file.url,
          type: "page" as const,
          content: title,
          url: file.url,
          title,
          description: description || undefined,
          excerpt,
          tag: file.url,
        };
      });

      // Filter by tag if provided
      if (tag) {
        results = results.filter(
          (item) => item.url === tag || item.tag === tag
        );
      }

      return NextResponse.json(results);
    }

    // Perform search with query
    const searchResults = await searchMDXFiles(query);

    let results = searchResults.map((item) => {
      const description = item.description?.trim() || "";
      const excerpt = pickSearchExcerpt(query, description, item.content);
      return {
        id: item.id,
        type: "page" as const,
        content: item.title,
        url: item.url,
        title: item.title,
        description: description || undefined,
        excerpt,
        tag: item.url,
      };
    });

    // Filter by tag if provided
    if (tag) {
      results = results.filter((item) => item.url === tag || item.tag === tag);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
