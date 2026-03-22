"use client";

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';
import { useMindStore, BrainRegion } from '@/store/useMindStore';
import { AudioData } from '@/hooks/useAudioAnalyzer';
import { NeuralPathways } from './NeuralPathways';

const LOBES = [
  { id: 'PrefrontalCortex', side: 'L', pos: [-0.22, 0.4, 0.5], scale: [0.45, 0.65, 0.7], rot: [0.15, -0.05, 0.05], texture: 'broad' },
  { id: 'PrefrontalCortex', side: 'R', pos: [0.22, 0.4, 0.5], scale: [0.45, 0.65, 0.7], rot: [0.15, 0.05, -0.05], texture: 'broad' },
  { id: 'MotorCortex', side: 'L', pos: [-0.28, 0.6, 0.0], scale: [0.45, 0.5, 0.4], rot: [0, -0.05, 0.1], texture: 'tight' },
  { id: 'MotorCortex', side: 'R', pos: [0.28, 0.6, 0.0], scale: [0.45, 0.5, 0.4], rot: [0, 0.05, -0.1], texture: 'tight' },
  { id: 'ParietalLobe', side: 'L', pos: [-0.28, 0.4, -0.45], scale: [0.45, 0.6, 0.65], rot: [-0.2, -0.05, 0.05], texture: 'standard' },
  { id: 'ParietalLobe', side: 'R', pos: [0.28, 0.4, -0.45], scale: [0.45, 0.6, 0.65], rot: [-0.2, 0.05, -0.05], texture: 'standard' },
  { id: 'VisualCortex', side: 'L', pos: [-0.2, 0.0, -0.85], scale: [0.4, 0.55, 0.5], rot: [-0.4, -0.1, 0.05], texture: 'complex' },
  { id: 'VisualCortex', side: 'R', pos: [0.2, 0.0, -0.85], scale: [0.4, 0.55, 0.5], rot: [-0.4, 0.1, -0.05], texture: 'complex' },
  { id: 'AuditoryCortex', side: 'L', pos: [-0.5, -0.05, 0.1], scale: [0.3, 0.5, 0.7], rot: [0.05, 0.1, 0.3], texture: 'standard' },
  { id: 'AuditoryCortex', side: 'R', pos: [0.5, -0.05, 0.1], scale: [0.3, 0.5, 0.7], rot: [0.05, -0.1, -0.3], texture: 'standard' },
  { id: 'Cerebellum', side: 'L', pos: [-0.25, -0.4, -0.7], scale: [0.35, 0.35, 0.4], rot: [-0.6, -0.1, 0], texture: 'folia' },
  { id: 'Cerebellum', side: 'R', pos: [0.25, -0.4, -0.7], scale: [0.35, 0.35, 0.4], rot: [-0.6, 0.1, 0], texture: 'folia' },
  { id: 'Brainstem', side: 'C', pos: [0, -0.45, -0.15], scale: [0.25, 0.8, 0.25], rot: [0.1, 0, 0], texture: 'fibrous' },
  { id: 'CorpusCallosum', side: 'C', pos: [0, 0.1, 0], scale: [0.15, 0.3, 0.75], rot: [0, 0, 0], texture: 'fibrous' },
  { id: 'Amygdala', side: 'C', pos: [0, -0.1, 0.15], scale: [0.25, 0.25, 0.25], rot: [0, 0, 0], texture: 'standard' },
  { id: 'Hippocampus', side: 'C', pos: [0, -0.3, -0.15], scale: [0.2, 0.2, 0.4], rot: [-0.2, 0, 0], texture: 'standard' },
];

