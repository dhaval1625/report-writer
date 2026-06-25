"use client";

import React, { useEffect } from "react";
import Button from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const iconColorClasses = {
    danger: "bg-red-500/10 text-red-500",
    warning: "bg-yellow-500/10 text-yellow-500",
    info: "bg-blue-500/10 text-blue-500",
  };

  const confirmButtonClasses = {
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/20",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500/20",
    info: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-backdrop-fade cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal box */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-card-border bg-card-bg p-6 shadow-xl animate-modal-scale-up">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColorClasses[variant]}`}>
            {variant === "danger" || variant === "warning" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">
              {title}
            </h3>
            <div className="mt-2 text-xs text-muted leading-relaxed">
              {message}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2.5">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`${confirmButtonClasses[variant]} px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors duration-200`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
