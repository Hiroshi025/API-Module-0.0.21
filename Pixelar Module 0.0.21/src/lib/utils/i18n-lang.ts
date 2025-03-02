import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    preload: ["en", "es"], // Carga solo idiomas permitidos
    backend: {
      loadPath: path.join(__dirname, "../locales/{{lng}}/{{ns}}.json"), // Soporta namespaces
    },
    detection: {
      order: ["querystring", "cookie", "header"],
      caches: ["cookie"],
    },
    ns: ["common", "api", "modules"], // Nombres de los archivos (namespaces)
    defaultNS: "common", // Namespace por defecto
  });

export default i18next;
export const i18nMiddleware = middleware.handle(i18next);
