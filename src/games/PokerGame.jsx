import React, { useState } from 'react';

function PokerGame({ playerData, onExit, supabase, user }) {
  const [bet, setBet] = useState(20);
  const [gameState, setGameState] = useState('betting'); // betting, playing, result
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [message, setMessage] = useState('');
  const [coins, setCoins] = useState(playerData?.coins || 0);
  const [result, setResult] = useState(null);

  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const generateDeck = () => {
    const deck = [];
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        deck.push(`${rank}${suit}`);
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const getRankValue = (rank) => {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
  };

  const evaluateHand = (hand) => {
    const ranks = hand.map(c => c.slice(0, -1)).sort((a, b) => getRankValue(b) - getRankValue(a));
    const suits = hand.map(c => c.slice(-1));
    const values = ranks.map(r => getRankValue(r));

    // Royal Flush
    if (suits.every(s => s === suits[0]) && values.slice(1).every((v, i) => v === values[0] - i - 1) && values[0] === 14) {
      return { name: 'Royal Flush', rank: 10, values };
    }

    // Straight Flush
    if (suits.every(s => s === suits[0]) && values.slice(1).every((v, i) => v === values[0] - i - 1)) {
      return { name: 'Straight Flush', rank: 9, values };
    }

    // Four of a Kind
    if (values[0] === values[3]) {
      return { name: 'Four of a Kind', rank: 8, values };
    }

    // Full House
    if ((values[0] === values[2] && values[3] === values[4]) || (values[0] === values[1] && values[2] === values[4])) {
      return { name: 'Full House', rank: 7, values };
    }

    // Flush
    if (suits.every(s => s === suits[0])) {
      return { name: 'Flush', rank: 6, values };
    }

    // Straight
    if (values.slice(1).every((v, i) => v === values[0] - i - 1)) {
      return { name: 'Straight', rank: 5, values };
    }

    // Three of a Kind
    if (values[0] === values[2] || values[1] === values[3] || values[2] === values[4]) {
      return { name: 'Three of a Kind', rank: 4, values };
    }

    // Two Pair
    if ((values[0] === values[1] && values[2] === values[3]) || (values[0] === values[1] && values[3] === values[4]) || (values[1] === values[2] && values[3] === values[4])) {
      return { name: 'Two Pair', rank: 3, values };
    }

    // One Pair
    if (values[0] === values[1] || values[1] === values[2] || values[2] === values[3] || values[3] === values[4]) {
      return { name: 'One Pair', rank: 2, values };
    }

    return { name: 'High Card', rank: 1, values };
  };

  const startGame = async () => {
    if (coins < bet) {
      setMessage('Insufficient coins!');
      return;
    }

    const deck = generateDeck();
    const playerCards = deck.slice(0, 5);
    const dealerCards = deck.slice(5, 10);

    setPlayerHand(playerCards);
    setDealerHand(dealerCards);
    setGameState('playing');
  };

  const fold = () => {
    endGame('fold');
  };

  const callBet = async () => {
    const playerEval = evaluateHand(playerHand);
    const dealerEval = evaluateHand(dealerHand);

    if (playerEval.rank > dealerEval.rank) {
      endGame('win');
    } else if (dealerEval.rank > playerEval.rank) {
      endGame('lose');
    } else {
      endGame('push');
    }
  };

  const endGame = async (outcome) => {
    let winAmount = 0;
    let message = '';

    if (outcome === 'win') {
      winAmount = bet * 2;
      message = '🎉 You won the hand!';
    } else if (outcome === 'fold') {
      message = '🙁 You folded!';
    } else if (outcome === 'lose') {
      message = '😔 Dealer wins!';
    } else if (outcome === 'push') {
      winAmount = bet;
      message = '🤝 Split pot!';
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

    const pEval = evaluateHand(playerHand);
    const dEval = evaluateHand(dealerHand);

    setResult({
      outcome,
      message,
      winAmount,
      playerHand: playerHand,
      dealerHand: dealerHand,
      playerEval: pEval,
      dealerEval: dEval
    });
    setGameState('result');
  };

  const reset = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setMessage('');
    setResult(null);
  };

  const renderCard = (card) => (
    <div key={card} className="w-14 h-20 bg-gradient-to-br from-gold to-yellow-500 rounded-lg flex flex-col items-center justify-center text-slate-950 font-bold border-2 border-gold text-xs">
      <div>{card.slice(0, -1)}</div>
      <div className="text-sm">{card.slice(-1)}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 backdrop-blur-xl bg-slate-900/50 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gold">♠️ POKER</h1>
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
              <h2 className="text-3xl font-bold text-gold mb-6">Texas Hold'em</h2>
              <div className="bg-slate-900/50 rounded-lg p-6 mb-6">
                <input
                  type="range"
                  min="10"
                  max={Math.min(200, coins)}
                  step="10"
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value))}
                  className="w-full mb-4"
                />
                <div className="text-2xl font-bold text-gold mb-4">Bet: {bet} coins</div>
                <p className="text-slate-400 text-sm">Win up to {bet * 2} coins</p>
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
              {/* Dealer Hand */}
              <div>
                <h3 className="text-slate-400 font-semibold mb-3 uppercase">Dealer's Hand</h3>
                <div className="flex gap-2 flex-wrap mb-2">
                  {dealerHand.map(card => renderCard(card))}
                </div>
              </div>

              {/* Your Hand */}
              <div>
                <h3 className="text-slate-400 font-semibold mb-3 uppercase">Your Hand</h3>
                <div className="flex gap-2 flex-wrap mb-2">
                  {playerHand.map(card => renderCard(card))}
                </div>
                <div className="text-gold font-bold text-lg">
                  {evaluateHand(playerHand).name}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={fold}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all uppercase"
                >
                  Fold
                </button>
                <button
                  onClick={callBet}
                  className="px-8 py-3 bg-gold text-slate-950 font-bold rounded-lg hover:shadow-lg transition-all uppercase"
                >
                  Call
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
                  <p className="text-slate-400 text-sm uppercase mb-2 font-semibold">Your Hand</p>
                  <div className="flex gap-2 flex-wrap mb-2 justify-center">
                    {result.playerHand.map(card => renderCard(card))}
                  </div>
                  <p className="text-gold font-bold">{result.playerEval.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm uppercase mb-2 font-semibold">Dealer's Hand</p>
                  <div className="flex gap-2 flex-wrap mb-2 justify-center">
                    {result.dealerHand.map(card => renderCard(card))}
                  </div>
                  <p className="text-gold font-bold">{result.dealerEval.name}</p>
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

export default PokerGame;
