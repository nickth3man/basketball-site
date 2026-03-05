import { getCachedQueryMany } from '@/lib/db';

export interface PlayerBirthday {
  bref_id: string;
  full_name: string;
  birth_date: string;
  birth_month: number;
  birth_day: number;
}

export interface CollegeInfo {
  college: string;
  player_count: number;
  players: string;
}

export function getPlayersByBirthday(month: number, day: number): PlayerBirthday[] {
  return getCachedQueryMany<PlayerBirthday[]>(
    `SELECT 
      bref_id,
      full_name,
      birth_date,
      CAST(strftime('%m', birth_date) AS INTEGER) as birth_month,
      CAST(strftime('%d', birth_date) AS INTEGER) as birth_day
    FROM dim_player
    WHERE strftime('%m', birth_date) = ?
      AND strftime('%d', birth_date) = ?
      AND birth_date IS NOT NULL
    ORDER BY full_name`,
    [month.toString().padStart(2, '0'), day.toString().padStart(2, '0')],
    60_000
  );
}

export function getAllBirthdaysGrouped(): Array<{
  month: number;
  day: number;
  players: PlayerBirthday[];
}> {
  const rows = getCachedQueryMany<PlayerBirthday[]>(
    `SELECT 
      bref_id,
      full_name,
      birth_date,
      CAST(strftime('%m', birth_date) AS INTEGER) as birth_month,
      CAST(strftime('%d', birth_date) AS INTEGER) as birth_day
    FROM dim_player
    WHERE birth_date IS NOT NULL
    ORDER BY birth_month, birth_day, full_name`,
    [],
    300_000
  );

  // Group by month/day
  const grouped = new Map<string, PlayerBirthday[]>();
  for (const player of rows) {
    const month = player['birth_month'];
    const day = player['birth_day'];
    if (month === undefined || day === undefined) continue;
    const key = `${month}-${day}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(player);
  }

  return Array.from(grouped.entries())
    .map(([key, players]) => {
      const parts = key.split('-');
      const month = parseInt(parts[0] ?? '1', 10);
      const day = parseInt(parts[1] ?? '1', 10);
      return { month, day, players };
    })
    .sort((a, b) => a.month - b.month || a.day - b.day);
}

export function getPlayersByCollege(): CollegeInfo[] {
  return getCachedQueryMany<CollegeInfo[]>(
    `SELECT 
      college,
      COUNT(*) as player_count,
      GROUP_CONCAT(bref_id) as players
    FROM dim_player
    WHERE college IS NOT NULL 
      AND college != ''
      AND college != 'None'
    GROUP BY college
    ORDER BY player_count DESC, college`,
    [],
    300_000
  );
}

export function getTodayBirthdays(): PlayerBirthday[] {
  const today = new Date();
  return getPlayersByBirthday(today.getMonth() + 1, today.getDate());
}