const ProceduralLobe = ({ data, audioData, isMobile }: { data: any, audioData: AudioData, isMobile: boolean }) => {
  const { setActiveRegion, activeRegion, getRegionInfo } = useMindStore();
  const { gl } = useThree();
  
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const dtiRef = useRef<THREE.LineSegments>(null);

  const originalPos = useMemo(() => new THREE.Vector3(...data.pos), [data]);

  const uniforms = useRef({
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uColor: { value: new THREE.Color('#3b82f6') }
  });

  const { geometry, edgesGeo, dtiGeo } = useMemo(() => {
    // LOD Optimization: 4 for mobile (80k total triangles), 7 for desktop (1M triangles)
    const detail = isMobile ? 4 : 7;
    const geo = new THREE.IcosahedronGeometry(1, data.texture === 'folia' && !isMobile ? detail + 1 : detail);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    
    const isLeft = data.side === 'L';
    const torque = isLeft ? 0.97 : 1.03;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= data.scale[0] * torque; v.y *= data.scale[1]; v.z *= data.scale[2];

      if (['L', 'R'].includes(data.side)) {
        const distToCenter = Math.abs(v.x + data.pos[0]);
        if (distToCenter < 0.15) v.x *= 0.05;
      }

      const gx = v.x + data.pos[0];
      const gy = v.y + data.pos[1];
      const gz = v.z + data.pos[2];

      let freq = 14.0; let amp = 0.05;
      if (data.texture === 'broad') { freq = 9.0; amp = 0.04; }
      else if (data.texture === 'tight') { freq = 20.0; amp = 0.05; }
      else if (data.texture === 'folia') { freq = 40.0; amp = 0.015; }
      else if (data.texture === 'fibrous') { freq = 30.0; amp = 0.02; }

      if (data.texture !== 'smooth') {
        const noise = Math.sin(gx * freq + Math.cos(gy * freq)) * 
                      Math.cos(gy * freq + Math.sin(gz * freq)) +
                      Math.sin(gz * freq + Math.cos(gx * freq));
        const fold = -Math.pow(Math.abs(noise), 0.6) * amp;
        v.addScaledVector(v.clone().normalize(), fold);
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    
    geo.computeVertexNormals();
    const edges = new THREE.EdgesGeometry(geo, isMobile ? 20 : 10);

    const dtiPoints = [];
    const globalCore = new THREE.Vector3(0, -0.1, 0);
    const localCore = globalCore.clone().sub(new THREE.Vector3(...data.pos));
    if (data.side !== 'C' && !isMobile) {
      for (let i = 0; i < pos.count; i += 15) {
        const start = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        const end = localCore.clone().lerp(start, 0.1);
        dtiPoints.push(start, end);
      }
    }
    const dti = new THREE.BufferGeometry().setFromPoints(dtiPoints);

    return { geometry: geo, edgesGeo: edges, dtiGeo: dti };
  }, [data, isMobile]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const activeInfo = getRegionInfo(activeRegion);
    const isPartActive = activeRegion === data.id;

    let intensity = 0;
    if (data.id === 'PrefrontalCortex') intensity = audioData.high;
    else if (data.id === 'AuditoryCortex') intensity = audioData.mid;
    else if (data.id === 'MotorCortex' || data.id === 'Cerebellum') intensity = audioData.bass;
    else intensity = audioData.overall;

    uniforms.current.uTime.value = time;
    uniforms.current.uIntensity.value = intensity;

    const targetPos = originalPos.clone();
    if (isPartActive) {
      const explode = originalPos.clone().normalize().multiplyScalar(0.45);
      if (data.id === 'Brainstem') explode.set(0, -0.4, 0);
      else if (data.id === 'CorpusCallosum') explode.set(0, 0.4, 0);
      targetPos.add(explode);
    }

    meshRef.current?.position.lerp(targetPos, 0.12);
    if (edgesRef.current) edgesRef.current.position.lerp(targetPos, 0.12);
    if (dtiRef.current) dtiRef.current.position.lerp(targetPos, 0.12);

    const baseColor = new THREE.Color('#3b82f6');
    const activeColor = (isPartActive && activeInfo) ? new THREE.Color(activeInfo.color) : baseColor;
    uniforms.current.uColor.value.lerp(activeColor, 0.1);

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, isPartActive ? 0.5 : 0.25, 0.1);
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, isPartActive ? 0.4 : intensity * 0.3, 0.1);
      mat.color.lerp(activeColor, 0.1);
      mat.emissive.lerp(activeColor, 0.1);
    }

    // Physical Breathing Expansion (Subtle on mobile)
    const scale = isPartActive ? 1.1 : (1.0 + intensity * (isMobile ? 0.02 : 0.05));
    meshRef.current?.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
  });

  return (
    <>
      <mesh 
        ref={meshRef} geometry={geometry} position={data.pos} rotation={data.rot}
        renderOrder={data.side === 'C' ? 1 : 10} 
        onPointerOver={(e) => { e.stopPropagation(); setActiveRegion(data.id as BrainRegion); }}
        onPointerOut={() => setActiveRegion(null)}
      >
        {isMobile ? (
          <meshStandardMaterial 
            transparent opacity={0.25} roughness={0.5} metalness={0.2}
            emissive="#3b82f6" emissiveIntensity={0} depthWrite={false} side={THREE.DoubleSide}
          />
        ) : (
          <meshPhysicalMaterial 
            color="#94a3b8" transmission={0.3} thickness={1.0} roughness={0.4} metalness={0.0}
            ior={1.45} clearcoat={0.5} clearcoatRoughness={0.2} emissiveIntensity={0}
            transparent={true} opacity={0.25} depthWrite={data.side === 'C'} side={THREE.DoubleSide}
            onBeforeCompile={(shader) => {
              shader.uniforms.uTime = uniforms.current.uTime;
              shader.uniforms.uIntensity = uniforms.current.uIntensity;
              shader.uniforms.uColor = uniforms.current.uColor;
              shader.fragmentShader = `
                uniform float uTime;
                uniform float uIntensity;
                uniform vec3 uColor;
                ${shader.fragmentShader}
              `.replace(
                `#include <common>`,
                `#include <common>
                 float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
                 float synapse(vec2 p) {
                   vec2 i = floor(p); vec2 f = fract(p);
                   f = f*f*(3.0-2.0*f);
                   return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
                 }
                `
              ).replace(
                `#include <emissivemap_fragment>`,
                `#include <emissivemap_fragment>
                 vec2 worldUv = vViewPosition.xy * 2.5;
                 float shimmer = synapse(worldUv + uTime * 1.2);
                 shimmer = pow(shimmer, 8.0) * (0.15 + uIntensity * 2.5);
                 totalEmissiveRadiance += uColor * shimmer;
                `
              );
            }}
          />
        )}
      </mesh>

      <lineSegments ref={edgesRef} geometry={edgesGeo} position={data.pos} rotation={data.rot} renderOrder={11}>
        <lineBasicMaterial transparent opacity={0.1} depthWrite={false} />
      </lineSegments>

      {!isMobile && (
        <lineSegments ref={dtiRef} geometry={dtiGeo} position={data.pos} rotation={data.rot} renderOrder={12}>
          <lineBasicMaterial transparent opacity={0.02} depthWrite={false} />
        </lineSegments>
      )}
    </>
  );
};

export const Brain = ({ audioData, isMobile, overrideScale }: { audioData: AudioData, isMobile: boolean, overrideScale: number }) => {
  return (
    <Center>
      <group scale={overrideScale} rotation={[0, -Math.PI / 2, 0]}>
        {LOBES.map((lobe, idx) => (
          <ProceduralLobe key={`${lobe.id}-${idx}`} data={lobe} audioData={audioData} isMobile={isMobile} />
        ))}
        <NeuralPathways audioData={audioData} />
      </group>
    </Center>
  );
};
