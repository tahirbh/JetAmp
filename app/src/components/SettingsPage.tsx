
import { ArrowLeft, Download, Settings, Monitor, Smartphone, Cpu, Box } from 'lucide-react';
import { Button } from './ui/button';

interface SettingsPageProps {
  settings: {
    deckMode: boolean;
    autoResolve: boolean;
    highRes: boolean;
  };
  onUpdateSettings: (settings: any) => void;
  onBack: () => void;
}

export function SettingsPage({ settings, onUpdateSettings, onBack }: SettingsPageProps) {
  const toggleSetting = (key: string) => {
    onUpdateSettings({ ...settings, [key]: !((settings as any)[key]) });
  };

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
             <Settings className="w-5 h-5 text-cyan-400" />
             <h1 className="text-2xl sm:text-4xl font-black rainbow-text uppercase tracking-tighter">System Settings</h1>
          </div>
          <p className="text-[10px] text-gray-500 font-mono tracking-[0.4em] uppercase mt-1">Configure your Aura Experience</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <div className="max-w-4xl space-y-8">
          
          {/* Section: Mobile Integration */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Smartphone className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Android Application</h3>
                  <p className="text-sm text-gray-400 mt-1">Install JetAmp on your Android head unit or smartphone for the full native experience.</p>
                </div>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <a href="/jetamp.apk" download="jetamp.apk">
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 h-12 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                      <Download size={18} /> Download APK
                    </Button>
                  </a>
                  <p className="text-[10px] text-gray-500 self-center font-mono uppercase tracking-widest">v4.0.0-PRO • 64-bit ARM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Interface Control */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Hi-Fi System Logic</h3>
            </div>
            
            <div className="space-y-4">
              <div 
                onClick={() => toggleSetting('deckMode')}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <Box className={`w-5 h-5 transition-colors ${settings.deckMode ? 'text-blue-400' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-bold text-sm">Graphical Deck Mode</h4>
                    <p className="text-[10px] text-gray-500">Enable the JetAudio Multi-Deck entry point over standard tabs.</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${settings.deckMode ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${settings.deckMode ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              <div 
                onClick={() => toggleSetting('autoResolve')}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <Monitor className={`w-5 h-5 transition-colors ${settings.autoResolve ? 'text-blue-400' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-bold text-sm">Instant Resolution</h4>
                    <p className="text-[10px] text-gray-500">Automatically upgrade commercial previews to full streams.</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoResolve ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${settings.autoResolve ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Device Calibration */}

          {/* Version Info */}
          <div className="text-center pt-8 opacity-20">
             <p className="text-[10px] font-black tracking-[0.5em] uppercase">Built with Reactive Tech • No Placeholders</p>
          </div>
        </div>
      </div>
    </div>
  );
}
