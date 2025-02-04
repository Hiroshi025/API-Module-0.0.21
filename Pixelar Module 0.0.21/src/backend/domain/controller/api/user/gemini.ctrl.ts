import { Request, Response } from "express";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorExpress } from "@backend/shared/handlers";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiCtrl {
  static Generate = async (req: Request, res: Response) => {
    const configuration = new GoogleGenerativeAI(process.env.API_KEY as string).getGenerativeModel({
      model: process.env.MODEL as string,
      systemInstruction: process.env.CONFIGSYSTEM,
    });
    const conversationContext: any[][] = [];
    const currentMessages = [];
    try {
      const { prompt } = req.body;

      for (const [inputText, responseText] of conversationContext) {
        currentMessages.push({ role: "user", parts: inputText });
        currentMessages.push({ role: "model", parts: responseText });
      }

      const chat = configuration.startChat({
        history: currentMessages,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.1,
        },
        tools: [
          {
            codeExecution: {},
          },
        ],
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Stores the conversation
      conversationContext.push([prompt, responseText]);
      res.send({ response: responseText });
    } catch (err) {
      console.error(err);
      await ErrorExpress(res, 500, req.t("api:controllers.gemini.generate.500.error"));
    }
  };
  static Info = async (req: Request, res: Response) => {
    try {
      return res.status(200).json({
        errors: null,
        data: {
          model: process.env.MODEL,
          systemInstruction: process.env.CONFIGSYSTEM,
          url: "https://ai.google.dev/gemini-api/docs",
        },
      });
    } catch (err) {
      console.error(err);
      await ErrorExpress(res, 500, req.t("api:controllers.gemini.info.500.error"));
    }
  };
}
