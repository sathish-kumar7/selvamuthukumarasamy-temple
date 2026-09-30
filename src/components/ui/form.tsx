import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "block w-full rounded-lg border bg-white px-3 text-base text-stone-900 shadow-sm placeholder:text-stone-400 " +
  "focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 disabled:bg-stone-100 disabled:text-stone-500";

export function Label({ className, children, required, ...props }: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-stone-700", className)} {...props}>
      {children}
      {required ? <span className="ml-0.5 text-red-600" aria-hidden>*</span> : null}
    </label>
  );
}

export function Input({ className, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(controlBase, "h-12", invalid ? "border-red-400" : "border-stone-300", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({ className, invalid, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(controlBase, "h-12", invalid ? "border-red-400" : "border-stone-300", className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, invalid, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(controlBase, "min-h-24 py-2.5", invalid ? "border-red-400" : "border-stone-300", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-stone-500">{children}</p>;
}

interface FieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Label + control + error wrapper. The child control must use `id={name}`. */
export function Field({ label, name, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      {children}
      {error ? <FieldError id={`${name}-error`} message={error} /> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}
