import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AuthScreen from './screens/AuthScreen';
import LobbyScreen from './screens/LobbyScreen';
import SlotsGame from './games/SlotsGame';
import BlackjackGame from './games/BlackjackGame';
import RouletteGame from './games/RouletteGame';
import DiceGame from './games/DiceGame';
import PokerGame from './games/PokerGame';
import './styles/global.css';

// Initialize Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function CasinoGame() {
  const [user, setUser] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlinePlayers, setOnlinePlayers] = useState([]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        await fetchPlayerData(currentUser.id);
        subscribeToPlayerUpdates(currentUser.id);
        subscribeToOnlinePlayers();
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const fetchPlayerData = async (userId) => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Player doesn't exist, create one
      const { data: newPlayer } = await supabase
        .from('players')
        .insert([{
          user_id: userId,
          coins: 100,
          total_played: 0,
          total_won: 0
        }])
        .select()
        .single();
      setPlayerData(newPlayer);
    } else if (data) {
      setPlayerData(data);
    }
  };

  const subscribeToPlayerUpdates = (userId) => {
    const subscription = supabase
      .channel(`player:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setPlayerData(payload.new);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const subscribeToOnlinePlayers = () => {
    const subscription = supabase
      .channel('online_players')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_sessions'
        },
        async () => {
          const { data } = await supabase
            .from('player_sessions')
            .select(`player_id, players(username)`)
            .eq('is_online', true);
          
          if (data) {
            setOnlinePlayers(data);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleLogin = async (userData) => {
    setUser(userData.user);
    await fetchPlayerData(userData.user.id);
    subscribeToPlayerUpdates(userData.user.id);
    subscribeToOnlinePlayers();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPlayerData(null);
    setCurrentGame(null);
  };

  const handleGameExit = () => {
    setCurrentGame(null);
    // Refresh player data when returning to lobby
    if (user) {
      fetchPlayerData(user.id);
    }
  };

  const handleRefreshCoins = async () => {
    if (!user || !playerData) return;
    
    const { data, error } = await supabase
      .from('players')
      .update({
        coins: 100,
        last_refresh: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setPlayerData(data);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-purple-neon rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gold text-xl font-semibold">Loading Casino...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={handleLogin} />;
  }

  if (currentGame === 'slots') {
    return <SlotsGame playerData={playerData} onExit={handleGameExit} supabase={supabase} user={user} />;
  }

  if (currentGame === 'blackjack') {
    return <BlackjackGame playerData={playerData} onExit={handleGameExit} supabase={supabase} user={user} />;
  }

  if (currentGame === 'roulette') {
    return <RouletteGame playerData={playerData} onExit={handleGameExit} supabase={supabase} user={user} />;
  }

  if (currentGame === 'dice') {
    return <DiceGame playerData={playerData} onExit={handleGameExit} supabase={supabase} user={user} />;
  }

  if (currentGame === 'poker') {
    return <PokerGame playerData={playerData} onExit={handleGameExit} supabase={supabase} user={user} />;
  }

  return (
    <LobbyScreen
      user={user}
      playerData={playerData}
      onLogout={handleLogout}
      onSelectGame={setCurrentGame}
      onRefreshCoins={handleRefreshCoins}
      onlinePlayers={onlinePlayers}
    />
  );
}

export default CasinoGame;
