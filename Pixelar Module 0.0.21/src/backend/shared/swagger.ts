import fs from "fs";
import swaggerJSDoc, { OAS3Options } from "swagger-jsdoc";
import yaml from "yaml";

import { config } from "@lib/utils/config";

const swaggerDocument = yaml.parse(fs.readFileSync(config.paths.swagger, "utf8"));

/**
 * Swagger options
 * @name swaggerOptions
 * @description Swagger options for swagger-jsdoc package to generate swagger documentation
 * @type {OAS3Options}
 */
const swaggerOptions: OAS3Options = {
  definition: swaggerDocument as OAS3Options["definition"],
  apis: [],
};

export default swaggerJSDoc(swaggerOptions);
