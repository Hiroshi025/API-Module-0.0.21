import fs from "fs";
import path from "path";
import yaml from "yaml";

// Ruta correcta al archivo config.yml
const configDir = path.resolve(__dirname, "config"); // Ajusta la ruta a "config"
const filePath = path.join(configDir, "config.yml");

console.log("Leyendo el archivo de configuración desde:", filePath); // Debugging

const fileContents = fs.readFileSync(filePath, "utf8");
const config = yaml.parse(fileContents);

// Mock de la configuración
jest.mock("src/utils/config", () => ({
  config,
}));