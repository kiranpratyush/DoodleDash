interface Player {
  name: string;
  score: number;
  avatar?: string;
}

const PLAYERS: Player[] = [
  { name: 'Alex', score: 150 },
  { name: 'Jordan', score: 120 },
  { name: 'Sam', score: 100 },
  { name: 'Taylor', score: 85 },
  { name: 'Morgan', score: 70 },
];

function getRankBadge(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}

export function Player() {
  return (
    <div className="h-full bg-gray-100 rounded-sm p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Players</h2>
      <div className="space-y-2">
        {PLAYERS.map((player, index) => (
          <div
            key={player.name}
            className="flex items-center justify-between bg-white p-3 rounded-sm shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg w-8 text-center">
                {getRankBadge(index + 1)}
              </span>
              <span className="font-medium text-gray-800">{player.name}</span>
            </div>
            <span className="text-gray-600 font-semibold">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
