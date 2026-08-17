"use client";

import React from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";

export interface LogoProps {
  compact?: boolean;
  theme?: "light" | "dark";
  className?: string;
}

export function Logo({ compact = false, theme = "dark", className = "" }: LogoProps): React.JSX.Element {
  if (compact) {
    return (
      <img
        src={AuthoritativeBrandIdentity.assets.mark}
        alt={`${AuthoritativeBrandIdentity.productName} Mark`}
        className={`h-8 w-8 object-contain ${className}`}
      />
    );
  }

  const logoSrc =
    theme === "light"
      ? AuthoritativeBrandIdentity.assets.lightLogo
      : AuthoritativeBrandIdentity.assets.darkLogo;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img
        src={logoSrc}
        alt={AuthoritativeBrandIdentity.productName}
        className="h-9 w-auto object-contain"
      />
    </div>
  );
}
