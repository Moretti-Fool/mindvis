# MindVis 3D 🧠✨
### *High-Fidelity Neural Audio Visualizer*

**MindVis 3D** is a professional-grade, medically-inspired neuro-simulation that transforms auditory data into a living biological narrative. Built with a focus on procedural geometry and high-performance graphics, it provides a real-time window into how the human brain processes sound.

---

## 🌟 Key Features

### 🧬 Procedural Neuro-Anatomy
Unlike static 3D models, MindVis 3D generates its anatomy using mathematical algorithms. 
- **13 Distinct Lobes:** Real-time generation of the Prefrontal Cortex, Motor Cortex, Temporal Lobes, Cerebellum, and the deep Limbic Core.
- **Organic Morphology:** Uses Voronoi-like winding noise and **Yakovlevian Torque** to simulate the unique, asymmetrical "Walnut" structure of a real human brain.
- **Volumetric Breathing:** Surface gyri (ridges) physically expand and contract based on audio intensity.

### ⚡ Hierarchical Auditory Flow
The system mirrors actual biological signal propagation:
- **Sequential Propagation:** Sound enters via the **Brainstem**, triggers the **Auditory Cortex**, and then "fans out" to specialized regions (Motor, Frontal, Visual) with millisecond-perfect timing.
- **DTI Fiber Bundles:** Visualizes internal white-matter connections that glow as electrical impulses travel through the core.

### 🎙️ Universal Input Engine
- **File Mode:** Drag-and-drop high-fidelity MP3/WAV/OGG files for crystal-clear visualization.
- **Live Mode:** Real-time system loopback support. Connect to **Spotify, YouTube, or Netflix** by using "Stereo Mix" or Microphone input.
- **Privacy First:** All audio processing is handled locally in browser RAM. No audio data ever leaves your machine.

### 📊 Neural Activity Monitor
A custom-engineered 2D dashboard that uses the same "Synaptic Node" language as the 3D scene.
- **Direct-DOM Animation:** Bypasses React's render cycle using CSS variables and `requestAnimationFrame` for zero-latency, 60FPS synchronization.
- **Frequency Analysis:** Real-time monitoring of Bass, Low-Mid, Mid, and High frequency bands.

### 🔬 Interactive Dissection
- **Slice-Out Logic:** Hovering over any brain region physically "dissects" that part, sliding it outward to reveal the internal neural architecture and DTI fibers.
- **Semantic Tooltips:** Dynamic information mapping for every functional region of the brain.

---

## 🛠️ Technical Stack

- **Framework:** Next.js 15 (App Router)
- **Library:** React 19
- **3D Engine:** Three.js / React Three Fiber
- **State Management:** Zustand
- **Shaders:** Custom GLSL (Neural Shimmer & Volumetric Displacement)
- **Styling:** Tailwind CSS 4
- **Analytics:** Vercel Analytics

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- A modern browser with WebGL 2.0 support

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Moretti-Fool/mindvis.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💡 Usage Tips for Spotify/YouTube
To visualize external apps on Windows:
1. Open **Control Panel > Sound > Recording**.
2. Right-click and select **Show Disabled Devices**.
3. Enable **Stereo Mix** and set it as the Default Device.
4. Click the **Mic Icon** in MindVis 3D and enjoy!

---

## 📜 License
MIT License - Created for developers, scientists, and musicians.

---
*Developed with scientific curiosity and high-performance engineering.*
