import CreateEditorClient from "./client-editor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Create | Wiki Docs",
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
  const { type } = await searchParams;
  return <CreateEditorClient type={type} />;
}
