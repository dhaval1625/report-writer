"use client";

import React, { useState, useEffect } from "react";

interface OutputReportProps {
  title: string;
  generatedText: string;
  onTextChange: (text: string) => void;
}

export default function OutputReport({ title, generatedText, onTextChange }: OutputReportProps) {
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className={`flex flex-col rounded-2xl border bg-card-bg p-5 shadow-sm transition-all duration-300 ${
      isFocused ? "border-accent ring-1 ring-accent/20" : "border-card-border"
    }`}>
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-card-border/50">
        <span className="text-sm font-semibold tracking-tight text-foreground">{title}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            copied
              ? "bg-green-600/10 text-green-600 dark:text-green-400 border border-green-500/20"
              : "bg-accent/15 text-accent hover:bg-accent/20 border border-accent/10"
          }`}
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Report
            </>
          )}
        </button>
      </div>

      <textarea
        value={generatedText}
        onChange={(e) => onTextChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full h-48 rounded-lg bg-muted-bg/50 hover:bg-muted-bg/75 focus:bg-background border border-transparent focus:border-accent/30 p-3.5 text-sm font-mono outline-none resize-y transition-colors leading-relaxed"
        placeholder="Report will appear here..."
      />
    </div>
  );
}
