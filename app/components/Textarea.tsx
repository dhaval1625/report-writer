"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import { ResizeIcon } from "./Icons";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className="group relative w-full">
        <textarea
          ref={ref}
          className={`w-full rounded-lg bg-muted-bg/50 focus:bg-background border border-transparent focus:border-accent/30 p-3.5 pr-8 pb-8 text-sm outline-none resize-y transition-colors leading-relaxed ${className}`}
          {...props}
        />
        <div 
          className="absolute bottom-2.5 right-0.5 pointer-events-none text-muted/60 group-focus-within:text-accent/70 transition-colors duration-200" 
          title="Resizable vertically"
        >
          <ResizeIcon />
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
