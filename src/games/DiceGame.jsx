import React, { useState } from 'react';

function DiceGame({ playerData, onExit, supabase, user }) {
  const [bet, setBet] = useState(10);
  const [predictedNumber, setPredictedNumber] = useState(4);
  const [rolling, setRolling] = useState(false);
  const [diceValues, setDiceValues] = useState([1, 1]);
  const [message, setMessage] = useState('');
  const [coins, setCoins] = useState(playerData?.coins || 0);
  const [history, setHistory] = useState([]);

  const roll = async () => {
    if (rolling || coins < bet) {
      setMessage('Insufficient coins!');
      return;
    }

    setRolling(true);
    setMessage('');

    // Animation
    for (let i = 0; i < 15; i++) {
      setDiceValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final result
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    setDiceValues([dice1, dice2]);

    // Check win
    const isWin = total === predictedNumber;
    const winAmount = isWin ? bet * 5 : 0;
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

    // History
    setHistory([
      {
        roll: `${dice1} + ${dice2}`,
        total,
        predicted: predictedNumber,
        win: isWin,
        amount: winAmount,
        timestamp: new Date().toLocaleTimeString()
      },
      ...history.slice(0, 9)
    ]);

    if (isWin) {
      setMessage(`🎉 You rolled ${total}! Won ${winAmount} coins!`);
    } else {
      setMessage(`You rolled ${total}. Try again!`);
    }

    setRolling(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 backdrop-blur-xl bg-slate-900/50 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gold">🎲 DICE</h1>
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
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
          {/* Dice Display */}
          <div className="mb-8">
            <h2 className="text-slate-400 text-sm uppercase tracking-widest mb-4">Your Roll</h2>
            <div className="flex justify-center gap-8 mb-6">
              {diceValues.map((value, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-20 bg-gradient-to-br from-gold to-orange-500 rounded-lg flex items-center justify-center text-4xl font-bold text-slate-950 shadow-lg ${
                    rolling ? 'animate-bounce' : ''
                  }`}
                >
                  {value}
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold mb-2">
                Total: {diceValues[0] + diceValues[1]}
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`text-center text-lg font-bold mb-6 p-4 rounded-lg ${
              message.includes('won') 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
            }`}>
              {message}
            </div>
          )}

          {/* Controls */}
          <div className="space-y-6">
            {/* Bet */}
            <div>
              <label className="text-slate-300 font-semibold block mb-2">Bet Amount</label>
              <input
                type="range"
                min="1"
                max={Math.min(100, coins)}
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                disabled={rolling}
                className="w-full"
              />
              <div className="text-slate-400 text-sm mt-2">Current Bet: {bet} coins</div>
            </div>

            {/* Prediction */}
            <div>
              <label className="text-slate-300 font-semibold block mb-3">Predict the total (2-12)</label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPredictedNumber(num)}
                    disabled={rolling}
                    className={`py-2 rounded font-bold transition-all ${
                      predictedNumber === num
                        ? 'bg-purple-neon text-slate-950 shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Roll Button */}
            <button
              onClick={roll}
              disabled={rolling || coins < bet}
              className="w-full py-4 bg-gradient-to-r from-gold to-purple-neon text-slate-950 font-bold text-lg rounded-lg hover:shadow-xl hover:shadow-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {rolling ? 'Rolling...' : 'ROLL DICE'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-sm">
              ⭐ Predict the correct total to win 5x your bet!
            </p>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-8">
              <h3 className="text-gold font-semibold mb-3">Recent Rolls</h3>
              <div className="space-y-2">
                {history.map((entry, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-slate-900/50 p-3 rounded">
                    <span className="text-slate-300">{entry.roll}</span>
                    <span className="text-slate-300">Total: {entry.total}</span>
                    <span className={entry.win ? 'text-green-400 font-bold' : 'text-slate-400'}>
                      {entry.win ? `+${entry.amount}` : '-'}{bet}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiceGame;
