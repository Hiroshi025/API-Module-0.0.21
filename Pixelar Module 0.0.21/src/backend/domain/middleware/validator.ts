/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

export const validateString = (options: {
  required?: boolean;
  minlength?: number;
  email?: boolean;
  maxlength?: number;
}) => {
  return (value: string) => {
    if (options.required && !value) {
      return { valid: false, message: "Field is required" };
    }
    if (options.minlength && value.length < options.minlength) {
      return { valid: false, message: `Minimum length is ${options.minlength}` };
    }
    if (options.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { valid: false, message: "Invalid email format" };
    }

    if (options.maxlength && value.length > options.maxlength) {
      return { valid: false, message: `Maximum length is ${options.maxlength}` };
    }

    return { valid: true };
  };
};

type ValidatorFunction = (value: any) => { valid: boolean; message?: string };
export const validateObject = (schema: { [key: string]: ValidatorFunction }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = [];
    for (const [key, validate] of Object.entries(schema)) {
      const value = req.body[key];
      const result = validate(value);
      if (!result.valid) {
        errors.push({ field: key, message: result.message });
      }
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    next();
  };
};
