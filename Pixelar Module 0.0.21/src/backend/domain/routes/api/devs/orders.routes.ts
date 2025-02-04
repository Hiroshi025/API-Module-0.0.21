// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { OrdersCtrl } from "@backend/domain/controller/api/devs/orders.ctrl";
import { TokenApi } from "@backend/domain/middleware/auth";
import { RoleDevs } from "@backend/domain/middleware/permissions";
import { rateLimit } from "@backend/shared/ratelimit";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/devs/orders${str}`;

export default ({ app }: TRoutesInput) => {
  app.delete(format("/:id"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, OrdersCtrl.DeleteOrder);
  app.put(format("/:id"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, OrdersCtrl.EditOrder);
  app.get(format("/:id"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, OrdersCtrl.GetOrder);
  app.get(format("/"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), TokenApi, RoleDevs, OrdersCtrl.GetOrders);
};

