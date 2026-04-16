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
  onSetVisualizerStyle: (style: 'sanyo' | 'oscilloscope') => void;
  isPlaying: boolean;
  currentStyle: 'sanyo' | 'oscilloscope';
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
  onSetVisualizerStyle,
  isPlaying,
  currentStyle,
}: TopMenuProps) {
  return (
    <div className="w-full bg-[var(--bg-panel)] border-b border-[var(--metal-dark)] relative z-50">
      <Menubar className="border-none bg-transparent">
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
            Audio
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
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'sanyo' ? 'text-[var(--glow-cyan)] font-bold' : ''}`}
                >
                  Sanyo Spectrum {currentStyle === 'sanyo' && '✓'}
                </MenubarItem>
                <MenubarItem 
                  onClick={() => onSetVisualizerStyle('oscilloscope')}
                  className={`flex items-center justify-between focus:bg-[var(--glow-cyan)]/10 ${currentStyle === 'oscilloscope' ? 'text-[var(--glow-cyan)] font-bold' : ''}`}
                >
                  Digital Oscilloscope {currentStyle === 'oscilloscope' && '✓'}
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
            <MenubarItem className="flex items-center gap-2 focus:bg-[var(--glow-cyan)]/10 cursor-pointer opacity-50">
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
