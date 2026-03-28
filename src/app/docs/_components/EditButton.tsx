"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { isAdmin as checkIsAdmin } from "@/lib/auth-utils";

export function EditButton({ slug }: { slug: string[] }) {
  const { data: session } = useSession();
  const isAdmin = session && checkIsAdmin(session);

  if (!isAdmin) return null;

  // Jika slug kosong, gunakan "index"
  const editSlug = slug.length === 0 ? "index" : slug.join("/");
  return (
    <Link href={`/editor/edit/${editSlug}`}>
      <Button variant="outline" size="sm" className="ml-2">
        <Pencil className="w-4 h-4 mr-1" />
        Edit
      </Button>
    </Link>
  );
}
