import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("board-create")
    .setDescription("Create a new leaderboard")
    .addStringOption(option =>
      option
        .setName("type")
        .setDescription("Type of leaderboard")
        .setRequired(true)
        .addChoices(
          { name: "League of Legends Rank", value: "league_rank" },
          { name: "Hardcore Minecraft", value: "hc_autopsy" }
        )
    )
    .addIntegerOption(option =>
      option
        .setName("refresh")
        .setDescription("Refresh interval in seconds (default: 60)")
        .setMinValue(10)
        .setMaxValue(3600)
    )
    .addStringOption(option =>
      option
        .setName("sort")
        .setDescription("Sort mode for Minecraft (default: avgLife)")
        .addChoices(
          { name: "Average Life", value: "avgLife" },
          { name: "Current Survival", value: "survival" },
          { name: "Most Deaths", value: "deaths" }
        )
    ),

  new SlashCommandBuilder()
    .setName("board-delete")
    .setDescription("Delete a leaderboard")
    .addStringOption(option =>
      option
        .setName("board_id")
        .setDescription("Board ID to delete")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("board-list")
    .setDescription("List all active leaderboards"),

  new SlashCommandBuilder()
    .setName("board-refresh")
    .setDescription("Force refresh a leaderboard")
    .addStringOption(option =>
      option
        .setName("board_id")
        .setDescription("Board ID to refresh")
        .setRequired(true)
    )
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");

    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands.map(c => c.toJSON()) }
    );

    console.log(`✅ Successfully registered ${data.length} commands globally`);
  } catch (error) {
    console.error("❌ Failed to register commands:", error);
  }
})();