import { cn } from "@/lib/utils/cn";

export interface WatermarkLogoProps {
  variant?: "full" | "small" | "mini";
  className?: string;
}

export function WatermarkLogo({
  variant = "small",
  className,
}: WatermarkLogoProps) {
  if (variant === "mini") {
    return (
      <svg
        aria-hidden="true"
        className={cn("watermark-logo watermark-logo--mini", className)}
        viewBox="0 0 40 40"
      >
        <rect width="40" height="40" rx="12" fill="rgba(8,8,8,.78)" />
        <path
          d="M11.5 29L19.8 10.5L28.5 29M14.8 22.4H25"
          fill="none"
          stroke="#D4AF37"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.3"
        />
        <circle cx="29.4" cy="10.8" r="2.2" fill="#E8C84A" />
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <svg
        aria-hidden="true"
        className={cn("watermark-logo watermark-logo--full", className)}
        viewBox="0 0 320 112"
      >
        <rect width="320" height="112" rx="18" fill="rgba(8,8,8,.76)" />
        <rect x="13" y="15" width="65" height="65" rx="18" fill="#D4AF37" />
        <path
          d="M29 66L45.5 29L63 66M35.5 53H57"
          fill="none"
          stroke="#090909"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <circle cx="65" cy="29" r="4.5" fill="#090909" />
        <text
          x="94"
          y="49"
          fill="#D4AF37"
          fontFamily="Space Grotesk, Arial, sans-serif"
          fontSize="29"
          fontWeight="700"
          letterSpacing="3"
        >
          AGBOFA
        </text>
        <text
          x="95"
          y="74"
          fill="rgba(255,255,255,.92)"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="18"
          fontWeight="600"
          letterSpacing="4"
        >
          NEXUS AI
        </text>
        <text
          x="16"
          y="99"
          fill="#A0A4A8"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="9"
          letterSpacing="3"
        >
          AI-POWERED MEDIA
        </text>
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={cn("watermark-logo watermark-logo--small", className)}
      viewBox="0 0 210 62"
    >
      <rect width="210" height="62" rx="14" fill="rgba(8,8,8,.72)" />
      <rect x="8" y="8" width="46" height="46" rx="13" fill="#D4AF37" />
      <path
        d="M19 43L30.5 18L42.5 43M23.5 34H38"
        fill="none"
        stroke="#090909"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <circle cx="44" cy="18" r="3.3" fill="#090909" />
      <text
        x="65"
        y="31"
        fill="#D4AF37"
        fontFamily="Space Grotesk, Arial, sans-serif"
        fontSize="18"
        fontWeight="700"
        letterSpacing="1.5"
      >
        AGBOFA
      </text>
      <text
        x="66"
        y="47"
        fill="rgba(255,255,255,.9)"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="10"
        fontWeight="600"
        letterSpacing="2.6"
      >
        NEXUS AI
      </text>
    </svg>
  );
}
