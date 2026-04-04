import CreateEditorClient from "./client-editor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";
import { getAiEnhanceAvailability } from "@/lib/ai-enhance-env";
import { AccessDenied } from "@/components/shell/access-denied";

export const metadata = {
  title: "Create | Any Documentation",
  description: "Create a new documentation page.",
};

export default async function CreateEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session && checkIsAdmin(session);

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const { type } = await searchParams;
  const initialAiAvailability = getAiEnhanceAvailability();
  return (
    <CreateEditorClient
      type={type}
      initialAiAvailability={initialAiAvailability}
    />
  );
}
