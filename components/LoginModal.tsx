import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-0 m-auto w-full max-w-md h-fit z-50 p-6"
          >
            <div className="relative bg-cyber-panel border border-cyber-cyan/30 rounded-lg overflow-hidden shadow-neon-cyan">
              {/* Decorative Header Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple" />
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-cyber-cyan/10 flex items-center justify-center mb-6 border border-cyber-cyan/30">
                  <Fingerprint className="text-cyber-cyan w-8 h-8" />
                </div>
                
                <h2 className="text-2xl font-mono font-bold text-white mb-2">AUTHENTICATE</h2>
                <p className="text-gray-400 text-sm text-center mb-8">
                  Connect your neural link to access personalized lists and watch history.
                </p>

                <div className="w-full space-y-4">
                  <button 
                    onClick={onLogin}
                    className="w-full py-3 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan font-mono font-bold rounded flex items-center justify-center gap-3 transition-all group"
                  >
                    <div className="w-2 h-2 bg-cyber-cyan rounded-full group-hover:shadow-[0_0_10px_#00f3ff]" />
                    INITIATE SEQUENCE
                  </button>
                  
                  <button className="w-full py-3 bg-transparent hover:bg-white/5 border border-gray-700 text-gray-300 font-mono rounded transition-all">
                    CREATE NEW ID
                  </button>
                </div>

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