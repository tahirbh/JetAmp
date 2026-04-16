import { ArrowLeft, Book, Zap, Music, Activity, Globe, MousePointer2 } from 'lucide-react';

interface HelpPageProps {
  onBack: () => void;
}

export function HelpPage({ onBack }: HelpPageProps) {
  const sections = [
    {
      title: 'Media Loading',
      icon: <Music className="w-5 h-5 text-cyan-400" />,
      content: 'Access the MEDIA menu to load local files or entire music folders. For online enthusiasts, use the "Network Stream" feature to play live audio from any direct URL source.'
    },
    {
      title: 'Signal Laboratory',
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      content: 'Click the EQ button to enter the full-screen Laboratory. Here you can adjust the 10-band graphic EQ and use the specialized Aura Knobs for Bass Enhancement and Treble Clarity.'
    },
    {
      title: 'Aura Visualizers',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      content: 'Switch between the "Sanyo Spectrum" (classic bars) and the "Digital Oscilloscope" (real-time waveform) via the Audio > Visualizer Styles menu.'
    },
    {
      title: 'Dynamics & Tuning',
      icon: <Globe className="w-5 h-5 text-orange-400" />,
      content: 'The system features "Gravity Physics" on EQ peaks and a "Reactive Bass Aura" behind the CD. These elements pulse specifically to low-end frequencies for a breathing visual experience.'
    },
    {
      title: 'Navigation Tips',
      icon: <MousePointer2 className="w-5 h-5 text-emerald-400" />,
      content: 'Optimized for 7-inch car displays. All controls are ultra-responsive. Use the Signal Laboratory for precision road-tuning your speaker output.'
    }
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-dark)] text-white overflow-hidden p-6 sm:p-10">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10 flex-shrink-0">
        <button 
          onClick={onBack}
          className="p-3 bg-[var(--metal-dark)] rounded-full hover:bg-[var(--metal-mid)] border border-white/10 active:scale-90 transition-all shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
             <Book className="w-5 h-5 text-[var(--glow-cyan)]" />
             <h1 className="text-2xl sm:text-4xl font-black rainbow-text uppercase tracking-tighter">Aura Wiki & Help</h1>
          </div>
          <p className="text-[10px] text-gray-500 font-mono tracking-[0.4em] uppercase mt-1">DISCO AURA HI-FI SYSTEM v4.0</p>
        </div>
      </div>

      {/* Main Content: 2-Column Grid */}
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, idx) => (
            <div 
              key={idx} 
              className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-[var(--glow-cyan)]/30 transition-all duration-500 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                   {section.icon}
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white/90">{section.title}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                {section.content}
              </p>
            </div>
          ))}

          {/* Special Network Note */}
          <div className="md:col-span-2 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/10 rounded-3xl p-8 mt-4">
             <div className="flex items-center gap-4 mb-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h4 className="font-bold text-cyan-100 italic">Cloud Signal Note</h4>
             </div>
             <p className="text-xs text-cyan-200/60 leading-relaxed">
               Disco Aura supports high-bitrate FLAC, WAV, and MP3. When streaming over the network, ensure a stable connection to prevent signal flutter in the oscilloscope.
             </p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 flex justify-center flex-shrink-0 opacity-40">
         <span className="text-[8px] font-black tracking-[1em] uppercase rainbow-text">The Aura Never Ends</span>
      </div>
    </div>
  );
}
