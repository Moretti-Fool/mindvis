"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioData } from '@/hooks/useAudioAnalyzer';
import { useMindStore, BrainRegion } from '@/store/useMindStore';

interface PathwayProps {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startRegionId: BrainRegion;
  endRegionId: BrainRegion;
  color: string;
  audioValue: number;
  sequenceDelay: number; // 0 for Stage 1, higher for Stage 2
  isLeft: boolean;
  count?: number;
}

const SequentialPathway = ({ startPos, endPos, startRegionId, endRegionId, color, audioValue, sequenceDelay, isLeft, count = 8 }: PathwayProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.Line>(null);
  const { activeRegion } = useMindStore();
  
  const curStart = useRef(startPos.clone());
  const curEnd = useRef(endPos.clone());

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      t: Math.random(),
      speed: 0.001 + Math.random() * 0.002,
      size: 0.004 + Math.random() * 0.008,
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // --- 1. Dynamic Anchor Tracking (Slice-Out Sync) ---
    const targetStart = startPos.clone();
    const targetEnd = endPos.clone();

    // Source Tracking
    if (activeRegion === startRegionId) {
      const explode = startPos.clone().normalize().multiplyScalar(0.45);
      if (startRegionId === 'Brainstem') explode.set(0, -0.4, 0);
      targetStart.add(explode);
    }
    // Target Tracking
    if (activeRegion === endRegionId) {
      const explode = endPos.clone().normalize().multiplyScalar(0.45);
      targetEnd.add(explode);
    }

    curStart.current.lerp(targetStart, 0.12);
    curEnd.current.lerp(targetEnd, 0.12);

    // Re-calculate curve
    const mid = new THREE.Vector3().addVectors(curStart.current, curEnd.current).multiplyScalar(0.5);
    mid.multiplyScalar(0.4); // Deep internal routing
    const curve = new THREE.CatmullRomCurve3([curStart.current, mid, curEnd.current]);

    // --- 2. Sequential Wave Logic ---
    const time = state.clock.elapsedTime;
    
    particles.forEach((p, i) => {
      const flowSpeed = (0.5 + audioValue * 12);
      p.t += (p.speed * flowSpeed);
      if (p.t > 1) p.t = 0;

      // The delay effect: stagger visibility to show sequence
      const sequencePhase = (time - sequenceDelay) % 1.5;
      const isVisible = sequencePhase > 0 && sequencePhase < 1.2;

      const pos = curve.getPoint(p.t);
      dummy.position.copy(pos);
      
      const s = isVisible ? p.size * (1 + audioValue * 3) : 0;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      const intensityScale = sequenceDelay > 0 ? 3.0 : 5.0; // Stage 1 is brighter (Raw Input)
      meshRef.current.material.emissiveIntensity = intensityScale + audioValue * 15;
      meshRef.current.material.opacity = 0.3 + audioValue * 0.7;
      meshRef.current.material.color.lerp(new THREE.Color(color), 0.1);
      meshRef.current.material.emissive.lerp(new THREE.Color(color), 0.1);
    }

    if (lineRef.current) {
      const points = curve.getPoints(25);
      lineRef.current.geometry.setFromPoints(points);
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = 0.01 + audioValue * 0.05;
    }
  });

  return (
    <group renderOrder={10}>
      <line ref={lineRef as any}>
        <bufferGeometry />
        <lineBasicMaterial color={color} transparent opacity={0.02} depthTest={false} blending={THREE.AdditiveBlending} />
      </line>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={11}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial color={color} emissive={color} transparent depthTest={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </group>
  );
};

