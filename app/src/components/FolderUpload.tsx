import { useRef, useState } from 'react';
import { FolderOpen, Scan, X, Music, FileAudio } from 'lucide-react';

interface FolderUploadProps {
  onFilesSelected: (files: File[]) => void;
  isScanning: boolean;
  scannedCount: number;
}

export function FolderUpload({ onFilesSelected, isScanning, scannedCount }: FolderUploadProps) {
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleDirectorySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Filter only audio files
    const audioFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || 
          file.name.match(/\.(mp3|wav|flac|aac|ogg|m4a|wma)$/i)) {
        audioFiles.push(file);
      }
    }

    if (audioFiles.length > 0) {
      onFilesSelected(audioFiles);
    }
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => directoryInputRef.current?.click()}
        disabled={isScanning}
        className={`
          glow-btn flex items-center gap-3 px-4 py-3 rounded-xl
          touch-target w-full justify-center
          ${isScanning ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        {isScanning ? (
          <>
            <Scan className="w-5 h-5 animate-pulse text-[var(--glow-cyan)]" />
            <span className="glow-text-cyan text-sm font-medium">
              Scanning... {scannedCount} files
            </span>
          </>
        ) : (
          <>
            <FolderOpen className="w-5 h-5 text-[var(--glow-amber)]" />
            <span className="glow-text-amber text-sm font-medium">
              Select Music Folder
            </span>
          </>
        )}
      </button>

      {/* Help Button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white"
      >
        <span className="text-xs">?</span>
      </button>

      {/* Help Tooltip */}
      {showHelp && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 glass-panel text-xs text-gray-300 z-50">
          <div className="flex items-start gap-2">
            <Music className="w-4 h-4 text-[var(--glow-green)] mt-0.5" />
            <div>
              <p className="mb-1">Select a folder to auto-scan for audio files:</p>
              <ul className="space-y-1 text-gray-400">
                <li className="flex items-center gap-1">
                  <FileAudio className="w-3 h-3" /> MP3, WAV, FLAC
                </li>
                <li className="flex items-center gap-1">
                  <FileAudio className="w-3 h-3" /> AAC, OGG, M4A
                </li>
              </ul>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(false)}
            className="absolute top-1 right-1 p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Hidden Directory Input */}
      <input
        ref={directoryInputRef}
        type="file"
        {...{ webkitdirectory: "true" }}
        {...{ directory: "true" }}
        multiple
        onChange={handleDirectorySelect}
        className="hidden"
      />
    </div>
  );
}
