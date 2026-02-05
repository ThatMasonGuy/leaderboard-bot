import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { getBoards, upsertBoard, renderBoard } from "./boards.js";
import { handleInteraction } from "./commands/handlers.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const env = {
  LEAGUE_RANKS_URL: process.env.LEAGUE_RANKS_URL,
  MC_PLAYER_DIR: process.env.MC_PLAYER_DIR,
  MC_USERCACHE: process.env.MC_USERCACHE,
  forceRefresh: async (boardId) => {
    const boards = getBoards();
    const board = boards.find(b => b.boardId === boardId);
    if (!board) return;
    await refreshOne(board, true);
  }
};

async function refreshOne(board, forced = false) {
  const now = Date.now();
  const due = forced || (now - (board.lastRunAt || 0) >= (board.refreshEverySec || 600) * 1000);
  if (!due) return;

  try {
    const channel = await client.channels.fetch(board.channelId);
    const msg = await channel.messages.fetch(board.messageId);

    const embed = await renderBoard(board, env);
    await msg.edit({ embeds: [embed] });

    board.lastRunAt = now;
    upsertBoard(board);
  } catch (err) {
    console.error(`Board refresh failed (${board.boardId}):`, err);
    // still update lastRunAt so we don't hammer errors every tick
    board.lastRunAt = now;
    upsertBoard(board);
  }
}

client.on("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  setInterval(async () => {
    const boards = getBoards();
    for (const b of boards) {
      await refreshOne(b, false);
    }
  }, 30_000); // scheduler tick
});

client.on("interactionCreate", (interaction) => handleInteraction(interaction, env));

client.login(process.env.DISCORD_TOKEN);
