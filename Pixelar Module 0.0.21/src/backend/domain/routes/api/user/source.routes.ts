import { SourceCtrl } from "@backend/domain/controller/api/user/source.ctrl";
import { validateObject } from "@backend/domain/middleware/validator";
import { rateLimit } from "@backend/shared/ratelimit";
import { ValidateSource } from "@backend/validator/auth.validator";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/users/sources${str}`;

export default ({ app }: TRoutesInput) => {
  app.post(format("/"), validateObject(ValidateSource), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), SourceCtrl.Create);
  app.put(format("/:id"), validateObject(ValidateSource), SourceCtrl.Update);
  app.delete(format("/:id"), SourceCtrl.Delete);
  app.get(format("/:id"), SourceCtrl.Get);
};