export const NeuralPathways = ({ audioData }: { audioData: AudioData }) => {
  const { getRegionInfo } = useMindStore();

  const getCoords = (arr: number[], side: 'L' | 'R' | 'C') => {
    const v = new THREE.Vector3(...arr);
    const torque = side === 'L' ? 0.97 : (side === 'R' ? 1.03 : 1);
    v.x *= torque;
    return v;
  };

  const core = {
    brainstem: [0, -0.55, -0.2],
    temporalL: [-0.5, -0.05, 0.1],
    temporalR: [0.5, -0.05, 0.1],
    frontalL: [-0.22, 0.4, 0.5],
    frontalR: [0.22, 0.4, 0.5],
    motorL: [-0.28, 0.6, 0.0],
    motorR: [0.28, 0.6, 0.0],
    parietalL: [-0.28, 0.4, -0.45],
    parietalR: [0.28, 0.4, -0.45],
    visualL: [-0.2, 0.0, -0.85],
    visualR: [0.2, 0.0, -0.85],
    amygdala: [0, -0.1, 0.15],
  };

  const colors = {
    input: "#fff7ed", 
    frontal: getRegionInfo('PrefrontalCortex')?.color || "#10b981",
    motor: getRegionInfo('MotorCortex')?.color || "#ef4444",
    parietal: getRegionInfo('ParietalLobe')?.color || "#a855f7",
    visual: getRegionInfo('VisualCortex')?.color || "#ffffff",
    amygdala: getRegionInfo('Amygdala')?.color || "#f59e0b",
  };

  return (
    <group>
      {/* STAGE 1: Input (Brainstem -> Temporal Lobes) */}
      <SequentialPathway 
        startPos={getCoords(core.brainstem, 'C')} endPos={getCoords(core.temporalL, 'L')} 
        startRegionId="Brainstem" endRegionId="AuditoryCortex"
        color={colors.input} audioValue={audioData.overall} sequenceDelay={0} isLeft={true} count={12}
      />
      <SequentialPathway 
        startPos={getCoords(core.brainstem, 'C')} endPos={getCoords(core.temporalR, 'R')} 
        startRegionId="Brainstem" endRegionId="AuditoryCortex"
        color={colors.input} audioValue={audioData.overall} sequenceDelay={0} isLeft={false} count={12}
      />

      {/* STAGE 2: Distribution (Temporal -> Functional Lobes) */}
      <SequentialPathway 
        startPos={getCoords(core.temporalL, 'L')} endPos={getCoords(core.frontalL, 'L')} 
        startRegionId="AuditoryCortex" endRegionId="PrefrontalCortex"
        color={colors.frontal} audioValue={audioData.high} sequenceDelay={0.2} isLeft={true} 
      />
      <SequentialPathway 
        startPos={getCoords(core.temporalR, 'R')} endPos={getCoords(core.frontalR, 'R')} 
        startRegionId="AuditoryCortex" endRegionId="PrefrontalCortex"
        color={colors.frontal} audioValue={audioData.high} sequenceDelay={0.2} isLeft={false} 
      />

      <SequentialPathway 
        startPos={getCoords(core.temporalL, 'L')} endPos={getCoords(core.motorL, 'L')} 
        startRegionId="AuditoryCortex" endRegionId="MotorCortex"
        color={colors.motor} audioValue={audioData.bass} sequenceDelay={0.15} isLeft={true} 
      />
      <SequentialPathway 
        startPos={getCoords(core.temporalR, 'R')} endPos={getCoords(core.motorR, 'R')} 
        startRegionId="AuditoryCortex" endRegionId="MotorCortex"
        color={colors.motor} audioValue={audioData.bass} sequenceDelay={0.15} isLeft={false} 
      />

      <SequentialPathway 
        startPos={getCoords(core.temporalL, 'L')} endPos={getCoords(core.amygdala, 'C')} 
        startRegionId="AuditoryCortex" endRegionId="Amygdala"
        color={colors.amygdala} audioValue={audioData.mid} sequenceDelay={0.25} isLeft={true} 
      />
      <SequentialPathway 
        startPos={getCoords(core.temporalR, 'R')} endPos={getCoords(core.amygdala, 'C')} 
        startRegionId="AuditoryCortex" endRegionId="Amygdala"
        color={colors.amygdala} audioValue={audioData.mid} sequenceDelay={0.25} isLeft={false} 
      />

      <SequentialPathway 
        startPos={getCoords(core.temporalL, 'L')} endPos={getCoords(core.visualL, 'L')} 
        startRegionId="AuditoryCortex" endRegionId="VisualCortex"
        color={colors.visual} audioValue={audioData.overall} sequenceDelay={0.3} isLeft={true} 
      />
      <SequentialPathway 
        startPos={getCoords(core.temporalR, 'R')} endPos={getCoords(core.visualR, 'R')} 
        startRegionId="AuditoryCortex" endRegionId="VisualCortex"
        color={colors.visual} audioValue={audioData.overall} sequenceDelay={0.3} isLeft={false} 
      />
    </group>
  );
};
