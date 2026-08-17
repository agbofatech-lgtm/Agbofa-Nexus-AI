"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0A0A0B] p-4">
      <LoginForm onSuccess={() => router.push("/reader")} />
    </div>
  );
}
