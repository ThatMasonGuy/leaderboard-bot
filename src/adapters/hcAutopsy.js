import { EmbedBuilder } from "discord.js";
import fs from "fs/promises";
import path from "path";

function formatTime(ticks) {
  const seconds = Math.floor(ticks / 20);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDistance(cm) {
  const meters = Math.floor(cm / 100);
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

async function loadPlayerData(playerDir, usercachePath) {
  try {
    // Load usercache to map UUIDs to names
    const usercacheData = await fs.readFile(usercachePath, "utf-8");
    const usercache = JSON.parse(usercacheData);
    const uuidToName = Object.fromEntries(
      usercache.map(entry => [entry.uuid, entry.name])
    );
    
    // Load all player JSON files
    const files = await fs.readdir(playerDir);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    
    const players = [];
    for (const file of jsonFiles) {
      const uuid = path.basename(file, ".json");
      const filePath = path.join(playerDir, file);
      const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
      
      const stats = data.stats || {};
      const custom = stats["minecraft:custom"] || {};
      const deaths = custom["minecraft:deaths"] || 0;
      const totalTime = custom["minecraft:play_time"] || 0;
      const timeSinceDeath = custom["minecraft:time_since_death"] || 0;
      
      // Calculate average life
      const avgLife = deaths > 0 ? Math.floor(totalTime / deaths) : totalTime;
      
      players.push({
        uuid,
        name: uuidToName[uuid] || uuid.substring(0, 8),
        deaths,
        avgLife,
        totalTime,
        timeSinceDeath,
        kills: custom["minecraft:mob_kills"] || 0,
        distance: (custom["minecraft:walk_one_cm"] || 0) + 
                  (custom["minecraft:sprint_one_cm"] || 0) +
                  (custom["minecraft:fly_one_cm"] || 0)
      });
    }
    
    return players;
  } catch (error) {
    console.error("Failed to load player data:", error);
    return [];
  }
}

function buildPlayerLine(rank, player, sortBy) {
  const name = player.name;
  
  if (sortBy === "deaths") {
    return `**#${rank}** ☠️ **${name}**\n` +
           `💀 Deaths: **${player.deaths}** │ ⏱️ Avg Life: ${formatTime(player.avgLife)}`;
  }
  
  if (sortBy === "avgLife") {
    return `**#${rank}** ⏱️ **${name}**\n` +
           `⏳ Avg Life: **${formatTime(player.avgLife)}** │ 💀 Deaths: ${player.deaths}`;
  }
  
  // Default: survival (current life)
  return `**#${rank}** 💚 **${name}**\n` +
         `⏱️ Current: **${formatTime(player.timeSinceDeath)}** │ Avg: ${formatTime(player.avgLife)}`;
}

export async function buildHcAutopsyEmbed({ board, env }) {
  try {
    const playerDir = env.MC_PLAYER_DIR;
    const usercachePath = env.MC_USERCACHE;
    
    if (!playerDir || !usercachePath) {
      throw new Error("MC_PLAYER_DIR or MC_USERCACHE not configured");
    }
    
    const players = await loadPlayerData(playerDir, usercachePath);
    
    if (players.length === 0) {
      return new EmbedBuilder()
        .setTitle("⚔️ Hardcore Minecraft Leaderboard")
        .setDescription("No player data found")
        .setColor(0x6B7280)
        .setTimestamp();
    }
    
    // Determine sort mode from board config (default: avg life)
    const sortBy = board.sortBy || "avgLife";
    
    let sorted;
    let title;
    let embedColor;
    
    if (sortBy === "deaths") {
      // Most deaths (descending)
      sorted = [...players].sort((a, b) => b.deaths - a.deaths);
      title = "⚔️ Hardcore — Most Deaths";
      embedColor = 0xEF4444;
    } else if (sortBy === "avgLife") {
      // Longest average life
      sorted = [...players].sort((a, b) => b.avgLife - a.avgLife);
      title = "⚔️ Hardcore — Survivors (Avg Life)";
      embedColor = 0x10B981;
    } else {
      // Current survival time
      sorted = [...players].sort((a, b) => b.timeSinceDeath - a.timeSinceDeath);
      title = "⚔️ Hardcore — Current Survival";
      embedColor = 0x3B82F6;
    }
    
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(embedColor)
      .setTimestamp()
      .setFooter({ text: "Updated" });
    
    // Show top 10
    const displayPlayers = sorted.slice(0, 10);
    const description = displayPlayers
      .map((player, idx) => buildPlayerLine(idx + 1, player, sortBy))
      .join("\n\n");
    
    embed.setDescription(description || "No players found");
    
    return embed;
    
  } catch (error) {
    console.error("Failed to build Minecraft embed:", error);
    return new EmbedBuilder()
      .setTitle("⚔️ Hardcore Minecraft Leaderboard")
      .setDescription(`❌ Failed to fetch player data\n${error.message}`)
      .setColor(0xFF0000)
      .setTimestamp();
  }
}