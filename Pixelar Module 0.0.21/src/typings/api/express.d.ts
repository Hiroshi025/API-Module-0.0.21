export interface TRoutesInput {
  app: Application;
}

export interface User {
  id: string;
  email: string;
  name: string;
  discord: string;
  password: string;
  rol: string;
  createdAt: Date;
}

export interface RequestExtended extends Request {
  lng: string;
}

export interface OderCreateNotify {
  link: string
}

export interface WhatsappData {
  response: string;
  message: string;
  userId: string;
  username: string;
}

export interface CryptoData {
  enabled: boolean;
  token: string;
  coinId: string;
  preferred: string;
  symbol: string;
  separator: string;
}

export interface ProductData {
  name: string;
  description: string;
  image: string;
  url: string;
  userId: string;
}

export interface OrderData {
  name: string;
  image: string;
  price: number;
  type: string;
  payment: string;
  info: string;
  status: string;
  userId: string;
}