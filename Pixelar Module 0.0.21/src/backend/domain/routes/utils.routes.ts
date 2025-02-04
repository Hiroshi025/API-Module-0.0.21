import {
	AdminRegisterBotCrypto, AdminRegisterOrder, AdminTranscripts, AdminUpdateRoleUser,
	AdminWhatsapp, CreateProduct
} from "@backend/domain/controller/utils.ctrl";
import { UtilsApi } from "@backend/domain/middleware/keys";
import { TRoutesInput } from "@typings/api/express";

const format = (str: string): string => `/utils${str}`;
export default ({ app }: TRoutesInput) => {
  //Admin
  app.post(format("/dashboard/admins/update-user-role"), UtilsApi, AdminUpdateRoleUser); // Update role user api
  app.post(format("/dashboard/admins/register-proyect"), UtilsApi, AdminRegisterOrder); // Register proyect api
  app.post(format("/dashboard/admins/save-whatsapp"), UtilsApi, AdminWhatsapp); // Get data api
  app.get(format("/dashboard/tickets/:file"), AdminTranscripts);

  //Add Bot
  app.post(format("/dashboard/bots/crptocurrency-add"), UtilsApi, AdminRegisterBotCrypto); // Register proyect api

  //Add Product Fre
  app.post(format("/dashboard/products/free-add"), UtilsApi, CreateProduct); // Register proyect api
};
