import { existsSync } from "fs";
import path from "path";

import { manager } from "@/index";
import {
	CreateProductValidator, CryptoValidator, OrderValidator, WhatsappValidator
} from "@backend/validator/utils.validator";
import { logWithLabel } from "@lib/utils/log";
import { CryptoData, OrderData, ProductData, WhatsappData } from "@typings/index";

export const DataService = async () => {
  const ram = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100; // RAM en MB
  const cpu = Math.round((process.cpuUsage().system / 1000) * 100) / 100; // CPU en ms
  return { cpu, ram };
};

export const TicketService = async (nameFile: string) => {
  try {
    const safeFileName = path.basename(nameFile);
    const dir = path.join(__dirname, "../../../config/transcripts");
    const file = path.join(dir, safeFileName);
    return existsSync(file) ? file : null;
  } catch (error) {
    logWithLabel("error", `Error: ${error}`);
    return null;
  }
};

export const UpdateRoleService = async (userId: string, role: string) => {
  const data = await manager.prisma.auth.findUnique({ where: { discord: userId } });
  if (!data) return "User not found";

  await manager.prisma.auth.update({ where: { discord: userId }, data: { rol: role } });
  return "Role updated";
};

export const WhatsappService = async (body: Partial<WhatsappData>) => {
  const { response, message, userId, username } = body;
  const validator = WhatsappValidator.safeParse(body);
  if (!validator.success)
    return {
      code: 400,
      errors: validator.error.errors,
      data: null,
    };

  const data = await manager.prisma.messageWhatsapp.create({
    data: {
      userId: userId as string,
      username: username as string,
      response: response as string,
      message: message as string,
    },
  });

  return {
    code: 200,
    message: "Message created",
    data,
  };
};

export const CryptoService = async (body: Partial<CryptoData>) => {
  const { enabled, token, coinId, preferred, symbol, separator } = body;
  const validator = CryptoValidator.safeParse(body);
  if (!validator.success)
    return {
      code: 400,
      errors: validator.error.errors,
      data: null,
    };

  const data = await manager.prisma.botCrypto.findUnique({ where: { token } });
  if (data)
    return {
      code: 400,
      errors: "Token already exists",
      data: null,
    };

  await manager.prisma.botCrypto.create({
    data: {
      enabled: enabled as boolean,
      token: token as string,
      coinId: coinId as string,
      preferred: preferred as string,
      symbol: symbol as string,
      separator: separator as string,
    },
  });

  return {
    code: 200,
    message: "Bot Crypto registered",
    data: null,
  };
};

export const ProductService = async (body: Partial<ProductData>) => {
  const { name, description, image, url, userId } = body;
  const validator = CreateProductValidator.safeParse(body);
  if (!validator.success)
    return {
      code: 400,
      errors: validator.error.errors,
      data: null,
    };

  const data = await manager.prisma.freeProduct.findMany({ where: { productname: name } });
  if (data.length > 0)
    return {
      code: 400,
      errors: "Product already exists",
      data: null,
    };

  await manager.prisma.freeProduct.create({
    data: {
      productname: name as string,
      description: description as string,
      image: image as string,
      url: url as string,
      productId: `${data.length + 1}`,
      userId: userId as string,
    },
  });

  return {
    code: 200,
    message: "Product created",
    data: null,
  };
};

export const OrderService = async (body: Partial<OrderData>) => {
  const { name, image, price, type, payment, info, status, userId } = body;
  if (!name || !image || !price || !type || !payment || !info || !status || !userId)
    return {
      code: 400,
      errors: "Missing data",
      data: null,
    };

  const validator = OrderValidator.safeParse(body);
  if (!validator.success)
    return {
      code: 400,
      errors: validator.error.errors,
      data: null,
    };

  const orderCount = await manager.prisma.order.count();
  await manager.prisma.order
    .create({
      data: {
        name: name,
        userId,
        image,
        number: orderCount + 1,
        price: Number(price),
        quantity: type,
        metode: payment,
        info,
        status,
      },
    })
    .then(async () => {
      const db = await manager.prisma.auth.findUnique({ where: { discord: userId } });
      if (!db)
        return {
          code: 400,
          errors: "User not found",
          data: null,
        };

      return {
        code: 200,
        message: "Order created",
        data: null,
      };
    });

  return {
    code: 500,
    errors: "Order not created",
    data: null,
  };
};
