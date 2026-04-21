import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowInstall(false);
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-6 right-6 z-50 shadow-2xl bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 flex gap-2 rounded-full h-10 px-4"
      onClick={handleInstall}
    >
      <Download className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-wider">Install App</span>
    </Button>
  );
}
