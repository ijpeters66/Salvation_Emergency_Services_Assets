"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

type ConfirmActionFormProps = FormHTMLAttributes<HTMLFormElement> & {
  confirmMessage: string;
  children: ReactNode;
};

export function ConfirmActionForm({
  confirmMessage,
  children,
  onSubmit,
  ...props
}: ConfirmActionFormProps) {
  return (
    <form
      {...props}
      onSubmit={(event) => {
        onSubmit?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
