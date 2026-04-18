import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from '@/components/ui/menubar';
import { 
  FileAudio, FolderOpen, Globe, Play, 
  Pause, Square, SkipBack, SkipForward,
  Activity, Settings, Info, Music
} from 'lucide-react';

interface TopMenuProps {
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onOpenURL: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onShowHelp: () => void;
  onShowSettings: () => void;
  onSetVisualizerStyle: (style: 'sanyo' | 'sony' | 'panasonic' | 'akai' | 'oscilloscope' | 'gunmetal' | 'rainbow') => void;
  isPlaying: boolean;
  currentStyle: 'sanyo' | 'sony' | 'panasonic' | 'akai' | 'oscilloscope' | 'gunmetal' | 'rainbow';
}

export function TopMenu({
  onOpenFile,
  onOpenFolder,
  onOpenURL,
  onPlay,
  onPause,
  onStop,
  onPrev,
  onNext,
  onShowHelp,
  onShowSettings,
  onSetVisualizerStyle,
  isPlaying,
  currentStyle,
}: TopMenuProps) {
  return (
    <div className="w-full relative z-50 glass-panel !rounded-none border-t-0 border-x-0">
      <Menubar className="border-none bg-transparent h-10">

        <MenubarMenu>
          <MenubarTrigger className="data-[state=open]:bg-[var(--metal-dark)] text-gray-300 hover:text-white transition-colors cursor-pointer px-4">
            Media
          </MenubarTrigger>
          <MenubarContent className="bg-[var(--bg-card)] border-[var(--metal-dark)] text-gray-300 shadow-2xl">
            <MenubarItem onClick={onOpenFile} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/20 focus:text-white cursor-pointer">
              <FileAudio size={16} /> Open File... <MenubarShortcut>Ctrl+O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onOpenFolder} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/20 focus:text-white cursor-pointer">
              <FolderOpen size={16} /> Open Folder... <MenubarShortcut>Ctrl+F</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onOpenURL} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/20 focus:text-white cursor-pointer">
              <Globe size={16} /> Open Network Stream... <MenubarShortcut>Ctrl+N</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator className="bg-[var(--metal-dark)]" />
            <MenubarItem className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer">
              Exit
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="data-[state=open]:bg-[var(--metal-dark)] text-gray-300 hover:text-white transition-colors cursor-pointer px-4">
            Playback
          </MenubarTrigger>
          <MenubarContent className="bg-[var(--bg-card)] border-[var(--metal-dark)] text-gray-300 shadow-2xl">
            <MenubarItem onClick={isPlaying ? onPause : onPlay} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />} 
              {isPlaying ? 'Pause' : 'Play'}
            </MenubarItem>
            <MenubarItem onClick={onStop} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer">
              <Square size={16} /> Stop
            </MenubarItem>
            <MenubarSeparator className="bg-[var(--metal-dark)]" />
            <MenubarItem onClick={onPrev} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer">
              <SkipBack size={16} /> Previous
            </MenubarItem>
            <MenubarItem onClick={onNext} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer">
              <SkipForward size={16} /> Next
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="data-[state=open]:bg-[var(--metal-dark)] text-gray-300 hover:text-white transition-colors cursor-pointer px-4">
            CD MP3
          </MenubarTrigger>
          <MenubarContent className="bg-[var(--bg-card)] border-[var(--metal-dark)] text-gray-300 shadow-2xl">
            <MenubarItem className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer">
              <Activity size={16} /> Signal Laboratory 
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer">
                Visualizer Styles
              </MenubarSubTrigger>
              <MenubarSubContent className="bg-[var(--bg-card)] border-[var(--metal-dark)]">
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('sanyo')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'sanyo' ? 'text-green-400 font-bold' : ''}`}
                >
                  Sanyo Spectrum (BGR) {currentStyle === 'sanyo' && '✓'}
                </MenubarItem>
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('sony')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'sony' ? 'text-cyan-400 font-bold' : ''}`}
                >
                  Sony Crystal {currentStyle === 'sony' && '✓'}
                </MenubarItem>
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('panasonic')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'panasonic' ? 'text-orange-400 font-bold' : ''}`}
                >
                  Panasonic VFD {currentStyle === 'panasonic' && '✓'}
                </MenubarItem>
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('akai')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'akai' ? 'text-red-500 font-bold' : ''}`}
                >
                  AKAI Pro Analog {currentStyle === 'akai' && '✓'}
                </MenubarItem>
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('gunmetal')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'gunmetal' ? 'text-white font-bold' : ''}`}
                >
                  Pro Analyzer (Grey) {currentStyle === 'gunmetal' && '✓'}
                </MenubarItem>
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('oscilloscope')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'oscilloscope' ? 'text-cyan-400 font-bold' : ''}`}
                >
                  Aura Oscilloscope {currentStyle === 'oscilloscope' && '✓'}
                </MenubarItem>
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('rainbow')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'rainbow' ? 'text-purple-400 font-bold' : ''}`}
                >
                  Dynamic Rainbow {currentStyle === 'rainbow' && '✓'}
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>


        <MenubarMenu>
          <MenubarTrigger className="data-[state=open]:bg-[var(--metal-dark)] text-gray-300 hover:text-white transition-colors cursor-pointer px-4">
            Help
          </MenubarTrigger>
          <MenubarContent className="bg-[var(--bg-card)] border-[var(--metal-dark)] text-gray-300 shadow-2xl">
            <MenubarItem onClick={onShowHelp} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer font-bold text-white">
              <Info size={16} /> Disco Aura Wiki & Help
            </MenubarItem>
            <MenubarSeparator className="bg-[var(--metal-dark)]" />
            <MenubarItem onClick={onShowSettings} className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer text-white">
              <Settings size={16} /> System Settings
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <div className="ml-auto flex items-center pr-4 gap-2">
            <Music className="w-4 h-4 text-[var(--glow-cyan)] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black rainbow-text tracking-[0.2em] uppercase">Disco Aura Hi-Fi</span>
        </div>
      </Menubar>
    </div>
  );
}
