import { loadBoards, saveBoards } from "./util/storage.js";
import { buildLeagueRankEmbed } from "./adapters/leagueRank.js";
import { buildHcAutopsyEmbed } from "./adapters/hcAutopsy.js";

export function getBoards() {
  return loadBoards();
}

export function upsertBoard(board) {
  const boards = loadBoards();
  const idx = boards.findIndex(b => b.boardId === board.boardId);
  if (idx >= 0) boards[idx] = { ...boards[idx], ...board };
  else boards.push(board);
  saveBoards(boards);
  return board;
}

export function deleteBoard(boardId) {
  const boards = loadBoards().filter(b => b.boardId !== boardId);
  saveBoards(boards);
}

export async function renderBoard(board, env) {
  if (board.type === "league_rank") return buildLeagueRankEmbed({ board, env });
  if (board.type === "hc_autopsy") return buildHcAutopsyEmbed({ board, env });
  throw new Error(`Unknown board type: ${board.type}`);
}