import { GeminiCtrl } from "@backend/domain/controller/api/user/gemini.ctrl";
import { rateLimit } from "@backend/shared/ratelimit";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/users/gemini${str}`;

export default ({ app }: TRoutesInput) => {
  app.post(format("/generate"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), GeminiCtrl.Generate);
  app.get(format("/info"), GeminiCtrl.Info);
};
