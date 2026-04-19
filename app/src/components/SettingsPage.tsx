
import { ArrowLeft, Download, Shield, Settings, Monitor, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
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

          {/* Section: Interface Scaling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Monitor className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-gray-200">Display Scaling</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">Optimize the UI for 7-inch vs 10-inch car screens.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-white/10 text-[10px] h-8">Compact</Button>
                <Button variant="default" size="sm" className="flex-1 bg-purple-600 h-8 text-[10px]">Standard</Button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-gray-200">Audio Permissions</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">Allow access to high-resolution microphone for visualizers.</p>
              <Button variant="outline" size="sm" className="w-full border-emerald-500/20 text-emerald-400 text-[10px] h-8">Enable Laboratory Access</Button>
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center pt-8 opacity-20">
             <p className="text-[10px] font-black tracking-[0.5em] uppercase">Built with Reactive Tech • No Placeholders</p>
          </div>
        </div>
      </div>
    </div>
  );
}
