"use client";

import { useRef, useState } from 'react';
import { Play, Pause, Upload, Music, Mic, MicOff, Info, ShieldCheck } from 'lucide-react';

interface AudioControlsProps {
  onAudioElementChange: (el: HTMLAudioElement) => void;
  onExternalStreamChange: (stream: MediaStream | null) => void;
}

export const AudioControls = ({ onAudioElementChange, onExternalStreamChange }: AudioControlsProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const togglePlay = () => {
    if (isLive) return;
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleLive = async () => {
    if (isLive) {
      setIsLive(false);
      onExternalStreamChange(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 48000,
            channelCount: 2
          } 
        });
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        setIsLive(true);
        onExternalStreamChange(stream);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access is required for Live Mode.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      if (isLive) {
        setIsLive(false);
        onExternalStreamChange(null);
      }
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      setFileName(file.name);
      onAudioElementChange(audioRef.current);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl flex flex-col gap-4 items-center z-50">
      {/* Help Modal */}
      {showHelp && (
        <div className="w-full bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Info size={18} />
            <h5 className="font-bold uppercase tracking-widest text-xs">Setup Guide: Spotify & YouTube</h5>
          </div>
          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>To visualize Spotify or YouTube directly (without a physical mic):</p>
            <ol className="list-decimal list-inside space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
              <li>Open Windows <span className="text-white font-bold">Control Panel</span></li>
              <li>Go to <span className="text-white font-bold">Sound &gt; Recording</span></li>
              <li>Right-click and <span className="text-white font-bold">Show Disabled Devices</span></li>
              <li>Enable <span className="text-white font-bold">Stereo Mix</span> and set as Default</li>
              <li>Restart Live Mode here</li>
            </ol>
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <ShieldCheck size={16} />
              <p className="text-xs font-medium">Privacy: Your audio is processed locally in RAM. We never store or upload your sounds.</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 flex items-center gap-6 shadow-2xl">
        <audio 
          ref={(el) => {
            audioRef.current = el;
            if (el) onAudioElementChange(el);
          }} 
          className="hidden" 
          crossOrigin="anonymous"
        />
        
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            disabled={isLive}
            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-lg ${
              isLive 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-black hover:scale-110 shadow-white/10'
            }`}
          >
            {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
          </button>

          <button
            onClick={toggleLive}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all border ${
              isLive 
                ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {isLive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Music size={14} className={isLive ? "text-red-400" : "text-gray-400"} />
            <span className={`text-sm font-medium truncate ${isLive ? "text-red-400" : "text-white"}`}>
              {isLive ? "LIVE ANALYZER ACTIVE" : (fileName || "Drop audio or start Live Mode →")}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${isLive ? "bg-red-500 w-full" : "bg-blue-500 w-1/3 animate-pulse"}`} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`p-3 rounded-full transition-all ${showHelp ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            <Info size={20} />
          </button>

          <label className={`cursor-pointer group ${isLive ? "opacity-50 pointer-events-none" : ""}`}>
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            <div className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <Upload size={20} className="text-white/80 group-hover:text-white" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
