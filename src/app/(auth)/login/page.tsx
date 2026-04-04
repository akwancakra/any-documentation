"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { HeroGridBackdrop } from "@/components/shell/hero-grid-backdrop";
import { SiteLogo } from "@/components/shell/site-logo";
import { useToast } from "@/components/ui/use-toast";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const error = searchParams.get("error");
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (error === "invalid-role") {
      toast({
        title: "Peran tidak valid",
        description:
          "Akun Anda tidak memiliki peran yang valid. Hubungi administrator.",
        variant: "destructive",
      });
    } else if (error === "access-denied") {
      toast({
        title: "Akses ditolak",
        description: "Silakan masuk untuk mengakses halaman tersebut.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login gagal",
          description:
            "Email atau password salah. Pastikan database sudah di-migrate dan admin di-seed (npm run db:seed).",
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "Login berhasil",
          description: "Mengarahkan ke dashboard…",
        });

        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          redirectTimeoutRef.current = null;
          router.push("/dashboard");
        }, 600);
      }
    } catch {
      toast({
        title: "Login gagal",
        description: "Terjadi kesalahan sistem. Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ds-section-canvas relative flex min-h-screen items-center justify-center p-4">
      <HeroGridBackdrop variant="hero" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <SiteLogo className="mb-6" />
          <h1 className="text-3xl font-medium tracking-tight text-foreground">
            Masuk
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gunakan akun yang terdaftar di sistem ini.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Development</p>
            <p>
              Pastikan PostgreSQL jalan, set{" "}
              <code className="bg-muted px-1 rounded">DATABASE_URL</code>, lalu{" "}
              <code className="bg-muted px-1 rounded">npm run db:push</code>{" "}
              atau{" "}
              <code className="bg-muted px-1 rounded">npm run db:migrate</code>{" "}
              dan <code className="bg-muted px-1 rounded">npm run db:seed</code>{" "}
              untuk user admin pertama.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password akun Anda"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="pill"
              className="h-11 w-full"
              disabled={isLoading}
            >
              {isLoading ? "Memverifikasi…" : "Masuk"}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Belum punya akun? Hubungi administrator untuk pembuatan akun.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat…</div>}>
      <LoginForm />
    </Suspense>
  );
}
