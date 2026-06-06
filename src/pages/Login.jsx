import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      if (error) throw error;
      toast.success('Password reset link sent! Check your email.');
      setIsForgotPassword(false);
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#111111] p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-white/5 transition-colors duration-200">
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="liquid-glass relative px-8 py-4 rounded-3xl border border-emerald-500/30 dark:border-emerald-400/20 shadow-[0_0_40px_rgba(16,185,129,0.15)] dark:shadow-[0_0_40px_rgba(52,211,153,0.1)] flex items-center justify-center mb-5 group overflow-hidden">
            {/* Glossy reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent dark:via-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
            
            <span className="text-4xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)] dark:drop-shadow-[0_2px_15px_rgba(52,211,153,0.5)]">
              Venflow
            </span>
          </div>
          <p className="text-xs tracking-[0.25em] font-bold text-slate-500 dark:text-slate-400 uppercase text-center">
            Smart procurement. Seamless flow.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isForgotPassword ? 'Reset Password' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isForgotPassword ? 'Enter your email to receive a reset link' : 'Sign in to your account to continue'}
          </p>
        </div>

        {isForgotPassword ? (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                  Login ID
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 dark:border-white/10 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 sm:text-sm transition-colors"
                  placeholder="Enter your login ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111111] focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 shadow-md"
              >
                {loading ? 'SENDING...' : 'SEND RESET LINK'}
              </button>
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                  Login ID
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 dark:border-white/10 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white bg-gray-50/50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 sm:text-sm transition-colors"
                  placeholder="Enter your login ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 dark:border-white/10 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white bg-gray-50/50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 sm:text-sm transition-colors pr-10"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111111] focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 shadow-md tracking-wider"
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </div>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-[#111111] text-slate-500 dark:text-slate-400">
                  or
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">Don't have an account? </span>
              <Link to="/register" className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">
                Sign Up
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
