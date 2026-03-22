"use client";

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Float, Center } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Brain } from '@/components/Canvas/Brain';
import { AudioControls } from '@/components/UI/AudioControls';
import { BrainTooltip } from '@/components/UI/BrainTooltip';
import { useAudioAnalyzer, AudioData } from '@/hooks/useAudioAnalyzer';
import { useMindStore } from '@/store/useMindStore';
import * as THREE from 'three';

const FrequencyDashboard = ({ data }: { data: AudioData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
    const current = { bass: 0, lowMid: 0, mid: 0, high: 0 };
    let frame: number;

    const update = () => {
      current.bass = lerp(current.bass, data.bass, 0.4);
      current.lowMid = lerp(current.lowMid, data.lowMid, 0.4);
      current.mid = lerp(current.mid, data.mid, 0.4);
      current.high = lerp(current.high, data.high, 0.4);

      if (containerRef.current) {
        const el = containerRef.current;
        el.style.setProperty('--v-bass', `${Math.min(current.bass, 1.0) * 80}%`);
        el.style.setProperty('--v-lmid', `${Math.min(current.lowMid, 1.0) * 80}%`);
        el.style.setProperty('--v-mid', `${Math.min(current.mid, 1.0) * 80}%`);
        el.style.setProperty('--v-high', `${Math.min(current.high, 1.0) * 80}%`);
        el.style.setProperty('--o-bass', `${0.4 + current.bass * 0.6}`);
        el.style.setProperty('--o-lmid', `${0.4 + current.lowMid * 0.6}`);
        el.style.setProperty('--o-mid', `${0.4 + current.mid * 0.6}`);
        el.style.setProperty('--o-high', `${0.4 + current.high * 0.6}`);
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [data]);

  const config = [
    { label: 'Bass', var: '--v-bass', op: '--o-bass', color: '#ef4444' },
    { label: 'L-Mid', var: '--v-lmid', op: '--o-lmid', color: '#a855f7' },
    { label: 'Mid', var: '--v-mid', op: '--o-mid', color: '#f59e0b' },
    { label: 'High', var: '--v-high', op: '--o-high', color: '#10b981' },
  ];

  return (
    <div ref={containerRef} className="fixed top-8 right-8 flex flex-col gap-6 bg-black/60 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 pointer-events-none shadow-2xl min-w-[240px]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Neural Activity Monitor</h4>
        </div>
      </div>
      
      <div className="flex items-end gap-6 h-32 px-2">
        {config.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center gap-4 h-full relative">
            <div className="w-[1px] h-full bg-white/5 absolute bottom-8 left-1/2 -translate-x-1/2" />
            <div 
              className="w-[2px] absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full"
              style={{ 
                height: `var(${bar.var})`, 
                backgroundColor: bar.color,
                opacity: `var(${bar.op})`,
                boxShadow: `0 0 20px ${bar.color}44`
              } as any}
            />
            <div 
              className="w-3 h-3 rounded-full absolute z-10"
              style={{ 
                bottom: `calc(var(${bar.var}) + 32px)`,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#fff',
                border: `2px solid ${bar.color}`,
                boxShadow: `0 0 15px ${bar.color}, 0 0 30px ${bar.color}88`,
                opacity: `var(${bar.op})`
              } as any}
            />
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider mt-auto pt-8">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scene-specific logic component for Camera Haptics
const CameraHaptics = ({ bass }: { bass: number }) => {
  const { camera, controls } = useThree();
  
  useFrame((state) => {
    if (bass < 0.01 || (controls as any)?.active) return;

    const pCamera = camera as THREE.PerspectiveCamera;
    if (!pCamera.isPerspectiveCamera) return;

    if (bass > 0.1) {
      const targetFOV = 45 - (bass * 2.5);
      pCamera.fov = THREE.MathUtils.lerp(pCamera.fov, targetFOV, 0.2);
      pCamera.updateProjectionMatrix();
    }
  });

  return null;
};

export default function Home() {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [externalStream, setExternalStream] = useState<MediaStream | null>(null);
  const audioData = useAudioAnalyzer(audioElement, externalStream);

  return (
    <main className="relative w-full h-screen bg-[#050505] overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={45} />
          
          <OrbitControls 
            enablePan={true}
            minDistance={4}
            maxDistance={50}
            autoRotate={!audioElement?.paused && !externalStream}
            autoRotateSpeed={0.5}
          />

          <CameraHaptics bass={audioData.bass} />

          {/* Lighting */}
          <ambientLight intensity={0.1} />
          <pointLight position={[10, 10, 10]} intensity={0.8} color="#3b82f6" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ef4444" />
          
          <Environment preset="night" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <Brain audioData={audioData} />
          </Float>

          {/* Post Processing */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.7} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-1 bg-blue-500 rounded-full" />
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              MindVis <span className="text-blue-500">3D</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm max-w-xs font-medium leading-relaxed">
            Neural mapping of auditory signals. <br/>
            Real-time frequency distribution active.
          </p>
        </header>

        <FrequencyDashboard data={audioData} />

        <div className="pointer-events-auto">
          <BrainTooltip />
          <AudioControls 
            onAudioElementChange={setAudioElement} 
            onExternalStreamChange={setExternalStream}
          />
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>
    </main>
  );
}
