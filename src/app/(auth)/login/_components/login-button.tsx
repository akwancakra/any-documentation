"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

/** Tombol masuk ke halaman login (credentials). Azure AD tidak dikonfigurasi di auth. */
export function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Selamat datang,{" "}
          <span className="font-medium text-foreground">{session.user?.name}</span>
        </p>
        <Button onClick={() => signOut()} variant="destructive" size="sm">
          Keluar
        </Button>
      </div>
    );
  }

  return (
    <Button asChild className="flex items-center gap-2" variant="default">
      <Link href="/login">Masuk</Link>
    </Button>
  );
}
