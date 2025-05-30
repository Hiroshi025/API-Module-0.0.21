/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import { getToken } from "@backend/shared/tokens";

// WEB AUTH
export const AuthWeb = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/login");
  next();
};

// API AUTH
export const TokenApi = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtByUser = req.headers["authorization"] || "";
    const jwt = jwtByUser.split(" ").pop();
    if (!jwt)
      return res.status(401).json({
        data: null,
        errors: {
          message: "Token not found in headers",
          date: new Date(),
        },
      });

    const isUser = getToken(`${jwt}`);
    if (!isUser) {
      return res.status(401).json({
        data: null,
        errors: {
          message: "Token not valid",
          date: new Date(),
        },
      });
    } else {
      req.user = isUser;
      next();
    }
  } catch (e: any) {
    return res.status(500).json({
      data: null,
      errors: {
        message: "Internal server error",
        details: e.message,
        date: new Date(),
      },
    });
  }
};
