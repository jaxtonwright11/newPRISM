"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";

interface ShimmerButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const sizeClasses = {
      sm: "px-4 py-2 text-xs min-h-[36px]",
      md: "px-6 py-2.5 text-sm min-h-[44px]",
      lg: "px-8 py-3.5 text-sm md:text-base min-h-[52px]",
    };

    const variantClasses = {
      primary:
        "bg-[var(--accent-primary)] text-white relative overflow-hidden",
      secondary:
        "bg-[var(--bg-surface)] border border-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-dim)]/30",
      ghost:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50",
    };

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        whileHover={isDisabled ? undefined : { scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`
          rounded-xl font-body font-medium transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${fullWidth ? "w-full" : ""}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {/* Shimmer overlay for primary variant */}
        {variant === "primary" && !isDisabled && (
          <motion.div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
            style={{
              background:
                "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.12) 50%, transparent 75%)",
              backgroundSize: "200% 100%",
            }}
            animate={{
              backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}

        {/* Glow effect for primary variant */}
        {variant === "primary" && !isDisabled && (
          <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 shadow-[0_0_24px_rgba(212,149,107,0.35)]" />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading && (
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {children}
        </span>
      </motion.button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
