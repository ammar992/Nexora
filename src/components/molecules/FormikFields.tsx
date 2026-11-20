"use client";

import { useField } from "formik";
import { Input, TextArea, Select, Checkbox } from "@/components/atoms/Field";

type Common = { name: string; label: string; hint?: string; containerClassName?: string };

/** Formik-bound fields: errors appear after the field is touched or the form is submitted. */
export function FInput({ name, ...rest }: Common & Omit<React.ComponentProps<typeof Input>, "name" | "error">) {
  const [field, meta] = useField(name);
  return <Input {...field} value={field.value ?? ""} {...rest} error={meta.touched && meta.error} />;
}

export function FTextArea({ name, ...rest }: Common & Omit<React.ComponentProps<typeof TextArea>, "name" | "error">) {
  const [field, meta] = useField(name);
  return <TextArea {...field} value={field.value ?? ""} {...rest} error={meta.touched && meta.error} />;
}

export function FSelect({ name, children, ...rest }: Common & Omit<React.ComponentProps<typeof Select>, "name" | "error">) {
  const [field, meta] = useField(name);
  return (
    <Select {...field} value={field.value ?? ""} {...rest} error={meta.touched && meta.error}>
      {children}
    </Select>
  );
}

export function FCheckbox({ name, label, description }: { name: string; label: React.ReactNode; description?: string }) {
  const [field, meta] = useField({ name, type: "checkbox" });
  return (
    <div>
      <Checkbox {...field} label={label} description={description} />
      {meta.touched && meta.error && <p className="pt-1 pl-8 text-[13px] font-medium text-danger">{meta.error}</p>}
    </div>
  );
}

/** Applies server-side field errors (from ApiClientError.fields) to a Formik form. */
export function applyServerErrors(err: unknown, setErrors: (e: Record<string, string>) => void) {
  const fields = (err as { fields?: Record<string, string> })?.fields;
  if (fields && Object.keys(fields).length) setErrors(fields);
}
