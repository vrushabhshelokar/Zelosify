"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  fileName = "Candidate Document",
  previewUrl = null,
  textContent = null,
  isLoading = false,
  error = null,
}) {
  const [copied, setCopied] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`relative z-10 w-full flex flex-col bg-card border border-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
            isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[85vh] max-w-4xl"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate max-w-md">
                  {fileName}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Secure S3 Stream · Candidate Document
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy button if text content */}
              {textContent && (
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Copy Text Content"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Download direct */}
              {previewUrl && (
                <a
                  href={previewUrl}
                  download={fileName}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              {/* Fullscreen toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden sm:inline-flex"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-auto bg-muted/20 relative flex flex-col">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 z-20 space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">
                  Streaming candidate document from secure vault...
                </p>
              </div>
            )}

            {error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <h4 className="text-base font-semibold text-foreground mb-1">
                  Unable to Preview Document
                </h4>
                <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    download={fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                  >
                    <Download className="w-4 h-4" />
                    Download File Directly
                  </a>
                )}
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                title={fileName}
                className="w-full h-full border-0 flex-1 bg-white"
              />
            ) : textContent ? (
              <div className="p-6">
                <div className="p-4 rounded-xl bg-card border border-border font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed max-w-none shadow-sm">
                  {textContent}
                </div>
              </div>
            ) : (
              !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <FileText className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No preview content available.</p>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
