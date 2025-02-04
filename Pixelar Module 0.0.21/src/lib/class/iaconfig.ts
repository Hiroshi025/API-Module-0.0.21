import { IAConfig } from "@utils/functions";

export class IAController {
  static async Generate(prompt: string) {
    const response = await IAConfig(prompt);
    return { response };
  }
}
