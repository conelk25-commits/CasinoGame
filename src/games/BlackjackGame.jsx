import React, { useState, useEffect } from 'react';

function BlackjackGame({ playerData, onExit, supabase, user }) {
  const [bet, setBet] = useState(10);
  const [gameState, setGameState] = useState('betting'); // betting, playing, result
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [message, setMessage] = useState('');
  const [coins, setCoins] = useState(playerData?.coins || 0);
  const [result, setResult] = useState(null);

  const CARDS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUITS = ['♠', '♥', '♦', '♣'];

  const getCardValue = (card) => {
    if (card === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card)) return 10;
    return parseInt(card);
  };

  const calculateHand = (hand) => {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
      const value = getCardValue(card);
      if (card === 'A') aces++;
      total += value;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  };

  const getRandomCard = () => {
    return CARDS[Math.floor(Math.random() * CARDS.length)];
  };

  const startGame = async () => {
    if (coins < bet) {
      setMessage('Insufficient coins!');
      return;
    }

    const newPlayerHand = [getRandomCard(), getRandomCard()];
    const newDealerHand = [getRandomCard(), getRandomCard()];

    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setGameState('playing');
    setResult(null);
  };

  const hit = () => {
    const newHand = [...playerHand, getRandomCard()];
    setPlayerHand(newHand);

    if (calculateHand(newHand) > 21) {
      endGame('bust', newHand, dealerHand);
    }
  };

  const stand = async () => {
    let dealerCards = [...dealerHand];
    let playerTotal = calculateHand(playerHand);

    while (calculateHand(dealerCards) < 17) {
      dealerCards.push(getRandomCard());
    }

    setDealerHand(dealerCards);
    const dealerTotal = calculateHand(dealerCards);

    if (dealerTotal > 21) {
      endGame('win', playerHand, dealerCards);
    } else if (dealerTotal > playerTotal) {
      endGame('lose', playerHand, dealerCards);
    } else if (playerTotal > dealerTotal) {
      endGame('win', playerHand, dealerCards);
    } else {
      endGame('push', playerHand, dealerCards);
    }
  };

  const endGame = async (outcome, pHand, dHand) => {
    let winAmount = 0;
    let message = '';

    if (outcome === 'win') {
      winAmount = bet * 2;
      message = '🎉 You won!';
    } else if (outcome === 'bust') {
      message = '💥 Bust! You lose!';
    } else if (outcome === 'lose') {
      message = '😔 Dealer wins!';
    } else if (outcome === 'push') {
      winAmount = bet;
      message = '🤝 Push! You get your bet back!';
    }

    const newCoins = coins - bet + winAmount;
    setCoins(newCoins);

    await supabase
      .from('players')
      .update({
        coins: newCoins,
        total_played: (playerData?.total_played || 0) + bet,
        total_won: (playerData?.total_won || 0) + winAmount
      })
      .eq('user_id', user.id);

    setResult({ outcome, message, winAmount, pTotal: calculateHand(pHand), dTotal: calculateHand(dHand) });
    setGameState('result');
  };

  const reset = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setMessage('');
    setResult(null);
  };

  const renderCard = (card, idx) => (
    <div key={idx} className="w-16 h-24 bg-gradient-to-br from-gold to-yellow-500 rounded-lg flex flex-col items-center justify-center text-slate-950 font-bold border border-gold">
      <div className="text-sm">{SUITS[idx % 4]}</div>
      <div className="text-lg">{card}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 backdrop-blur-xl bg-slate-900/50 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gold">🂡 BLACKJACK</h1>
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
          {gameState === 'betting' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gold mb-6">Place Your Bet</h2>
              <div className="bg-slate-900/50 rounded-lg p-6 mb-6">
                <input
                  type="range"
                  min="1"
                  max={Math.min(100, coins)}
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value))}
                  className="w-full mb-4"
                />
                <div className="text-2xl font-bold text-gold mb-4">Bet: {bet} coins</div>
              </div>
              <button
                onClick={startGame}
                disabled={coins < bet}
                className="px-8 py-4 bg-gradient-to-r from-gold to-purple-neon text-slate-950 font-bold text-lg rounded-lg hover:shadow-xl hover:shadow-gold/50 transition-all disabled:opacity-50 uppercase"
              >
                Deal
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-8">
              {/* Dealer */}
              <div>
                <h3 className="text-slate-400 font-semibold mb-3 uppercase">Dealer</h3>
                <div className="flex gap-4 mb-2">
                  {dealerHand.map((card, idx) => renderCard(card, idx))}
                </div>
                <div className="text-slate-400 text-sm">
                  Total: {calculateHand(dealerHand.slice(0, 1))} + ?
                </div>
              </div>

              {/* Player */}
              <div>
                <h3 className="text-slate-400 font-semibold mb-3 uppercase">Your Hand</h3>
                <div className="flex gap-4 mb-2">
                  {playerHand.map((card, idx) => renderCard(card, idx))}
                </div>
                <div className="text-gold font-bold text-lg">
                  Total: {calculateHand(playerHand)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={hit}
                  className="px-8 py-3 bg-purple-neon text-slate-950 font-bold rounded-lg hover:shadow-lg transition-all uppercase"
                >
                  Hit
                </button>
                <button
                  onClick={stand}
                  className="px-8 py-3 bg-gold text-slate-950 font-bold rounded-lg hover:shadow-lg transition-all uppercase"
                >
                  Stand
                </button>
              </div>
            </div>
          )}

          {gameState === 'result' && result && (
            <div className="text-center">
              <div className={`text-4xl font-bold mb-6 ${
                result.outcome === 'win' || result.outcome === 'push'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {result.message}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-900/50 p-4 rounded-lg">
                <div>
                  <p className="text-slate-400 text-sm uppercase mb-1">You</p>
                  <p className="text-2xl font-bold text-gold">{result.pTotal}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm uppercase mb-1">Dealer</p>
                  <p className="text-2xl font-bold text-gold">{result.dTotal}</p>
                </div>
              </div>

              {result.winAmount > 0 && (
                <div className="mb-6 text-2xl font-bold text-green-400">
                  +{result.winAmount} coins
                </div>
              )}

              <button
                onClick={reset}
                className="px-8 py-3 bg-gradient-to-r from-gold to-purple-neon text-slate-950 font-bold rounded-lg hover:shadow-lg transition-all uppercase"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlackjackGame;
