import React, { useState, useEffect } from 'react';

function RouletteGame({ playerData, onExit, supabase, user }) {
  const [bet, setBet] = useState(10);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [lastNumber, setLastNumber] = useState(null);
  const [message, setMessage] = useState('');
  const [coins, setCoins] = useState(playerData?.coins || 0);
  const [history, setHistory] = useState([]);
  const [rotation, setRotation] = useState(0);

  const NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36

  const spin = async () => {
    if (spinning || coins < bet || selectedNumber === null) {
      setMessage('Select a number and ensure you have enough coins!');
      return;
    }

    setSpinning(true);
    setMessage('');

    // Spin animation
    let currentRotation = rotation;
    for (let i = 0; i < 30; i++) {
      currentRotation += Math.random() * 30;
      setRotation(currentRotation);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Result
    const winNumber = Math.floor(Math.random() * 37);
    const finalRotation = (winNumber * (360 / 37)) + 360 * 5;
    setRotation(finalRotation);
    setLastNumber(winNumber);

    const isWin = winNumber === selectedNumber;
    const winAmount = isWin ? bet * 36 : 0;
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

    setHistory([
      {
        number: winNumber,
        selected: selectedNumber,
        win: isWin,
        amount: winAmount,
        timestamp: new Date().toLocaleTimeString()
      },
      ...history.slice(0, 9)
    ]);

    if (isWin) {
      setMessage(`🎉 Number ${winNumber}! You won ${winAmount} coins!`);
    } else {
      setMessage(`Number ${winNumber} - Better luck next time!`);
    }

    setSpinning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 backdrop-blur-xl bg-slate-900/50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gold">🎡 ROULETTE</h1>
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wheel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <div className="aspect-square relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border-4 border-gold/30"></div>
                
                {/* Wheel */}
                <div 
                  className="w-64 h-64 rounded-full bg-gradient-to-br from-purple-900 to-slate-900 border-4 border-gold flex items-center justify-center transition-transform duration-75"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="grid grid-cols-6 gap-2 w-56 h-56 place-items-center">
                    {NUMBERS.slice(0, 18).map((n) => (
                      <div key={n} className="text-xs font-bold text-gold">{n}</div>
                    ))}
                  </div>
                </div>

                {/* Pointer */}
                <div className="absolute top-0 text-4xl">🔺</div>
              </div>

              {message && (
                <div className={`text-center text-lg font-bold mt-6 ${
                  message.includes('won') ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Bet Input */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <label className="text-slate-300 font-semibold block mb-2">Bet Amount</label>
              <input
                type="number"
                min="1"
                max={coins}
                value={bet}
                onChange={(e) => setBet(Math.max(1, Number(e.target.value)))}
                disabled={spinning}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-gold font-bold mb-4"
              />
              <p className="text-slate-400 text-sm">Max Payout: {bet * 36}</p>
            </div>

            {/* Number Selection */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <label className="text-slate-300 font-semibold block mb-3">Select Number</label>
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                {NUMBERS.map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedNumber(num)}
                    disabled={spinning}
                    className={`py-2 rounded font-bold transition-all ${
                      selectedNumber === num
                        ? 'bg-gold text-slate-950 shadow-lg shadow-gold/50'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Spin Button */}
            <button
              onClick={spin}
              disabled={spinning || coins < bet || selectedNumber === null}
              className="w-full py-4 bg-gradient-to-r from-gold to-purple-neon text-slate-950 font-bold text-lg rounded-lg hover:shadow-xl hover:shadow-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {spinning ? 'Spinning...' : 'SPIN'}
            </button>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-gold font-semibold mb-2 text-sm">Recent</h3>
                <div className="space-y-1">
                  {history.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="text-xs flex justify-between text-slate-300">
                      <span>#{entry.number} {entry.win ? '✓' : '✗'}</span>
                      <span className={entry.win ? 'text-green-400' : 'text-red-400'}>
                        {entry.win ? `+${entry.amount}` : `-${bet}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouletteGame;
