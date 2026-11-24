"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl">
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
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-10 w-full flex flex-col bg-[#09090b] border border-zinc-800 border-t-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden transition-all duration-300 ${
            isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[85vh] max-w-4xl"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#3080ff]/10 text-[#3080ff] border border-[#3080ff]/20">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {fileName}
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Zelosify Secure S3 Stream · Candidate Document
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy button if text content */}
              {textContent && (
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Copy Text Content"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#00d294]" />
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
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              {/* Fullscreen toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors hidden sm:inline-flex"
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
                className="p-2 rounded-xl text-zinc-400 hover:text-[#fb2c36] hover:bg-[#fb2c36]/10 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-auto bg-black/40 relative flex flex-col">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 space-y-3">
                <Loader2 className="w-8 h-8 text-[#3080ff] animate-spin" />
                <p className="text-sm text-zinc-400 font-medium">
                  Streaming candidate document from secure vault...
                </p>
              </div>
            )}

            {error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-10 h-10 text-[#fb2c36] mb-3" />
                <h4 className="text-base font-semibold text-white mb-1">
                  Unable to Preview Document
                </h4>
                <p className="text-sm text-zinc-400 max-w-md mb-4">{error}</p>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    download={fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3080ff] text-white text-sm font-semibold hover:bg-[#2563eb] shadow-lg shadow-[#3080ff]/20"
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
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-w-none shadow-sm">
                  {textContent}
                </div>
              </div>
            ) : (
              !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                  <FileText className="w-10 h-10 mb-2 opacity-40" />
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
