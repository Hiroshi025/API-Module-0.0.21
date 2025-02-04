// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { OwnerCtrl } from "@backend/domain/controller/api/devs/owner.ctrl";
import { TokenApi } from "@backend/domain/middleware/auth";
import { RoleDevs } from "@backend/domain/middleware/permissions";
import { rateLimit } from "@backend/shared/ratelimit";
import { TRoutesInput } from "@typings/index";

const format = (str: string): string => `/api/v1/devs/modules${str}`;
export default ({ app }: TRoutesInput) => {
      app.post(format("/reload"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, OwnerCtrl.ReloadApps);
};