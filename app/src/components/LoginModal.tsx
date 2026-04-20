import { useState, useEffect } from 'react';
import { X, Disc2, ShieldCheck, Heart, Sparkles, User, Chrome } from 'lucide-react';
import { Button } from './ui/button';
import { AuthService } from '@/lib/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAnimating(true);
    } else {
      document.body.style.overflow = '';
      setAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = () => {
    AuthService.login();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Dynamic Backdrop */}
      <div 
        className="absolute inset-0 bg-[#020202]/90 backdrop-blur-3xl animate-in fade-in duration-1000"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className={`relative w-full max-w-lg clay-card border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] flex flex-col transition-all duration-700 ${animating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
        
        {/* Animated Glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-50">
           <div className="absolute top-[0%] left-[0%] w-full h-[50%] bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-[80px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full animate-pulse" />
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10 p-10 flex flex-col items-center text-center">
            
            {/* App Icon / Logo */}
            <div className="relative mb-8 group">
               <div className="absolute inset-0 bg-blue-500/40 blur-3xl rounded-full scale-150 animate-pulse" />
               <div className="relative w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-3xl border border-white/20 p-5 flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                  <Disc2 className="w-full h-full text-blue-400 animate-spin-slow" />
               </div>
               <div className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-xl border border-white/20 shadow-lg animate-bounce">
                  <Sparkles className="w-5 h-5 text-white" />
               </div>
            </div>

            {/* Typography */}
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic mb-2">
              Sync <span className="rainbow-text">Your Aura</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium mb-10 max-w-[300px]">
              Unlock your personal YouTube Music library, playlists, and high-fidelity history.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 gap-4 w-full mb-10">
               <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                     <Heart className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs font-black uppercase text-white tracking-widest">Favorite Tracks</p>
                     <p className="text-[10px] text-gray-500">Access your liked songs instantly.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                     <ShieldCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs font-black uppercase text-white tracking-widest">Secure Sync</p>
                     <p className="text-[10px] text-gray-500">Your data is synced via official Google Auth.</p>
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 w-full">
               <Button 
                 onClick={handleLogin}
                 className="relative h-16 w-full bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl overflow-hidden group"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                 <Chrome className="w-5 h-5" />
                 Continue with Google
               </Button>
               
               <button 
                 onClick={onClose}
                 className="h-12 w-full text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
               >
                 <User className="w-4 h-4" />
                 Stay in Guest Mode
               </button>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
            <p className="text-[10px] font-black text-gray-600 tracking-widest uppercase">
              Disco Aura • Experimental Hi-Fi Player v1.0.5
            </p>
        </div>
      </div>
    </div>
  );
}
