import { NekoCtrl } from "@backend/domain/controller/api/user/nekos.ctrl";
import { rateLimit } from "@backend/shared/ratelimit";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/users/neko-anime${str}`;

export default ({ app }: TRoutesInput) => {
  app.post(format("/animelist"), rateLimit({ maxRequests: 5, windowMs: 60000, cooldownMs: 120000 }), NekoCtrl.AnimelistPost);
};
