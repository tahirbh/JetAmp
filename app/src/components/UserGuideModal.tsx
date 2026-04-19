import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle, ArrowRight } from 'lucide-react';
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
    description: "Welcome to Disco Aura. This is your central playback hub where logic meets aesthetics.",
    image: "/guide/dashboard.png",
    annotations: [
      { x: '10%', y: '5%', text: 'Top Menu: Access Media & Help', arrowDir: 'up' },
      { x: '50%', y: '45%', text: 'Central Player: CD Spin Control', arrowDir: 'down' },
      { x: '45%', y: '85%', text: 'Transport Hub: Play/Pause/EQ', arrowDir: 'down' },
      { x: '75%', y: '15%', text: 'Spectrum Analyzer: Real-time visualizer', arrowDir: 'up' }
    ]
  },
  {
    title: "Discovery Hub (DVD)",
    description: "Steam your favorite YouTube Music directly. Search by song, album, or video.",
    image: "/guide/discovery.png",
    annotations: [
      { x: '10%', y: '20%', text: 'Source Select: Album / Track / Video', arrowDir: 'left' },
      { x: '20%', y: '40%', text: 'Search Bar: Instant YouTube lookup', arrowDir: 'up' },
      { x: '85%', y: '5%', text: 'Google Auth: Access your playlists', arrowDir: 'right' }
    ]
  },
  {
    title: "Parametric Equalizer",
    description: "Fine-tune your audio experience with physics-based peak indicators and gravity decay.",
    image: "/guide/equalizer.png",
    annotations: [
      { x: '50%', y: '50%', text: 'Bands: 10-band precision EQ', arrowDir: 'up' },
      { x: '80%', y: '80%', text: 'Presets: Sanyo, Sony, Panasonic profiles', arrowDir: 'right' }
    ]
  }
];

export function UserGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative clay-card w-full max-w-5xl h-[85vh] mx-4 overflow-hidden rounded-[40px] border border-white/10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                 <HelpCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                 <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                   Expert <span className="rainbow-text">User Guide</span>
                 </h2>
                 <p className="text-[10px] font-black tracking-[0.3em] text-blue-400/60 uppercase">
                   Slide {currentSlide + 1} of {slides.length} • {slide.title}
                 </p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all border border-white/5"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden group">
          {/* Main Screenshot */}
          <div className="absolute inset-0 p-8 flex items-center justify-center">
             <div className="relative w-full h-full rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <img 
                  src={slide.image} 
                  className="w-full h-full object-contain bg-black/20" 
                  alt={slide.title}
                />
                
                {/* Annotations */}
                {slide.annotations.map((ann, idx) => (
                  <div 
                    key={idx}
                    className="absolute"
                    style={{ left: ann.x, top: ann.y }}
                  >
                    <div className="relative flex flex-col items-center animate-bounce-slow">
                       <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-[0_0_20px_rgba(0,100,255,0.5)] border border-white/20 whitespace-nowrap">
                          {ann.text}
                       </div>
                       <div className={`w-0.5 h-8 bg-gradient-to-t from-blue-600 to-transparent ${ann.arrowDir === 'up' ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                ))}
             </div>
          </div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0a0a0a]/20 via-transparent to-[#0a0a0a]/40" />
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="max-w-md">
               <p className="text-sm text-white/80 leading-relaxed italic">
                 "{slide.description}"
               </p>
            </div>
            <div className="flex items-center gap-4">
               {currentSlide > 0 && (
                 <Button 
                   variant="outline" 
                   onClick={handleBack}
                   className="clay-btn border-white/10 hover:bg-white/5 h-12 px-6"
                 >
                   <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                 </Button>
               )}
               <Button 
                 onClick={handleNext}
                 className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 rounded-full font-bold shadow-[0_10px_30px_rgba(0,100,255,0.3)] transition-all active:scale-95 flex items-center gap-2"
               >
                 {currentSlide < slides.length - 1 ? (
                   <>Next Step <ChevronRight className="w-5 h-5" /></>
                 ) : (
                   <>Dive Into Aura <ArrowRight className="w-5 h-5" /></>
                 )}
               </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
