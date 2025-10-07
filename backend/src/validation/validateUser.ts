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

// 'validate' is a reusable middleware factory that validates request data (body, params, or query) against a Zod schema. If validation fails, it sends a 400 error; otherwise, it passes control to the next middleware or route handler.
export const validate =
  //takes a Zod schema and an optional source ("body", "params", or "query"), defaulting to "body"
  //uses a generic type S to ensure type safety for the schema


    <S extends z.ZodTypeAny>(
      schema: S,
      source: "body" | "params" | "query" = "body"
    ) =>
    (req: any, res: any, next: any) => {
      const parsed = schema.safeParse(req[source]); //validate the specified part of the request (e.g., req.body) against the schema.
      if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
      req[source] = parsed.data;
      next();
    };
