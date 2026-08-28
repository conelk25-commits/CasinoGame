import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function AuthScreen({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    // Check if username is taken
    const { data: existingUser } = await supabase
      .from('players')
      .select('username')
      .eq('username', username);

    if (existingUser && existingUser.length > 0) {
      setError('Username already taken');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Create player profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('players')
        .insert([{
          user_id: data.user.id,
          username,
          email,
          coins: 100,
          total_played: 0,
          total_won: 0,
          created_at: new Date().toISOString()
        }]);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      onLoginSuccess(data);
    }

    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    onLoginSuccess(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-neon/5 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full filter blur-3xl"></div>

      <div className="relative max-w-md w-full">
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-purple-neon to-gold mb-2">
              CASINO
            </h1>
            <p className="text-slate-400 text-sm uppercase tracking-widest">Play. Win. Repeat.</p>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                !isSignUp
                  ? 'bg-gradient-to-r from-gold to-purple-neon text-slate-950 shadow-lg shadow-gold/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                isSignUp
                  ? 'bg-gradient-to-r from-gold to-purple-neon text-slate-950 shadow-lg shadow-gold/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose your player name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-gold via-purple-neon to-gold text-slate-950 font-bold rounded-lg hover:shadow-xl hover:shadow-gold/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Demo Notice */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs text-center">
           No demo account right now.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
