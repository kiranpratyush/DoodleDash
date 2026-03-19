import { useGameStore } from '../store/gameStore'

function getRankBadge(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}

export function Player() {
  const players = useGameStore((state) => state.players)

  return (
    <div className="h-full bg-gray-100 rounded-sm p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Players</h2>
      <div className="space-y-2">
        {players.map((player, index) => (
          <div
            key={player.id}
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
