import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const { path: targetPath } = await req.json();

    if (targetPath) {
      if (
        typeof targetPath !== "string" ||
        !targetPath.startsWith("/docs")
      ) {
        return NextResponse.json(
          { message: "Invalid path" },
          { status: 400 }
        );
      }
      revalidatePath(targetPath);
      revalidatePath(targetPath, "layout");
      revalidatePath(targetPath, "page");
    }

    // Force revalidate all docs pages
    revalidatePath("/docs", "layout");
    revalidatePath("/docs", "page");
    revalidateTag("docs-content");

    return NextResponse.json({
      message: "Revalidation triggered successfully",
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error during revalidation:", error);
    return NextResponse.json(
      { message: "Failed to revalidate" },
      { status: 500 }
    );
  }
} 