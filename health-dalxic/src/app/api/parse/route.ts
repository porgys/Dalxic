import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { PARSE_SYSTEM_PROMPT } from "@/lib/parse-prompt";
import type { ParseRequest, ParseResponse } from "@/types";

const ParsedEntrySchema = z.object({
  patient: z.object({
    fullName: z.string(),
    dateOfBirth: z.string().nullable(),
    gender: z.enum(["male", "female", "other"]).nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    insuranceId: z.string().nullable(),
    emergencyContact: z.string().nullable(),
  }),
  visit: z.object({
    date: z.string(),
    chiefComplaint: z.string(),
    department: z.string().nullable(),
    assignedDoctor: z.string().nullable(),
    queueToken: z.string().nullable(),
    entryPoint: z.enum(["front_desk", "emergency", "referral"]),
  }),
  diagnosis: z.object({
    primary: z.string().nullable(),
    secondary: z.array(z.string()),
    icdCodes: z.array(z.string()),
    notes: z.string().nullable(),
  }),
  treatment: z.object({
    prescriptions: z.array(
      z.object({
        medication: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        notes: z.string().nullable(),
      })
    ),
    procedures: z.array(z.string()),
    followUp: z.string().nullable(),
    nextAppointment: z.string().nullable(),
  }),
  lab: z
    .array(
      z.object({
        testName: z.string(),
        category: z.enum([
          "haematology",
          "biochemistry",
          "microbiology_serology",
          "urine_stool",
          "other",
        ]),
      })
    )
    .nullable(),
  targetMonth: z.number().min(1).max(12),
  targetYear: z.number(),
  confidence: z.enum(["high", "medium", "low"]),
  rawText: z.string(),
});

const ParseOutputSchema = z.object({
  entries: z.array(ParsedEntrySchema),
  totalDetected: z.number(),
  warnings: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ParseRequest;

    if (!body.rawText?.trim()) {
      return Response.json(
        { error: "rawText is required" },
        { status: 400 }
      );
    }

    if (!body.hospitalCode?.trim()) {
      return Response.json(
        { error: "hospitalCode is required" },
        { status: 400 }
      );
    }

    const currentYear = body.defaultYear ?? new Date().getFullYear();

    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: PARSE_SYSTEM_PROMPT,
      prompt: `Parse the following bulk patient records for hospital "${body.hospitalCode}". Default year if not specified: ${currentYear}.

---
${body.rawText}
---

Return structured JSON with all detected patient entries.`,
      output: Output.object({ schema: ParseOutputSchema }),
    });

    if (!output) {
      return Response.json(
        { error: "Failed to parse records — no output from AI" },
        { status: 502 }
      );
    }

    const response: ParseResponse = {
      entries: output.entries,
      totalDetected: output.totalDetected,
      warnings: output.warnings,
    };

    return Response.json(response);
  } catch (error) {
    console.error("[parse] Error:", error);
    return Response.json(
      { error: "Internal server error during parsing" },
      { status: 500 }
    );
  }
}
