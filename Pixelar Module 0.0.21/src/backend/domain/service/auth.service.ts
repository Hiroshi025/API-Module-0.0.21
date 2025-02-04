import { v4 as uuidv4 } from "uuid";

import { manager } from "@/index";
import { encrypt, signToken, verified } from "@backend/shared/tokens";
import { AuthLogin, AuthRegister } from "@backend/validator/auth.validator";
import { User } from "@typings/api/express";

export const getAuth = async (id: string) => {
  const data = await manager.prisma.auth.findUnique({ where: { id } });
  if (!data) return "user_not_found";
  return data;
};

export const NewAuth = async (body: Partial<User>) => {
  const { email, password, name, discord } = body;
  if (!email || !password || !name || !discord) return "missing_data";
  const validate = AuthRegister.safeParse(body);
  if (!validate.success)
    return {
      errors: validate.error.errors,
      data: null,
    };

  const checkIs = await manager.prisma.auth.findUnique({ where: { email } });
  if (checkIs) return "user_already_exist";
  const customId = uuidv4();

  const passHash = await encrypt(password);
  if (!passHash) return "err_encrypt_password";
  const createAuth = await manager.prisma.auth.create({
    data: {
      email: email,
      password: passHash,
      name: name,
      id: customId,
      discord: discord,
    },
  });

  return createAuth;
};

export const LoginAuth = async ({ email, password }: Partial<User>) => {
  if (!email || !password) return "missing_data";
  const validate = AuthLogin.safeParse({ email, password });
  if (!validate.success)
    return {
      errors: validate.error.errors,
      data: null,
    };

  const checkIs = await manager.prisma.auth.findUnique({ where: { email } });
  if (!checkIs) return "date_incorrect";

  const passwordHash = checkIs.password;
  const isCorrect = await verified(password, passwordHash);

  if (!isCorrect) return "password_incorrect";
  const token = signToken(checkIs.email);
  const data = { token, user: checkIs };
  return data;
};
