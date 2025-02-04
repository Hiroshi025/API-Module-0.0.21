import { SlashCommandBuilder } from "discord.js";

/**
 * Clase que extiende `SlashCommandBuilder` de Discord.js para agregar funcionalidades adicionales,
 * como establecer un tiempo de cooldown personalizado para los comandos.
 */
export class CommandBuilder extends SlashCommandBuilder {
  /**
   * Tiempo de cooldown en segundos para el comando.
   * @type {number}
   */
  public cooldown: number;

  /**
   * Crea una nueva instancia de `CommandBuilder`.
   * Establece el cooldown predeterminado en 0 segundos y desactiva la etiqueta NSFW.
   */
  constructor() {
    super();
    this.setNSFW(false);
    this.cooldown = 0;
  }

  /**
   * Establece el tiempo de cooldown del comando en segundos.
   * Esto limita la frecuencia con la que los usuarios pueden ejecutar el comando.
   *
   * @param {number} seconds - El tiempo de cooldown en segundos.
   * @returns {CommandBuilder} La instancia actual de `CommandBuilder` para encadenamiento de métodos.
   */
  public setCooldown(seconds: number): CommandBuilder {
    this.cooldown = seconds;
    return this;
  }

  public setEmoji(emoji: string): CommandBuilder {
    // Agregar emoji a la descripción principal
    const newDescription = `${emoji} ${this.description || ""}`.trim();
    this.setDescription(newDescription);
  
    // Agregar emoji a las descripciones localizadas (si existen)
    const newDescriptionLocalizations = Object.fromEntries(
      Object.entries(this.description_localizations || {}).map(([key, value]) => [key, `${emoji} ${value}`])
    );
    this.setDescriptionLocalizations(newDescriptionLocalizations);
  
    return this;
  }
}
