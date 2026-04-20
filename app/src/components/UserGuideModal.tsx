import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface Slide {
  title: string;
  description: string;
  image: string;
  annotations: { x: string; y: string; text: string; arrowDir: 'up' | 'down' | 'left' | 'right' }[];
}

const slides: Slide[] = [
  {
    title: "Hi-Fi Mastering Dashboard",
    description: "Welcome to Disco Aura. This is your central playback hub where logic meets aesthetics. Experience the power of 10-band mastering and real-time visualization.",
    image: "/guide/dashboard.png",
    annotations: [
      { x: '10%', y: '15%', text: 'Top Menu: Access Media & Tools', arrowDir: 'up' },
      { x: '50%', y: '50%', text: 'Central Player: CD Spin Control', arrowDir: 'down' },
      { x: '45%', y: '82%', text: 'Transport Hub: Play/Pause/EQ', arrowDir: 'down' },
      { x: '75%', y: '20%', text: 'Spectrum: Real-time visualizer', arrowDir: 'up' }
    ]
  },
  {
    title: "Discovery Hub (DVD)",
    description: "Stream your favorite YouTube Music directly. Search by song, album, or video. Sign in with Google to sync your personal library.",
    image: "/guide/discovery.png",
    annotations: [
      { x: '15%', y: '25%', text: 'Source Select: Album / Track / Video', arrowDir: 'left' },
      { x: '40%', y: '45%', text: 'Search Bar: Instant YouTube lookup', arrowDir: 'up' },
      { x: '82%', y: '10%', text: 'Google Auth: Sync your heart', arrowDir: 'right' }
    ]
  },
  {
    title: "Parametric Equalizer",
    description: "Fine-tune your audio experience with physics-based peak indicators and gravity decay. Use our curated presets from Sanyo, Sony, and Panasonic.",
    image: "/guide/equalizer.png",
    annotations: [
      { x: '50%', y: '45%', text: 'Bands: 10-band precision EQ', arrowDir: 'up' },
      { x: '75%', y: '75%', text: 'Presets: Retro Hi-Fi profiles', arrowDir: 'right' }
    ]
  }
];

export function UserGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setAnimating(false);
      }, 300);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setAnimating(false);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-3xl animate-in fade-in duration-700">
      <div className="relative clay-card w-full max-w-6xl h-[90vh] mx-4 overflow-hidden rounded-[40px] border border-white/10 flex flex-col shadow-[0_0_150px_rgba(30,58,138,0.4)]">
        
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10 shadow-lg">
                 <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                   Expert <span className="rainbow-text">User Guide</span>
                 </h2>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 transition-all duration-500 ease-out"
                         style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                       />
                    </div>
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-400/60 uppercase">
                      Module {currentSlide + 1} / {slides.length} • {slide.title}
                    </p>
                 </div>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="p-4 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all border border-white/5 active:scale-90"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className={`relative z-10 flex-1 bg-[#050505]/40 overflow-hidden group transition-all duration-300 ${animating ? 'opacity-0 scale-95 translate-x-10' : 'opacity-100 scale-100 translate-x-0'}`}>
          {/* Main Screenshot Container */}
          <div className="absolute inset-0 p-10 flex items-center justify-center">
             <div className="relative w-full h-full rounded-3xl border border-white/5 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-black/40">
                <img 
                  src={slide.image} 
                  className="w-full h-full object-contain filter brightness-90 group-hover:brightness-105 transition-all duration-1000" 
                  alt={slide.title}
                />
                
                {/* Annotations */}
                {slide.annotations.map((ann, idx) => (
                  <div 
                    key={idx}
                    className="absolute z-20"
                    style={{ left: ann.x, top: ann.y }}
                  >
                    <div className="relative flex flex-col items-center animate-bounce-slow">
                       <div className="px-5 py-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-black rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-500/30 whitespace-nowrap uppercase tracking-widest italic group-hover:border-blue-400/60 transition-colors">
                          <span className="rainbow-text">{ann.text}</span>
                       </div>
                       <div className={`w-[2px] h-10 bg-gradient-to-t from-blue-500 to-transparent ${ann.arrowDir === 'up' ? 'rotate-180' : ''}`} />
                       <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                    </div>
                  </div>
                ))}

                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-10 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="max-w-xl">
               <p className="text-lg text-white/90 leading-relaxed font-medium italic">
                 <span className="text-blue-400 font-black mr-2">/</span> {slide.description}
               </p>
            </div>
            <div className="flex items-center gap-6">
               {currentSlide > 0 && (
                 <Button 
                   variant="outline" 
                   onClick={handleBack}
                   disabled={animating}
                   className="clay-btn border-white/10 hover:bg-white/5 h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-xs"
                 >
                   <ChevronLeft className="w-5 h-5 mr-2" /> Back
                 </Button>
               )}
               <Button 
                 onClick={handleNext}
                 disabled={animating}
                 className="bg-blue-600 hover:bg-blue-500 text-white h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_15px_40px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center gap-3 hover:gap-4 border-t border-white/20"
               >
                 {currentSlide < slides.length - 1 ? (
                   <>Next Slide <ChevronRight className="w-5 h-5" /></>
                 ) : (
                   <>Enter Aura <Sparkles className="w-5 h-5" /></>
                 )}
               </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
