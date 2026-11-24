import pdf from "pdf-extraction";
import { sanitizeResumeText } from "../promptSanitizer.js";

export interface ParsedResumeDocument {
  text: string;
  charCount: number;
  wordCount: number;
  mimeType: string;
  fileName: string;
}

/**
 * Parses raw PDF buffer using pdf-extraction
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text || "";
}

/**
 * Minimalist parser for PPTX buffers (extracting slide text from XML components)
 */
export async function parsePptxBuffer(buffer: Buffer): Promise<string> {
  // PPTX is a ZIP file containing ppt/slides/slide*.xml
  // We extract utf-8 text runs within XML tags
  const rawString = buffer.toString("utf-8");
  const textRuns = rawString.match(/<a:t>([^<]+)<\/a:t>/g);
  if (textRuns && textRuns.length > 0) {
    return textRuns
      .map((tag) => tag.replace(/<\/?a:t>/g, ""))
      .join(" ");
  }
  // Fallback: strip basic non-ASCII and XML markers
  return rawString.replace(/<[^>]+>/g, " ").replace(/[^\x20-\x7E\n]/g, " ");
}

/**
 * Resume Parsing Tool
 * Invoked by the LLM Agent Orchestrator to parse binary resume buffers into sanitized text.
 */
export async function parseResumeDocument(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParsedResumeDocument> {
  const ext = fileName.toLowerCase().split(".").pop();
  let extractedRaw = "";

  if (ext === "pdf") {
    try {
      extractedRaw = await parsePdfBuffer(fileBuffer);
    } catch (err: any) {
      console.warn(`[ResumeParser] PDF parsing warning: ${err.message}, attempting buffer fallback`);
      extractedRaw = fileBuffer.toString("utf-8").replace(/[\u0000-\u001F]/g, " ");
    }
  } else if (ext === "pptx" || ext === "ppt") {
    extractedRaw = await parsePptxBuffer(fileBuffer);
  } else {
    extractedRaw = fileBuffer.toString("utf-8");
  }

  // Mandatory prompt injection sanitization
  const sanitized = sanitizeResumeText(extractedRaw);
  const wordCount = sanitized.split(/\s+/).filter(Boolean).length;

  return {
    text: sanitized,
    charCount: sanitized.length,
    wordCount,
    mimeType: ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    fileName,
  };
}
