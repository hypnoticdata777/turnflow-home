import { z } from "zod";

export type SignupFields = {
  name: string;
  email: string;
};

export type SignupFieldErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
};

export type ProfileFieldErrors = {
  name?: string[];
};

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Za-z]/, "Use at least one letter.")
    .regex(/[0-9]/, "Use at least one number."),
});

const ownerProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
});

export function parseSignupFields(input: {
  name: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
  password: FormDataEntryValue | null;
}) {
  return signupSchema.safeParse({
    name: input.name,
    email: input.email,
    password: input.password,
  });
}

export function signupValuesFromFormData(formData: FormData): SignupFields {
  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
  };
}

export function parseOwnerProfileFields(input: { name: FormDataEntryValue | null }) {
  return ownerProfileSchema.safeParse({ name: input.name });
}
