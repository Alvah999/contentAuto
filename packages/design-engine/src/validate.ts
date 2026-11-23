import { designSpecSchema, type DesignSpec } from "@content-auto/shared";
import type { ZodError } from "zod";

export interface ValidationResult {
  valid: boolean;
  data?: DesignSpec;
  errors?: string[];
}

export function validateDesignSpec(input: unknown): ValidationResult {
  const result = designSpecSchema.safeParse(input);
  if (!result.success) {
    return {
      valid: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { valid: true, data: result.data as DesignSpec };
}

function formatZodErrors(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}
