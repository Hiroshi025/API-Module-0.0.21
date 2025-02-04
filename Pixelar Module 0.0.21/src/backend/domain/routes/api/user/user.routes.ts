import { UserCtrl } from "@backend/domain/controller/api/user/public.ctrl";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/api/v1/users${str}`;

export default ({ app }: TRoutesInput) => {
  app.get(format("/role-list"), UserCtrl.RoleApiList);
  app.get(format("/"), UserCtrl.Health);
};
