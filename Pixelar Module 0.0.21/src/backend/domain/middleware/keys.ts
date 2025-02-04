/* eslint-disable @typescript-eslint/no-explicit-any */
// UTILS AUTH KEYS
import { NextFunction, Request, Response } from "express";

import { encrypt, verified } from "@backend/shared/tokens";
import { config } from "@lib/utils/config";

export const UtilsApi = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keyByUser: string = req.headers["utils-key"] as string;
    const key = config.express.keys.utils;
    if (!keyByUser) {
      return res.status(401).json({
        data: null,
        errors: {
          message: "Key not found",
          date: new Date(),
        },
      });
    }

    const encriptedKey = await encrypt(key);

    const verifiedHash = await verified(keyByUser, encriptedKey);
    if (!verifiedHash) {
      return res.status(401).json({
        data: null,
        errors: {
          message: "Key not valid",
          date: new Date(),
        },
      });
    }
    next();
  } catch (error: any) {
    return res.status(500).json({
      data: null,
      errors: {
        message: "Internal server error",
        error: error.message,
        date: new Date(),
      },
    });
  }
};

export const DevUtilKey = async (req: Request, res: Response) => {
  try {
    const keyByUser: string = req.headers["development-key"] as string;
    const key = config.express.keys.development;
    const encriptedKey = await encrypt(key);

    const verifiedHash = await verified(keyByUser, encriptedKey);
    if (!verifiedHash) {
      return res.status(401).json({
        data: null,
        errors: {
          message: "Key not valid",
          date: new Date(),
        },
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      data: null,
      errors: {
        message: "Internal server error",
        error: error.message,
        date: new Date(),
      },
    });
  }
};
