import React from "react";
import Link from "next/link";

export default function NotFoundPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0A0A0B] p-6 text-[#FAFAFA]">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-extrabold tracking-tight text-[#3399FF]">404</h1>
        <h2 className="mb-4 text-2xl font-bold text-[#FAFAFA]">Workspace Route Not Found</h2>
        <p className="mb-8 max-w-md text-sm text-[#A0A4A8]">
          The requested Agbofa Nexus AI route does not exist in the active tenant workspace.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-[#0066CC] px-5 py-2.5 text-sm font-medium text-[#FAFAFA] hover:bg-[#3399FF] transition-colors"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
