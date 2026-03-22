import { create } from 'zustand';

export type BrainRegion = 
  | 'AuditoryCortex' 
  | 'Hippocampus' 
  | 'Amygdala' 
  | 'NucleusAccumbens' 
  | 'PrefrontalCortex' 
  | 'MotorCortex' 
  | 'VisualCortex'
  | 'ParietalLobe'
  | 'Cerebellum'
  | 'Brainstem'
  | 'CorpusCallosum'
  | null;

interface BrainRegionData {
  name: string;
  description: string;
  color: string;
}

const REGION_INFO: Record<string, BrainRegionData> = {
  AuditoryCortex: {
    name: "Auditory Cortex (Temporal Lobe)",
    description: "The gateway of sound. Processes pitch, volume, and complex rhythm patterns.",
    color: "#3b82f6"
  },
  Hippocampus: {
    name: "Hippocampus",
    description: "Connects music to your history. Recalls memories and predicts musical sequences.",
    color: "#8b5cf6"
  },
  Amygdala: {
    name: "Amygdala / Limbic System",
    description: "The emotional core. Triggers chills, joy, or nostalgia in response to melodies.",
    color: "#f59e0b"
  },
  NucleusAccumbens: {
    name: "Nucleus Accumbens",
    description: "The reward center. Releases dopamine when you hear music you find pleasurable.",
    color: "#ec4899"
  },
  PrefrontalCortex: {
    name: "Prefrontal Cortex (Frontal Lobe)",
    description: "The analyzer. Deciphers complex musical structures, expectations, and patterns.",
    color: "#10b981"
  },
  MotorCortex: {
    name: "Motor Cortex",
    description: "Synchronizes rhythm. Triggers the physical urge to tap your feet or dance along.",
    color: "#ef4444"
  },
  VisualCortex: {
    name: "Visual Cortex (Occipital Lobe)",
    description: "Processes musical imagery and helps visualize the 'story' behind the sound.",
    color: "#ffffff"
  },
  ParietalLobe: {
    name: "Parietal Lobe",
    description: "Integrates sensory information and spatial awareness while listening.",
    color: "#a855f7"
  },
  Cerebellum: {
    name: "Cerebellum",
    description: "The 'little brain'. Controls motor timing, precision, and coordination of rhythm.",
    color: "#fb923c"
  },
  Brainstem: {
    name: "Brainstem",
    description: "The base of life. Regulates heartbeat, breathing, and the autonomic response to sound.",
    color: "#94a3b8"
  },
  CorpusCallosum: {
    name: "Corpus Callosum",
    description: "The grand bridge. Facilitates communication between the left and right hemispheres.",
    color: "#facc15"
  }
};

interface MindStore {
  activeRegion: BrainRegion;
  setActiveRegion: (region: BrainRegion) => void;
  getRegionInfo: (region: BrainRegion) => BrainRegionData | null;
}

export const useMindStore = create<MindStore>((set) => ({
  activeRegion: null,
  setActiveRegion: (region) => set({ activeRegion: region }),
  getRegionInfo: (region) => region ? REGION_INFO[region] : null,
}));
