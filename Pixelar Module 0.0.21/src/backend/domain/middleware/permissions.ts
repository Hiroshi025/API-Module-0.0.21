import { NextFunction, Request, Response } from "express";

import { manager } from "@/index";
import { ErrorExpress } from "@backend/shared/handlers";
import { config } from "@lib/utils/config";

// ROLE ADMIN WEB
export const RoleAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //obtener el id del usuario logeado
    const owners = config.bot.owners;
    const userId = req.params.id;

    if (!owners.includes(userId)) return res.redirect("/web/error-404");
    next();
  } catch (error) {
    console.log(error);
    res.redirect("/web/error-500");
  }
};

// ROLE DEVS API
export const RoleDevs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //obtener el id del usuario logeado
    const userId = req.headers["user-identifier"] as string;
    const data = await manager.prisma.auth.findUnique({ where: { discord: userId } });

    //verificar si el usuario tiene permisos de admin
    if (!data) {
      return res.status(404).json({
        data: null,
        errors: {
          message: "User not found",
          date: new Date(),
        },
      });
    }
    if (data.rol !== "developer") {
      return res.status(401).json({
        data: null,
        errors: {
          message: "User not have permissions",
          required: "developer",
          date: new Date(),
        },
      });
    }

    next();
  } catch (error) {
    console.log(error);
    ErrorExpress(res, 500, "Internal Server Error");
  }
};
