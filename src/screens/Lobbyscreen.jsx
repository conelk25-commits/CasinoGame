import React, { useState, useEffect } from 'react';

const GAMES = [
  {
    id: 'slots',
    name: 'Slots',
    icon: '🎰',
    description: 'Classic slot machine action',
    minBet: 1,
    maxWin: '5000x',
    players: 0
  },
  {
    id: 'roulette',
    name: 'Roulette',
    icon: '🎡',
    description: 'Spin the wheel of fortune',
    minBet: 5,
    maxWin: '36x',
    players: 0
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    icon: '🂡',
    description: 'Beat the dealer',
    minBet: 1,
    maxWin: '3x',
    players: 0
  },
  {
    id: 'dice',
    name: 'Dice',
    icon: '🎲',
    description: 'Roll and win',
    minBet: 1,
    maxWin: '10x',
    players: 0
  },
  {
    id: 'poker',
    name: 'Poker',
    icon: '♠️',
    description: 'Play against other players',
    minBet: 10,
    maxWin: 'Unlimited',
    players: 0
  }
];

function LobbyScreen({ user, playerData, onLogout, onSelectGame, onRefreshCoins, onlinePlayers }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const canAffordLowestGame = playerData?.coins >= 1;

  const handleGameSelect = (gameId) => {
    if (!canAffordLowestGame) {
      if (confirm('You are out of coins! Claim 100 coins to continue playing?')) {
        onRefreshCoins();
      }
      return;
    }
    onSelectGame(gameId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-neon/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-purple-neon">
              CASINO ROYALE
            </h1>
            <p className="text-slate-400 text-sm">Welcome back, {playerData?.username || 'Player'}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Player Stats */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gold flex items-center gap-2">
                💰 {playerData?.coins || 0}
              </div>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Balance</p>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-all duration-300 text-sm font-semibold border border-slate-700 hover:border-red-500/50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-12">
        {/* Alert if out of coins */}
        {playerData?.coins <= 0 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/50 rounded-xl text-center backdrop-blur-sm">
            <p className="text-orange-300 font-semibold mb-4">You've run out of coins!</p>
            <button
              onClick={onRefreshCoins}
              className="px-6 py-3 bg-gradient-to-r from-gold to-orange-500 text-slate-950 font-bold rounded-lg hover:shadow-lg hover:shadow-gold/50 transition-all uppercase"
            >
              Claim 100 Coins to Keep Playing
            </button>
          </div>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Total Played</p>
            <p className="text-2xl font-bold text-gold">{playerData?.total_played || 0}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Total Won</p>
            <p className="text-2xl font-bold text-purple-neon">{playerData?.total_won || 0}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Online Players</p>
            <p className="text-2xl font-bold text-green-400">{onlinePlayers.length}</p>
          </div>
        </div>

        {/* Games Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider">Select a Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                disabled={playerData?.coins <= 0}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 p-6 h-full flex flex-col items-center justify-center text-center ${
                  playerData?.coins <= 0
                    ? 'opacity-50 cursor-not-allowed bg-slate-800/30 border-slate-700/30'
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/20 hover:scale-105'
                }`}
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {game.icon}
                </div>
                <h3 className="text-lg font-bold text-gold mb-2">{game.name}</h3>
                <p className="text-slate-400 text-xs mb-4">{game.description}</p>
                <div className="text-slate-500 text-xs space-y-1">
                  <p>Min: {game.minBet}</p>
                  <p>Max: {game.maxWin}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Online Players */}
        {onlinePlayers.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gold mb-4 uppercase tracking-wider">Players Online</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {onlinePlayers.slice(0, 12).map((player, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="text-green-400 text-xs font-semibold mb-1">🟢 Online</div>
                  <p className="text-slate-300 text-sm truncate">{player.players?.username || 'Player'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LobbyScreen;
