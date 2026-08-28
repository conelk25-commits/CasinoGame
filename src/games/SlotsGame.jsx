import React, { useState, useEffect } from 'react';

function SlotsGame({ playerData, onExit, supabase, user }) {
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0]);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [coins, setCoins] = useState(playerData?.coins || 0);

  const SYMBOLS = ['🍒', '🍊', '🍋', '🍌', '💰', '💎'];
  const PAYOUTS = {
    '🍒🍒🍒': 2,
    '🍊🍊🍊': 3,
    '🍋🍋🍋': 4,
    '🍌🍌🍌': 5,
    '💰💰💰': 10,
    '💎💎💎': 50
  };

  const spin = async () => {
    if (spinning || coins < bet) {
      setMessage('Insufficient coins!');
      return;
    }

    setSpinning(true);
    setMessage('');

    // Animate spinning
    for (let i = 0; i < 20; i++) {
      setReels([
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length)
      ]);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final result
    const result = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length)
    ];
    setReels(result);

    const symbols = result.map(i => SYMBOLS[i]).join('');
    const payout = PAYOUTS[symbols] || 0;
    const winAmount = payout > 0 ? bet * payout : 0;
    const newCoins = coins - bet + winAmount;

    setCoins(newCoins);

    // Update database
    await supabase
      .from('players')
      .update({
        coins: newCoins,
        total_played: (playerData?.total_played || 0) + bet,
        total_won: (playerData?.total_won || 0) + winAmount
      })
      .eq('user_id', user.id);

    // Save to history
    const historyEntry = {
      result: symbols,
      payout: payout,
      win: winAmount,
      timestamp: new Date().toLocaleTimeString()
    };
    setHistory([historyEntry, ...history.slice(0, 4)]);

    if (payout > 0) {
      setMessage(`🎉 Won ${winAmount} coins! ${payout}x multiplier!`);
    } else {
      setMessage('No match. Try again!');
    }

    setSpinning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 backdrop-blur-xl bg-slate-900/50 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gold">🎰 SLOTS</h1>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-slate-400 text-xs uppercase">Balance</p>
              <p className="text-2xl font-bold text-gold">{coins}</p>
            </div>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>

      {/* Game */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 text-center">
          {/* Slot Machine */}
          <div className="mb-8 p-6 bg-slate-900/80 rounded-lg border-2 border-gold/30">
            <div className="flex justify-center gap-4 mb-6">
              {reels.map((reel, idx) => (
                <div
                  key={idx}
                  className={`w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-gold rounded-lg flex items-center justify-center text-5xl ${
                    spinning ? 'animate-bounce' : ''
                  }`}
                >
                  {SYMBOLS[reel]}
                </div>
              ))}
            </div>

            {message && (
              <div className={`text-lg font-bold mb-4 ${
                message.includes('Won') ? 'text-green-400' : message.includes('No match') ? 'text-orange-400' : 'text-red-400'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 mb-2 block text-sm font-semibold">Bet Amount</label>
              <input
                type="range"
                min="1"
                max={Math.min(100, coins)}
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                disabled={spinning}
                className="w-full"
              />
              <div className="text-slate-400 text-sm mt-2">Current Bet: {bet} coins</div>
            </div>

            <button
              onClick={spin}
              disabled={spinning || coins < bet}
              className="w-full py-4 bg-gradient-to-r from-gold to-purple-neon text-slate-950 font-bold text-lg rounded-lg hover:shadow-xl hover:shadow-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {spinning ? 'Spinning...' : 'SPIN'}
            </button>
          </div>

          {/* Payouts */}
          <div className="mt-8 text-left">
            <h3 className="text-gold font-bold mb-3">Payouts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              {Object.entries(PAYOUTS).map(([symbols, payout]) => (
                <div key={symbols} className="flex justify-between bg-slate-900/50 p-2 rounded">
                  <span>{symbols}</span>
                  <span className="text-gold">{payout}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-gold font-bold mb-4">Recent Spins</h3>
            <div className="space-y-2">
              {history.map((entry, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-slate-900/50 p-3 rounded">
                  <span>{entry.result}</span>
                  <span className={entry.win > 0 ? 'text-green-400 font-bold' : 'text-slate-400'}>
                    {entry.win > 0 ? `+${entry.win}` : `-${bet}`}
                  </span>
                  <span className="text-slate-500 text-xs">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SlotsGame;
