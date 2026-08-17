import React from "react";

export default function GlobalLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0A0A0B] text-[#FAFAFA]">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2E2E32] border-t-[#3399FF]" />
        <p className="text-sm font-medium text-[#A0A4A8]">Loading Agbofa Nexus AI...</p>
      </div>
    </div>
  );
}
