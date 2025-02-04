// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { ToolsCtrl } from "@backend/domain/controller/api/devs/tools.ctrl";
import { TokenApi } from "@backend/domain/middleware/auth";
import { RoleDevs } from "@backend/domain/middleware/permissions";
import { rateLimit } from "@backend/shared/ratelimit";
import { TRoutesInput } from "@typings/index";

const format = (str: string): string => `/api/v1/devs/tools${str}`;
export default ({ app }: TRoutesInput) => {
      app.get(format("/sources"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, ToolsCtrl.GetSources);
      app.get(format("/tasks"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, ToolsCtrl.GetTasks);
      app.get(format("/stats"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, ToolsCtrl.GetStats);
};