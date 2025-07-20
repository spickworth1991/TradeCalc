import { NextResponse } from "next/server";
import path from "path";
import Database from "better-sqlite3";

// Path to your SQLite player database
const dbPath = path.resolve(process.cwd(), "src/data/app.db");

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const onlyBestBall = searchParams.get("only_bestball") === "1";
  const excludeBestBall = searchParams.get("exclude_bestball") === "1";

  if (!username) {
    return NextResponse.json({ error: "No username provided." }, { status: 400 });
  }

  try {
    // Load local player database
    const db = new Database(dbPath);
    const rows = db.prepare("SELECT id, name, position FROM sleeper_player").all();
    const playerMap = Object.fromEntries(rows.map((r) => [r.id, { name: r.name, pos: r.position }]));

    // Fetch Sleeper user info
    const userRes = await fetch(`https://api.sleeper.app/v1/user/${username}`);
    if (!userRes.ok) throw new Error("User not found");
    const user = await userRes.json();
    const userId = user.user_id;

    // Get current season leagues
    const year = new Date().getFullYear();
    const leaguesRes = await fetch(
      `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`
    );
    const leagues = await leaguesRes.json();

    const filteredLeagues = leagues.filter((league) => {
      if (league.status !== "in_season") return false;
      const isBestBall = league.settings?.best_ball === 1;
      if (onlyBestBall && !isBestBall) return false;
      if (excludeBestBall && isBestBall) return false;
      return true;
    });

    const playerCounts = {};
    const playerLeagues = {};

    for (const league of filteredLeagues) {
      const rosterRes = await fetch(
        `https://api.sleeper.app/v1/league/${league.league_id}/rosters`
      );
      const rosters = await rosterRes.json();

      const myRoster = rosters.find((r) => r.owner_id === userId);
      if (!myRoster?.players) continue;

      const starters = myRoster.starters || [];

      for (const pid of myRoster.players) {
        playerCounts[pid] = (playerCounts[pid] || 0) + 1;

        if (!playerLeagues[pid]) playerLeagues[pid] = [];
        playerLeagues[pid].push({
          id: league.league_id,
          name: league.name,
          isStarter: starters.includes(pid),
        });
      }
    }


    const players = Object.entries(playerCounts).map(([pid, count]) => {
      const leagues = playerLeagues[pid] || [];
      const isStarter = leagues.some((lg) => lg.isStarter);

      return {
        id: pid,
        name: playerMap[pid]?.name || "Unknown",
        pos: playerMap[pid]?.pos || "?",
        count,
        leagues,
        isStarter,
      };
    });


    players.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      username,
      leagueCount: filteredLeagues.length,
      players,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
