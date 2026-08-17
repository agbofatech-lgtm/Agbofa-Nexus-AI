"use client";

import React from "react";

export interface ReaderErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ReaderErrorBoundary({ error, reset }: ReaderErrorProps): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-[#CF2020] bg-[#12121A] p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
          ⚠
        </div>
        <h2 className="mb-2 text-lg font-bold text-[#FAFAFA]">
          Story Feed Retrieval Failed
        </h2>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          {error?.message ||
            "Unable to retrieve verified story packages from ContentFactoryService via BFF."}
        </p>
        <div className="flex flex-col justify-center space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#CF2020]/80 transition-colors"
          >
            Retry Feed Retrieval
          </button>
        </div>
      </div>
    </div>
  );
}
