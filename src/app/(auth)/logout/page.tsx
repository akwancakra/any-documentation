// src/app/logout/page.tsx
"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Shield } from "lucide-react";

export default function LogoutPage() {
  useEffect(() => {
    // signOut akan otomatis redirect ke callbackUrl setelah logout
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-lg border border-border">
        <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
          <Shield className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h1 className="text-xl font-bold mb-2 text-foreground">
          Berhasil Logout
        </h1>
        <p className="text-muted-foreground mb-4 text-center">
          Anda telah keluar dari sistem.
          <br />
          Anda akan diarahkan ke halaman login...
        </p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
      </div>
    </div>
  );
}
