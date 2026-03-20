import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
  className?: string;
}

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

export function IndiqoMark({ size = "md", variant = "dark", className }: LogoProps) {
  const pixelSize = sizeMap[size];
  
  // High-performance SVG with premium 'iQ' mark
  const headColor = variant === "dark" ? "#67e8f9" : "#0891b2";
  const gradStart = variant === "dark" ? "#22d3ee" : "#0891b2";
  const gradEnd = variant === "dark" ? "#4338ca" : "#1e40af";

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={`logo-grad-${variant}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradStart} />
          <stop offset="100%" stopColor={gradEnd} />
        </linearGradient>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* The 'i' */}
      <rect x="12" y="16" width="6" height="32" rx="3" fill={`url(#logo-grad-${variant})`} />
      <circle cx="15" cy="8" r="3" fill={headColor} filter="url(#logo-glow)" />
      
      {/* The 'Q' */}
      <circle cx="40" cy="32" r="16" stroke={`url(#logo-grad-${variant})`} strokeWidth="5" />
      <path d="M50 42L58 50" stroke={`url(#logo-grad-${variant})`} strokeWidth="5" strokeLinecap="round" />
      
      {/* Glowing tail tip */}
      <circle cx="58" cy="50" r="2" fill={headColor} filter="url(#logo-glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function IndiqoWordmark({ size = "md", variant = "dark", className }: LogoProps) {
  const textSize = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-5xl",
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <IndiqoMark size={size} variant={variant} />
      <span className={cn(
        "font-inter font-semibold tracking-[-0.5px]",
        textSize,
        variant === "dark" ? "text-white" : "text-brand-bg"
      )}>
        indiqo
      </span>
    </div>
  );
}
