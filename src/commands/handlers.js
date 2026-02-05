import { upsertBoard, deleteBoard, getBoards } from "../boards.js";
import { v4 as uuidv4 } from "uuid";

export async function handleInteraction(interaction, env) {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "board-create") {
      await handleBoardCreate(interaction, env);
    } else if (interaction.commandName === "board-delete") {
      await handleBoardDelete(interaction);
    } else if (interaction.commandName === "board-list") {
      await handleBoardList(interaction);
    } else if (interaction.commandName === "board-refresh") {
      await handleBoardRefresh(interaction, env);
    }
  } catch (error) {
    console.error("Command error:", error);
    const reply = { content: `❌ Error: ${error.message}`, ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

async function handleBoardCreate(interaction, env) {
  const type = interaction.options.getString("type");
  const refreshSec = interaction.options.getInteger("refresh") || 60;
  const sortBy = interaction.options.getString("sort") || "avgLife";

  await interaction.deferReply();

  const boardId = uuidv4();
  const board = {
    boardId,
    type,
    channelId: interaction.channelId,
    refreshEverySec: refreshSec,
    sortBy: type === "hc_autopsy" ? sortBy : undefined,
    lastRunAt: 0
  };

  // Import renderBoard dynamically to avoid circular dependency
  const { renderBoard } = await import("../boards.js");
  const embed = await renderBoard(board, env);
  const message = await interaction.channel.send({ embeds: [embed] });

  board.messageId = message.id;
  upsertBoard(board);

  await interaction.editReply({
    content: `✅ Board created! Refreshing every ${refreshSec}s`,
    ephemeral: true
  });
}

async function handleBoardDelete(interaction) {
  const boardId = interaction.options.getString("board_id");
  const boards = getBoards();
  const board = boards.find(b => b.boardId === boardId);

  if (!board) {
    await interaction.reply({ content: "❌ Board not found", ephemeral: true });
    return;
  }

  deleteBoard(boardId);

  try {
    const channel = await interaction.client.channels.fetch(board.channelId);
    const message = await channel.messages.fetch(board.messageId);
    await message.delete();
  } catch (error) {
    console.error("Failed to delete message:", error);
  }

  await interaction.reply({ content: "✅ Board deleted", ephemeral: true });
}

async function handleBoardList(interaction) {
  const boards = getBoards();

  if (boards.length === 0) {
    await interaction.reply({ content: "No boards configured", ephemeral: true });
    return;
  }

  const list = boards
    .map(b => `• **${b.type}** (${b.boardId}) - <#${b.channelId}> - Refresh: ${b.refreshEverySec}s`)
    .join("\n");

  await interaction.reply({ content: `**Active Boards:**\n${list}`, ephemeral: true });
}

async function handleBoardRefresh(interaction, env) {
  const boardId = interaction.options.getString("board_id");

  await interaction.deferReply({ ephemeral: true });

  await env.forceRefresh(boardId);

  await interaction.editReply({ content: "✅ Board refreshed" });
}