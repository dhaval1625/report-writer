"use client";

import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "custom";
}

export default function Button({
  children,
  className = "",
  variant = "custom",
  type = "button",
  ...props
}: ButtonProps) {
  // Base classes that are common to all our buttons
  const baseClasses = "cursor-pointer transition-all duration-200 select-none active:scale-[0.98] outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  // Predefined variants matching the site's sleek theme
  const variantClasses = {
    primary: "bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm",
    secondary: "bg-muted-bg text-muted hover:bg-muted/20 px-4 py-2 rounded-xl text-sm font-semibold",
    danger: "text-muted hover:text-red-500 rounded-md hover:bg-muted-bg/50 p-1",
    ghost: "flex items-center gap-1.5 rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted-bg",
    custom: "", // Allows passing custom classes directly
  };

  const combinedClassName = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <button type={type} className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
