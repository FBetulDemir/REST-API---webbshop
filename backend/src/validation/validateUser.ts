import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "name is required"),
  password: z.string().min(6, "password must be at least 6 chars"),
  email: z.string().email().optional(),
});

export const loginSchema = z.object({
  name: z.string().min(1, "name is required"),
  password: z.string().min(1, "password is required"),
});
