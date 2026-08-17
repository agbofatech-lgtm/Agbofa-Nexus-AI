"use client";

import React from "react";

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0A0A0B] p-6 text-[#FAFAFA]">
      <div className="w-full max-w-md rounded-lg border border-[#CF2020] bg-[#12121A] p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
          ⚠
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#FAFAFA]">System Error Encountered</h2>
        <p className="mb-4 text-sm text-[#A0A4A8]">
          {error?.message || "An unexpected system error occurred within Agbofa Nexus AI."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#0066CC] px-4 py-2 text-sm font-medium text-[#FAFAFA] hover:bg-[#3399FF] transition-colors"
        >
          Retry Application
        </button>
      </div>
    </div>
  );
}
