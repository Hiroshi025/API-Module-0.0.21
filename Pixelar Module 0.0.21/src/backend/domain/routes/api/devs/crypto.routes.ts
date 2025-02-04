// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { CryptoCtrl } from "@backend/domain/controller/api/devs/crypto.ctrl";
import { TokenApi } from "@backend/domain/middleware/auth";
import { RoleDevs } from "@backend/domain/middleware/permissions";
import { rateLimit } from "@backend/shared/ratelimit";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/devs/cryptobots${str}`;

export default ({ app }: TRoutesInput) => {
  app.delete(format("/:token"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, CryptoCtrl.DeleteApp);
  app.put(format("/:token"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, CryptoCtrl.EditApp);
  app.get(format("/:id"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, CryptoCtrl.GetApp);
  app.get(format("/"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, CryptoCtrl.GetApps);
};

