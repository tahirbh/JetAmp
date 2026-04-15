import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';

interface URLDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

export function URLDialog({ isOpen, onClose, onSubmit }: URLDialogProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
      setUrl('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--metal-dark)] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 glow-text-cyan">
            <Globe className="w-5 h-5" /> Open Network Stream
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the URL of an audio file or stream (e.g. .mp3, .aac, .m4a)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Input
            placeholder="https://example.com/audio.mp3"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-[var(--bg-dark)] border-[var(--metal-dark)] focus:border-[var(--glow-cyan)] text-white"
            autoFocus
          />
          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[var(--glow-cyan)] text-black hover:bg-[var(--glow-cyan)]/80 font-bold"
            >
              Open Stream
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
