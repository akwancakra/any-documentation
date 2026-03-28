import { notFound } from "next/navigation";
import SplitViewEditorWithToast from "../../_components/split-view-editor";
import { getMDXFileBySlug } from "@/lib/mdx-utils";
import { getServerSession } from "next-auth";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";

export const metadata = {
  title: "Edit | Wiki Docs",
  description: "Edit a documentation page.",
};

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface EditFileResponse {
  success: boolean;
  metadata: {
    title?: string;
    description?: string;
  };
  content: string;
  filePath: string;
  error?: string;
}

async function getFileContent(
  slug: string[],
): Promise<EditFileResponse | null> {
  try {
    // Use MDX utils to get file (handles sanitized slugs properly)
    const mdxFile = await getMDXFileBySlug(slug);

    if (!mdxFile) {
      return null;
    }

    return {
      success: true,
      metadata: {
        title: mdxFile.data.title,
        description: mdxFile.data.description,
      },
      content: mdxFile.content,
      filePath: mdxFile.filePath,
    };
  } catch (error) {
    console.error("Error getting file content:", error);
    return null;
  }
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session && checkIsAdmin(session);
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-2xl font-medium tracking-tight text-foreground">
            Access denied
          </h2>
          <p className="text-muted-foreground">
            This page is only available to administrators.
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }
  const { slug } = await params;

  try {
    // Get file content via MDX utils (more efficient than API call)
    const fileData = await getFileContent(slug);

    if (!fileData || !fileData.success) {
      notFound();
    }

    const editModeData = {
      content: fileData.content,
      metadata: fileData.metadata,
      filePath: fileData.filePath,
    };

    // Render split-view editor with data from API
    return <SplitViewEditorWithToast editMode={editModeData} />;
  } catch (error) {
    console.error("Error loading page for editing:", error);
    notFound();
  }
}
