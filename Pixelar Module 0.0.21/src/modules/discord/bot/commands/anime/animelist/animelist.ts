import { ChannelType } from "discord.js";

import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Animelist } from "@modules/animelist/command/animelist";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("animelist")
    .setNameLocalizations({
      "es-ES": "animelist",
    })
    .setDescription("🐲 Get information about the bot the anime plugin")
    .setDescriptionLocalizations({
      "es-ES": "🐲 Obtén información sobre el bot y el plugin de anime",
    })
    .addSubcommandGroup((group) =>
      group
        .setName("config")
        .setNameLocalizations({
          "es-ES": "configuración",
        })
        .setDescription("🐲 Configure the bot's anime plugin")
        .setDescriptionLocalizations({
          "es-ES": "🐲 Configura el plugin de anime del bot",
        })
        .addSubcommand((subcommand) =>
          subcommand
            .setName("edit")
            .setNameLocalizations({
              "es-ES": "editar",
            })
            .setDescription("🐲 edit animelist posts within the server")
            .setDescriptionLocalizations({
              "es-ES": "🐲 edita las publicaciones de animelist dentro el servidor",
            })
            .addStringOption((option) =>
              option
                .setName("anime")
                .setDescription("🐲 anime to edit")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 anime a editar",
                })
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("🐲 channel to edit")
                .addChannelTypes(ChannelType.GuildText)
                .setDescriptionLocalizations({
                  "es-ES": "🐲 canal a editar",
                })
            )
            .addRoleOption((option) =>
              option
                .setName("mention_role")
                .setDescription("🐲 role to mention")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 rol a mencionar",
                })
            )
            .addRoleOption((option) =>
              option
                .setName("remove_mention")
                .setDescription("🐲 remove mention role")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 eliminar rol a mencionar",
                })
            )
            .addBooleanOption((option) =>
              option
                .setName("create_threads")
                .setDescription("🐲 create threads")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 crear hilos",
                })
            )
            .addIntegerOption((option) =>
              option
                .setName("thread_archive")
                .setDescription("🐲 thread archive time")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 tiempo de archivo del hilo",
                })
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("unwatch")
            .setNameLocalizations({
              "es-ES": "dejar-de-ver",
            })
            .setDescription("🐲 Stop watching an anime")
            .setDescriptionLocalizations({
              "es-ES": "🐲 Deja de ver un anime",
            })
            .addStringOption((option) =>
              option
                .setName("anime")
                .setDescription("🐲 The anime you want to stop watching")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El anime que quieres dejar de ver",
                })
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("🐲 The channel where you want to stop receiving announcements")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El canal donde quieres dejar de recibir anuncios",
                })
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("upcoming")
            .setNameLocalizations({
              "es-ES": "proximos",
            })
            .setDescription("🐲 Get the upcoming episode in the channel")
            .setDescriptionLocalizations({
              "es-ES": "🐲 Obtener el próximo episodio en el canal",
            })
            .addIntegerOption((option) =>
              option
                .setName("days")
                .setDescription("🐲 The number of days to look ahead")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El número de días a mirar hacia adelante",
                })
                .setRequired(false)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("watch")
            .setNameLocalizations({
              "es-ES": "ver",
            })
            .setDescription("🐲 Watch an anime episode")
            .setDescriptionLocalizations({
              "es-ES": "🐲 Ver un episodio de anime",
            })
            .addStringOption((option) =>
              option
                .setName("anime")
                .setDescription("🐲 The anime you want to watch")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El anime que quieres ver",
                })
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("🐲 The channel to watch the anime in")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El canal donde ver el anime",
                })
            )
            .addRoleOption((option) =>
              option
                .setName("mention_role")
                .setDescription("🐲 The role to mention when the anime is released")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El rol a mencionar cuando se lance el anime",
                })
            )
            .addBooleanOption((option) =>
              option
                .setName("create_threads")
                .setDescription("🐲 Create threads for each announcement")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 Crear hilos para cada anuncio",
                })
            )
            .addIntegerOption((option) =>
              option
                .setName("thread_archive")
                .setDescription("🐲 The time to archive the threads")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El tiempo para archivar los hilos",
                })
            )
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("info")
        .setNameLocalizations({
          "es-ES": "información",
        })
        .setDescription("🐲 Get information about the bot and the plugin")
        .setDescriptionLocalizations({
          "es-ES": "🐲 Obtén información sobre el bot y el plugin",
        })
        .addSubcommand((subcommand) =>
          subcommand
            .setName("about")
            .setNameLocalizations({
              "es-ES": "sobre",
            })
            .setDescription("🐲 Get information about the bot the anime plugin")
            .setDescriptionLocalizations({
              "es-ES": "🐲 Obtén información sobre el bot y el plugin de anime",
            })
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("tools")
        .setNameLocalizations({
          "es-ES": "herramientas",
        })
        .setDescription("🐲 Tools for managing your anime list")
        .setDescriptionLocalizations({
          "es-ES": "🐲 Herramientas para gestionar tu lista de anime",
        })
        .addSubcommand((subcommand) =>
          subcommand
            .setName("titleformat")
            .setNameLocalizations({
              "es-ES": "formatotitulo",
            })
            .setDescription("🐲 Get information about the title format used in the plugin")
            .setDescriptionLocalizations({
              "es-ES": "🐲 Obtén información sobre el formato de título usado en el plugin",
            })
            .addStringOption((option) =>
              option
                .setName("format")
                .setDescription("🐲 The format you want to use for the titles")
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El formato que quieres usar para los títulos",
                })
                .setRequired(true)
                .addChoices(
                  { name: "English", value: "english" },
                  { name: "Romaji", value: "romaji" },
                  { name: "Native", value: "native" },
                  { name: "User Preferred", value: "userPreferred" }
                )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("watching")
            .setNameLocalizations({
              "es-ES": "viendo",
            })
            .setDescription("🐲 Get the currently airing and upcoming episodes in the channel")
            .setDescriptionLocalizations({
              "es-ES": "🐲 Obtener los episodios actualmente en el aire y próximos en el canal",
            })
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("🐲 The channel to get the announcements from")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setDescriptionLocalizations({
                  "es-ES": "🐲 El canal para obtener los anuncios",
                })
                .setRequired(false)
            )
        )
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel) return;
    await Animelist(interaction, client);
  }
);
