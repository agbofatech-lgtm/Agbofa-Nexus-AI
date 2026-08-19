import { z } from "zod";

export const loginSchema = z.object({
  tenant: z.string().trim().min(1, "Tenant is required"),
  admin: z
    .string()
    .trim()
    .min(1, "Admin is required")
    .email("Enter a valid admin email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
