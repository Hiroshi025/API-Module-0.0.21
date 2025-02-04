/* eslint-disable @typescript-eslint/no-unused-vars */
import exceljs from "exceljs";
import moment from "moment";

import { ValidationError } from "@lib/extenders/error.extend";
import { logWithLabel } from "@lib/utils/log";

export async function historial(number: string, author: string, message: string) {
  const path_chats = `./config/whatsapp/chats/${author}.xlsx`;
  const today = moment().format("DD-MM-YYYY hh:mm:ss");
  const workbook = new exceljs.Workbook();

  try {
    let worksheet;

    // Intentar cargar el archivo existente
    try {
      await workbook.xlsx.readFile(path_chats);
      worksheet = workbook.getWorksheet("Chats");
      if (!worksheet) throw new ValidationError("Worksheet not found");

      // Validar si el archivo tiene columnas definidas
      if (!worksheet.columns || worksheet.columns.length === 0) {
        worksheet.columns = [
          { header: "Número", key: "number", width: 30 },
          { header: "Author", key: "author", width: 40 },
          { header: "Message", key: "message", width: 500 },
          { header: "Date", key: "date", width: 30 },
        ];
      }
    } catch (err) {
      // Si no existe el archivo, crear uno nuevo
      worksheet = workbook.addWorksheet("Chats");
      worksheet.columns = [
        { header: "Número", key: "number", width: 30 },
        { header: "Author", key: "author", width: 40 },
        { header: "Message", key: "message", width: 500 },
        { header: "Date", key: "date", width: 30 },
      ];

      logWithLabel("custom", `Creating new history in ${path_chats}`, "WhatsApp");
    }

    // Agregar nueva fila con los datos del mensaje
    worksheet.addRow({ number, author, message, date: today });

    // Guardar el archivo actualizado
    await workbook.xlsx.writeFile(path_chats);
    logWithLabel("custom", `History updated in ${path_chats}`, "WhatsApp");
  } catch (error) {
    logWithLabel("custom", `Error updating history: ${error}`, "WhatsApp");
    throw error;
  }
}
