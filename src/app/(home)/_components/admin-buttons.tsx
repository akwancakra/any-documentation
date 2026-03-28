"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";
import { EditorTypeButton } from "./editor-type-button";

export function AdminButtons() {
  const { data: session } = useSession();
  const isAdmin = session && checkIsAdmin(session);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Button asChild variant="outline" size="lg">
        <Link href="/dashboard">
          <Shield className="h-5 w-5 mr-2" />
          Dashboard
        </Link>
      </Button>
      <EditorTypeButton />
    </>
  );
}
