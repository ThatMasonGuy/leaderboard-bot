import fs from "fs";
import path from "path";

const BOARDS_FILE = path.join(process.cwd(), "boards.json");

export function loadBoards() {
  try {
    if (!fs.existsSync(BOARDS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BOARDS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load boards:", error);
    return [];
  }
}

export function saveBoards(boards) {
  try {
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save boards:", error);
  }
}