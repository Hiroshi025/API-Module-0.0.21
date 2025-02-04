import { z } from "zod";

export const WhatsappValidator = z.object({
  response: z.string(),
  message: z.string(),
  userId: z.string(),
  username: z.string(),
})

export const CryptoValidator = z.object({
  enabled: z.boolean(),
  token: z.string(),
  coinId: z.string(),
  preferred: z.string(),
  symbol: z.string(),
  separator: z.string(),
});

export const CreateProductValidator = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().url(),
  url: z.string().url(),
  userId: z.string(),
});

export const OrderValidator = z.object({
  name: z.string(),
  image: z.string().url(),
  price: z.number(),
  type: z.string(),
  payment: z.string(),
  info: z.string(),
  status: z.string(),
  userId: z.string(),
});

export type WhatsappValidatorType = z.infer<typeof WhatsappValidator>;