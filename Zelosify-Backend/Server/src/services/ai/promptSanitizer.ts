/**
 * Prompt Injection Sanitization Layer
 * Mitigates jailbreaking, instruction hijacking, and system override attempts from untrusted resume inputs.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /you\s+are\s+now\s+(a|an|the)\s+/gi,
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /user\s*:\s*/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<\/SYS>>/gi,
  /disregard\s+the\s+instructions/gi,
  /always\s+(output|recommend|score)\s+/gi,
  /give\s+a\s+score\s+of\s+1/gi,
  /100%\s+match/gi,
  /bypass\s+evaluation/gi,
];

export function sanitizeResumeText(rawText: string, maxLength: number = 8000): string {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  // 1. Enforce length limit to prevent token exhaustion/stuffing attacks
  let cleaned = rawText.slice(0, maxLength);

  // 2. Strip known prompt injection triggers and role tags
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[FILTERED_INSTRUCTION]");
  }

  // 3. Strip non-printable / control characters (keep regular whitespace and common punctuation)
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, " ");

  // 4. Normalize consecutive whitespaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}
