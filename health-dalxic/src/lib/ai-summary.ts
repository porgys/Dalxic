import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { AISummary } from "@/types";

const AISummarySchema = z.object({
  brief: z.string().describe("Max 20 words summary"),
  clinicalSummary: z.string().describe("2-4 sentence clinical summary"),
  riskFlags: z.array(z.string()).describe("Array of risk flags, empty if none"),
});

export async function generateAISummary(recordData: {
  patient: unknown;
  visit: unknown;
  diagnosis: unknown;
  treatment: unknown;
  lab: unknown;
}): Promise<AISummary> {
  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a clinical summarisation assistant for DalxicHealth. Generate concise, accurate summaries of patient visit records.

Rules:
- brief: max 20 words, captures the essence of the visit
- clinicalSummary: 2-4 sentences covering presenting complaint, findings, diagnosis, and plan
- riskFlags: flag reactive/abnormal lab results, drug interactions, high-risk conditions. Empty array if none.
- Never fabricate information. If a field is missing, note "Not recorded" in the summary.
- Know the difference between pending and completed lab tests.`,
    prompt: `Summarise this patient visit record:\n${JSON.stringify(recordData, null, 2)}`,
    output: Output.object({ schema: AISummarySchema }),
  });

  return output ?? { brief: "Summary unavailable", clinicalSummary: "Unable to generate summary.", riskFlags: [] };
}
