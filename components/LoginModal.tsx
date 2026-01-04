import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, Lock, Mail, Key } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        setError('Supabase is not properly configured. Please check your environment variables.');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        // Handle email confirmation errors more gracefully
        if (signUpError) {
          // If it's an email sending error but user was created, treat as success
          const isEmailError = signUpError.message?.toLowerCase().includes('confirmation email') || 
                              signUpError.message?.toLowerCase().includes('email') ||
                              signUpError.message?.toLowerCase().includes('smtp');
          
          if (isEmailError && data?.user) {
            // User was created but email couldn't be sent - still show success
            setSuccess('Account created successfully! You can sign in now.');
            setTimeout(() => {
              setIsSignUp(false);
              setEmail('');
              setPassword('');
            }, 3000);
            setLoading(false);
            return;
          }
          throw new Error(signUpError.message || 'Failed to create account');
        }

        if (data.user) {
          // Try to sign in automatically after sign up (if email confirmation is disabled)
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (!signInError && signInData.user) {
              // Successfully signed in - close modal and trigger login
              onLogin();
              onClose();
              setEmail('');
              setPassword('');
              return;
            }
          } catch (autoSignInError) {
            // Auto sign in failed, but user was created - show success message
          }
          
          // If auto sign in didn't work, show success message
          setSuccess('Account created successfully! You can sign in now.');
          setTimeout(() => {
            setIsSignUp(false);
            setEmail('');
            setPassword('');
          }, 3000);
        } else {
          throw new Error('Failed to create account. Please try again.');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw new Error(signInError.message || 'Failed to sign in');
        }

        if (data.user) {
          onLogin();
          onClose();
          setEmail('');
          setPassword('');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(null);
    setIsSignUp(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-0 m-auto w-full max-w-md h-fit z-50 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-cyber-panel border border-cyber-cyan/30 rounded-lg overflow-hidden shadow-neon-cyan">
              {/* Decorative Header Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple" />
              
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-cyber-cyan/10 flex items-center justify-center mb-6 border border-cyber-cyan/30">
                  <Fingerprint className="text-cyber-cyan w-8 h-8" />
                </div>
                
                <h2 className="text-2xl font-mono font-bold text-white mb-2">
                  {isSignUp ? 'CREATE NEW ID' : 'AUTHENTICATE'}
                </h2>
                <p className="text-gray-400 text-sm text-center mb-8">
                  {isSignUp 
                    ? 'Register your neural link to access personalized features.'
                    : 'Connect your neural link to access personalized lists and watch history.'}
                </p>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(220,20,60,0.2)] transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(220,20,60,0.2)] transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-cyber-red/10 border border-cyber-red/30 rounded text-cyber-red text-xs font-mono">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded text-cyber-cyan text-xs font-mono">
                      {success}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed border border-cyber-cyan/50 text-cyber-cyan font-mono font-bold rounded flex items-center justify-center gap-3 transition-all group"
                  >
                    {loading ? (
                      <span className="animate-pulse">PROCESSING...</span>
                    ) : (
                      <>
                    <div className="w-2 h-2 bg-cyber-cyan rounded-full group-hover:shadow-[0_0_10px_#00f3ff]" />
                        {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                      </>
                    )}
                  </button>
                </form>
                  
                <button 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full mt-4 py-3 bg-transparent hover:bg-white/5 border border-gray-700 text-gray-300 font-mono rounded transition-all text-sm"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create New ID'}
                  </button>

                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 font-mono">
                    <Lock size={12} />
                    SECURE ENCRYPTION: AES-256
                </div>
              </div>

              {/* Scanlines Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[-1] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;