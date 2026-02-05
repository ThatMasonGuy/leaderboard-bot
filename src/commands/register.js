import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("board-create")
    .setDescription("Create a living leaderboard message")
    .addStringOption(o =>
      o.setName("type")
        .setDescription("league_rank or hc_autopsy")
        .setRequired(true)
        .addChoices(
          { name: "league_rank", value: "league_rank" },
          { name: "hc_autopsy", value: "hc_autopsy" }
        )
    )
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("Channel to post the living message in")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("title")
        .setDescription("Custom title for the embed")
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName("sort")
        .setDescription("HC sort: playtime_desc | deaths_desc | avg_life_asc | avg_life_desc")
        .setRequired(false)
    )
    .addIntegerOption(o =>
      o.setName("refresh_minutes")
        .setDescription("Refresh interval in minutes (default 10)")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("board-delete")
    .setDescription("Delete a board config (optionally delete its message too)")
    .addStringOption(o => o.setName("boardid").setDescription("Board ID").setRequired(true))
    .addBooleanOption(o => o.setName("delete_message").setDescription("Delete the living message too (default true)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("board-add")
    .setDescription("Add a tracked player to a board (mainly for league_rank)")
    .addStringOption(o => o.setName("boardid").setDescription("Board ID").setRequired(true))
    .addStringOption(o => o.setName("player").setDescription("Summoner name (exact)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("board-remove")
    .setDescription("Remove a tracked player from a board")
    .addStringOption(o => o.setName("boardid").setDescription("Board ID").setRequired(true))
    .addStringOption(o => o.setName("player").setDescription("Summoner name (exact)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("board-refresh")
    .setDescription("Force refresh a board now")
    .addStringOption(o => o.setName("boardid").setDescription("Board ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("board-list")
    .setDescription("List boards")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

await rest.put(
  Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.DISCORD_GUILD_ID),
  { body: commands.map(c => c.toJSON()) }
);

console.log("✅ Slash commands registered.");