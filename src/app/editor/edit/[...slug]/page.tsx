import { notFound } from "next/navigation";
import SplitViewEditorWithToast from "../../_components/split-view-editor";
import { getMDXFileBySlug } from "@/lib/mdx-utils";
import { getServerSession } from "next-auth";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";
import { authOptions } from "@/lib/auth-options";
import { getAiEnhanceAvailability } from "@/lib/ai-enhance-env";
import { AccessDenied } from "@/components/shell/access-denied";

export const metadata = {
  title: "Edit | Any Documentation",
  description: "Edit a documentation page.",
};

export const dynamic = "force-dynamic";

async function getFileContent(slug: string[]) {
  try {
    const mdxFile = await getMDXFileBySlug(slug);
    if (!mdxFile) return null;
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
    return <AccessDenied />;
  }

  const { slug } = await params;

  try {
    const fileData = await getFileContent(slug);
    if (!fileData || !fileData.success) {
      notFound();
    }

    const editModeData = {
      content: fileData.content,
      metadata: fileData.metadata,
      filePath: fileData.filePath,
    };

    const initialAiAvailability = getAiEnhanceAvailability();
    return (
      <SplitViewEditorWithToast
        editMode={editModeData}
        initialAiAvailability={initialAiAvailability}
      />
    );
  } catch (error) {
    console.error("Error loading page for editing:", error);
    notFound();
  }
}
