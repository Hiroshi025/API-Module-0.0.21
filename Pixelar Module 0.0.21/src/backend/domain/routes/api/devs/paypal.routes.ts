// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { PayPalCtrl } from "@backend/domain/controller/api/devs/paypal.ctrl";
import { DevUtilKey } from "@backend/domain/middleware/keys";
import { rateLimit } from "@backend/shared/ratelimit";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/devs/paypal${str}`;

export default ({ app }: TRoutesInput) => {
  app.post(format('/create-order'), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), DevUtilKey, PayPalCtrl.CreateOrder);
  app.get(format('/capture-order'), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), PayPalCtrl.CaptureOrder);
  app.get(format('/cancel-order'), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), PayPalCtrl.RefundOrder);

};

