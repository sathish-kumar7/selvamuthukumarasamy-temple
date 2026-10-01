import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required").max(30),
  password: z.string().min(1, "Password is required"),
});
