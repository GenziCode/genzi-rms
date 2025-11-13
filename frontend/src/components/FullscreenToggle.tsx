import { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
    >
      {isFullscreen ? (
        <Minimize className="w-5 h-5 text-gray-600" />
      ) : (
        <Maximize className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
}

