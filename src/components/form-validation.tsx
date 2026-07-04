"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { z } from "zod";

export type FieldErrors = Record<string, string>;

const FormValidationContext = createContext<FieldErrors>({});

export function FormValidationProvider({
  children,
  errors,
}: {
  children: ReactNode;
  errors: FieldErrors;
}) {
  return <FormValidationContext.Provider value={errors}>{children}</FormValidationContext.Provider>;
}

export function useFieldError(name: string) {
  return useContext(FormValidationContext)[name] ?? null;
}

export function issuesToFieldErrors(issues: z.ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName !== "string" || errors[fieldName]) {
      continue;
    }

    errors[fieldName] = issue.message;
  }

  return errors;
}

export function FieldError({ name }: { name: string }) {
  const error = useFieldError(name);

  if (!error) {
    return null;
  }

  return <p className="text-xs font-medium leading-5 text-red-700">{error}</p>;
}
