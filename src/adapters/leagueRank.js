import { EmbedBuilder } from "discord.js";

// Tier colors for embed theming
const TIER_COLORS = {
  CHALLENGER: 0xF4C430,
  GRANDMASTER: 0xC41E3A,
  MASTER: 0xA855F7,
  DIAMOND: 0x3B82F6,
  EMERALD: 0x10B981,
  PLATINUM: 0x06B6D4,
  GOLD: 0xFCD34D,
  SILVER: 0x9CA3AF,
  BRONZE: 0xCD7F32,
  IRON: 0x52525B,
  UNRANKED: 0x6B7280
};

// Tier emojis using Unicode symbols
const TIER_ICONS = {
  CHALLENGER: "🏆",
  GRANDMASTER: "💎",
  MASTER: "👑",
  DIAMOND: "💠",
  EMERALD: "💚",
  PLATINUM: "🔷",
  GOLD: "🥇",
  SILVER: "🥈",
  BRONZE: "🥉",
  IRON: "⚙️",
  UNRANKED: "❓"
};

// Rank icons
const RANK_NUMBERS = {
  I: "Ⅰ",
  II: "Ⅱ",
  III: "Ⅲ",
  IV: "Ⅳ",
  "": ""
};

function formatWinRate(wins, losses) {
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

function formatStreak(player) {
  if (player.win_streak >= 2) {
    return `🔥×${player.win_streak}`;
  }
  if (player.loss_streak >= 2) {
    return `❄️×${player.loss_streak}`;
  }
  return "";
}

function buildPlayerLine(rank, player) {
  const tier = TIER_ICONS[player.tier] || "⚪";
  const rankNum = RANK_NUMBERS[player.rank] || "";
  const tierText = player.tier === "UNRANKED" ? "" : ` ${player.tier} ${rankNum}`;
  const lpText = player.tier === "UNRANKED" ? "" : ` - **${player.league_points}** LP`;
  
  const winRate = formatWinRate(player.wins, player.losses);
  const record = `${player.wins}W / ${player.losses}L`;
  const streak = formatStreak(player);
  
  return `**#${rank}** ${tier} **${player.summoner_name}**${tierText}\n` +
         `${lpText} ${tier === "⚪" ? "" : "│"} ${record} - ${winRate} ${streak}`;
}

export async function buildLeagueRankEmbed({ board, env }) {
  try {
    // Fetch data
    const response = await fetch(env.LEAGUE_RANKS_URL || "https://lol.mxn.au/ranks");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Sort by tier/rank/LP
    const tierOrder = ["CHALLENGER", "GRANDMASTER", "MASTER", "DIAMOND", "EMERALD", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON", "UNRANKED"];
    const rankOrder = { "I": 1, "II": 2, "III": 3, "IV": 4, "": 5 };
    
    const sorted = [...data].sort((a, b) => {
      const tierDiff = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
      if (tierDiff !== 0) return tierDiff;
      
      const rankDiff = (rankOrder[a.rank] || 5) - (rankOrder[b.rank] || 5);
      if (rankDiff !== 0) return rankDiff;
      
      return b.league_points - a.league_points;
    });
    
    // Build embed
    const topPlayer = sorted[0];
    const embedColor = TIER_COLORS[topPlayer?.tier] || TIER_COLORS.UNRANKED;
    
    const embed = new EmbedBuilder()
      .setTitle("🏆 League of Legends Leaderboard")
      .setColor(embedColor)
      .setTimestamp()
      .setFooter({ text: `Active = last match < 1h • Updated` });
    
    // Add players (top 10)
    const displayPlayers = sorted.slice(0, 10);
    const description = displayPlayers
      .map((player, idx) => buildPlayerLine(idx + 1, player))
      .join("\n\n");
    
    embed.setDescription(description || "No players found");
    
    return embed;
    
  } catch (error) {
    console.error("Failed to build League embed:", error);
    return new EmbedBuilder()
      .setTitle("🏆 League of Legends Leaderboard")
      .setDescription("❌ Failed to fetch leaderboard data")
      .setColor(0xFF0000)
      .setTimestamp();
  }
}