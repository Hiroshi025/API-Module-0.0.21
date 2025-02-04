import { z } from "zod";

import { validateString } from "@backend/domain/middleware/validator";

/* This TypeScript code is defining two Zod schemas for validating user input during authentication
processes. */
export const AuthRegister = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
  discord: z.string().min(3),
});

export const AuthLogin = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const ValidateSource = {
  title: validateString({ required: true, minlength: 3, maxlength: 50 }),
  lenguage: validateString({ required: true, maxlength: 50 }),
  content: validateString({ required: true }),
  userId: validateString({ required: true }),
};

export const ValidateRegister = {
  password: validateString({ required: true, minlength: 6, maxlength: 50 }),
  discord: validateString({ required: true, minlength: 3, maxlength: 50 }),
  name: validateString({ required: true, minlength: 3, maxlength: 50 }),
  email: validateString({ required: true, email: true, maxlength: 50 }),
};

export const ValidateLogin = {
  name: validateString({ required: true, minlength: 3, maxlength: 50 }),
  email: validateString({ required: true, email: true, maxlength: 50 }),
};
