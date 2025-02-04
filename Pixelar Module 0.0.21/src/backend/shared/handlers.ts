import { Response } from "express";

export const ErrorExpress = (res: Response, code: number, message: string) => {
  return res.status(code).json({
    data: null,
    errors: message,
  });
};

export const SuccessExpress = (res: Response, data: <T>(data: T) => T) => {
  return res.status(200).json({
    data,
    errors: null,
  });
};
