"use client";

import React, { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <div className="group relative w-full">
      <textarea
        className={`w-full rounded-lg bg-muted-bg/50 focus:bg-background border border-transparent focus:border-accent/30 p-3.5 pr-8 pb-8 text-sm outline-none resize-y transition-colors leading-relaxed ${className}`}
        {...props}
      />
      <div 
        className="absolute bottom-2.5 right-0.5 pointer-events-none text-muted/60 group-focus-within:text-accent/70 transition-colors duration-200" 
        title="Resizable vertically"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 19h-6m6-6h-3" />
        </svg>
      </div>
    </div>
  );
}
