// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { AuthApiCtrl } from "@backend/domain/controller/api/auth/auth.ctrl";
import { TokenApi } from "@backend/domain/middleware/auth";
import { validateObject } from "@backend/domain/middleware/validator";
import { rateLimit } from "@backend/shared/ratelimit";
import { ValidateLogin, ValidateRegister } from "@backend/validator/auth.validator";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/auth${str}`;

export default ({ app }: TRoutesInput) => {
  app.post(format("/register"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), validateObject(ValidateRegister), AuthApiCtrl.Register);
  app.post(format("/login"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), validateObject(ValidateLogin), AuthApiCtrl.Login);
  app.get(format("/:id"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, AuthApiCtrl.Info);
};
