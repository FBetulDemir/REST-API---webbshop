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

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  })
  .refine((d) => d.name || d.email || d.password, {
    message: "No fields to update",
  });

export const idParamSchema = z.object({
  id: z.string().min(1, "id is required"),
});

export const validate =
  <S extends z.ZodTypeAny>(
    schema: S,
    source: "body" | "params" | "query" = "body"
  ) =>
  (req: any, res: any, next: any) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.format() });
    req[source] = parsed.data;
    next();
  };
