"use client";

import { useEffect, useRef, useState } from 'react';

export interface AudioData {
  bass: number;
  lowMid: number;
  mid: number;
  high: number;
  overall: number;
}

// Global registry to prevent "already connected" errors across re-mounts
const sourceNodeCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

export const useAudioAnalyzer = (audioElement: HTMLAudioElement | null, externalStream: MediaStream | null) => {
  const [audioData, setAudioData] = useState<AudioData>({
    bass: 0,
    lowMid: 0,
    mid: 0,
    high: 0,
    overall: 0,
  });
  
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement && !externalStream) return;

    if (!contextRef.current) {
      contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const context = contextRef.current;

    const initAudio = () => {
      // 1. Setup persistent Gain and Analyzer if they don't exist
      if (!analyzerRef.current) {
        const analyzer = context.createAnalyser();
        analyzer.fftSize = 2048;
        analyzer.smoothingTimeConstant = 0.8;
        analyzerRef.current = analyzer;
        dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
      }

      if (!gainNodeRef.current) {
        gainNodeRef.current = context.createGain();
      }

      const analyzer = analyzerRef.current;
      const gainNode = gainNodeRef.current;

      // 2. Disconnect everything from gainNode first to reset the chain
      try { gainNode.disconnect(); } catch(e) {}

      // 3. Handle External Stream (Mic)
      if (externalStream) {
        if (streamSourceRef.current) {
          try { streamSourceRef.current.disconnect(); } catch(e) {}
        }
        streamSourceRef.current = context.createMediaStreamSource(externalStream);
        streamSourceRef.current.connect(gainNode);
        gainNode.gain.value = 2.5; // Boost Mic
        gainNode.connect(analyzer);
        // Do NOT connect to context.destination (feedback loop prevention)
      } 
      // 4. Handle Internal Element (File)
      else if (audioElement) {
        let elementSource = sourceNodeCache.get(audioElement);
        
        if (!elementSource) {
          elementSource = context.createMediaElementSource(audioElement);
          sourceNodeCache.set(audioElement, elementSource);
        }

        elementSource.connect(gainNode);
        gainNode.gain.value = 1.0; // Normal for files
        gainNode.connect(analyzer);
        analyzer.connect(context.destination);
      }
    };

    const updateData = () => {
      if (!analyzerRef.current || !dataArrayRef.current) return;
      if (context.state === 'suspended') context.resume();

      // @ts-ignore
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
      const dataArray = dataArrayRef.current;
      const len = dataArray.length;
      
      const getAverage = (startPct: number, endFreqPct: number) => {
        const start = Math.floor(startPct * len);
        const end = Math.floor(endFreqPct * len);
        let sum = 0;
        for (let i = start; i < end; i++) sum += dataArray[i];
        return (sum / (end - start || 1) / 255);
      };

      const bass = getAverage(0, 0.02) * 1.5;
      const lowMid = getAverage(0.02, 0.1) * 1.2;
      const mid = getAverage(0.1, 0.3);
      const high = getAverage(0.3, 0.6);
      
      let total = 0;
      for(let i = 0; i < len; i++) total += dataArray[i];
      const overall = total / len / 255;

      setAudioData({ bass, lowMid, mid, high, overall });

      animationFrameRef.current = requestAnimationFrame(updateData);
    };

    const startProcessing = () => {
      initAudio();
      updateData();
    };

    if (externalStream) {
      startProcessing();
    } else if (audioElement) {
      audioElement.addEventListener('play', startProcessing);
      audioElement.addEventListener('playing', startProcessing);
      if (!audioElement.paused) startProcessing();
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('play', startProcessing);
        audioElement.removeEventListener('playing', startProcessing);
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [audioElement, externalStream]);

  return audioData;
};
