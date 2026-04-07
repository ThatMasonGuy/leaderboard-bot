# leaderboard-bot

A Discord bot that posts and maintains **living leaderboard messages** in your server.

It currently supports:

- **League of Legends rank leaderboard** (from a JSON API endpoint)
- **Hardcore Minecraft leaderboard** (from world player stats + `usercache.json`)

The bot creates a message embed for each board and keeps it updated on a schedule.

---

## Features

- Slash-command driven workflow (`/board-create`, `/board-list`, `/board-refresh`, `/board-delete`)
- Multiple active boards at the same time
- Persistent board config stored in `boards.json`
- Automatic periodic refresh loop (scheduler tick every 30 seconds)
- Manual on-demand refresh for any board ID

---

## Requirements

- Node.js 18+ (recommended)
- A Discord application + bot token
- Discord server where the bot is installed
- Permissions for the bot to:
  - Read/send messages
  - Manage messages (for editing/deleting leaderboard posts)
  - Use application commands

---

## Installation

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root.

3. Register slash commands:

   ```bash
   npm run deploy
   ```

4. Start the bot:

   ```bash
   npm start
   ```

---

## Environment variables

Create `.env` with the following values:

```dotenv
# Required for bot login + slash command registration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_id

# League adapter
LEAGUE_RANKS_URL=https://lol.mxn.au/ranks

# Minecraft adapter (required only for hc_autopsy boards)
MC_PLAYER_DIR=/path/to/world/stats
MC_USERCACHE=/path/to/server/usercache.json
```

### Notes

- `DISCORD_CLIENT_ID` must be your application (bot) client ID.
- `LEAGUE_RANKS_URL` should return a JSON array of player rank objects.
- `MC_PLAYER_DIR` should point at the folder that contains per-player UUID JSON files.
- `MC_USERCACHE` should point at Minecraft's `usercache.json` used for UUID → name mapping.

---

## Slash commands

### `/board-create`
Create a new leaderboard message.

Options:
- `type` (required): `league_rank` or `hc_autopsy`
- `refresh` (optional): refresh interval in seconds (default `60`)
- `sort` (optional, HC only): `avgLife`, `survival`, or `deaths`

### `/board-list`
List all active board configurations.

### `/board-refresh`
Force refresh a board by ID.

Option:
- `board_id` (required)

### `/board-delete`
Delete a board and remove its leaderboard message.

Option:
- `board_id` (required)

---

## Data storage

The bot stores board configuration in:

- `boards.json` (created in the repo root at runtime)

Each board record includes metadata such as:
- board ID
- board type
- channel ID
- message ID
- refresh interval
- last refresh timestamp

---

## How refresh works

- The bot checks all boards every **30 seconds**.
- A board is refreshed only when it is due based on its configured interval.
- Failed refreshes are logged, and the board timestamp is still updated to avoid hammering a failing source repeatedly.

---

## Project structure

```text
src/
  index.js                 # bot startup + scheduler + interaction hook
  boards.js                # board registry + adapter dispatch
  adapters/
    leagueRank.js          # League embed builder
    hcAutopsy.js           # Hardcore Minecraft embed builder
  commands/
    deploy.js              # slash command registration script
    handlers.js            # runtime slash command handling
  util/
    storage.js             # boards.json load/save helpers
    format.js              # shared formatting helpers
```

---

## Troubleshooting

- **Commands do not appear in Discord**
  - Re-run `npm run deploy`.
  - Ensure the bot has been invited with the `applications.commands` scope.

- **Bot logs in but boards do not update**
  - Verify channel/message permissions (send/edit/delete).
  - Check that board IDs in `/board-refresh` or `/board-delete` match `/board-list` output.

- **Minecraft board shows no players**
  - Confirm `MC_PLAYER_DIR` and `MC_USERCACHE` paths are valid and readable.

- **League board fetch errors**
  - Confirm `LEAGUE_RANKS_URL` is reachable and returns expected JSON.

---

## Development notes

- Main runtime entry point: `src/index.js`
- Command registration script used by `npm run deploy`: `src/commands/deploy.js`
- There is also `src/commands/register.js` in the repo, but it is not wired to `package.json` scripts.
