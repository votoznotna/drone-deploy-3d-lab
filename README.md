# DroneDeploy 3D Learning Lab (React + Three.js + R3F)

Hands-on lab to learn the basics needed for DroneDeploy's 3D visualization role. It includes:

- **PBR & Instancing**: lighting, shadows, orbit controls, and performance via instanced meshes.
  - _PBR = Physically Based Rendering_ (realistic material and lighting simulation)
- **GLTF Loading**: loads a sample glTF cube (`/public/models/mini-cube.gltf`) and shows how to replace it with real assets.
  - _GLTF = GL Transmission Format_ (universal 3D asset format, the "JPEG of 3D")
- **360° Environment + Measurement + Clipping**: equirectangular background, synthetic point cloud, a vertical clipping plane, and a two-click distance tool (raycasting).

## Tech

- React + Vite + TypeScript
- three.js + @react-three/fiber + @react-three/drei

## Install & Run

```bash
# Node 18+ recommended
npm ci || npm install
npm run dev
# open the printed local URL
```

## How to Use

1. **Click the tabs** to switch between the three different 3D scenes
2. **Mouse controls:**
   - Left-click + drag = orbit around the scene
   - Scroll wheel = zoom in/out
   - Right-click + drag = pan the camera
3. **In Tab 3 (360° + Measure):**
   - Use the **slider below the viewport** to adjust the clipping plane (you should see objects being sliced horizontally)
   - **Click any two points** on the geometry to measure distance between them

## Project Structure

```
public/
  env/pano.jpg               # sample equirectangular panorama
  models/mini-cube.gltf      # tiny glTF with normals
  models/mini-cube.bin       # its buffer
src/
  App.tsx                    # three scenes (tabs)
  main.tsx                   # React entry
  styles.css                 # minimal styling
index.html
```

## What Each Tab Demonstrates

### Tab 1: PBR & Instancing

**What it shows:** Performance optimization and realistic lighting

- **100 animated boxes** rendered efficiently using instanced meshes (1 draw call instead of 100)
- **Physically Based Rendering (PBR)** with realistic materials, shadows, and lighting
- **Dynamic animation** - each box moves and rotates independently in real-time
- **Why this matters:** Shows you understand performance optimization and modern 3D rendering techniques

### Tab 2: GLTF Loader

**What it shows:** 3D asset pipeline and environment mapping

- **GLTF model loading** - industry standard format for 3D assets
- **360° environment mapping** - realistic reflections and lighting from panoramic background
- **Asset management** - demonstrates how to integrate external 3D models into your scene
- **Why this matters:** Core skill for any 3D visualization role - loading real-world assets

### Tab 3: 360° + Measure

**What it shows:** Spatial data visualization and user interaction

- **Point cloud rendering** - 30,000 colored points representing 3D scan data
- **Clipping plane** - slice through 3D data to see cross-sections (use slider below viewport)
- **Measurement tool** - click any two points to measure distance (essential for construction/surveying)
- **Raycasting** - precise 3D point selection from 2D mouse clicks
- **Why this matters:** Core functionality for drone mapping, construction, and surveying applications

## Replace with real assets

- Put your GLTF/GLB files under `public/models/` and change the path in `src/App.tsx` (the `useGLTF('/models/your.glb')`).
- Drop real panoramas (`4096×2048` equirectangular JPGs) under `public/env/` and update the `Environment files` prop.

## Key Technical Concepts

- **Performance**: instancing vs. individual meshes; material count; texture size; `StatsGl` overlay.
- **Picking/Raycasting**: selection & measurement; future annotations.
- **Spatial data**: point clouds, clipping planes; how you'd ingest LiDAR/BIM (tiling, LODs, decimation).
- **Roadmap**: GLTF streaming, KTX2 compressed textures, DRACO/meshopt, and intro to **gaussian splatting** for dense scans.

## Notes

- This is a minimal lab. For production, consider: requestAnimationFrame budget, asset streaming, cache policies, GPU memory caps, and error handling.
- If you see blank background on older GPUs, remove `Environment` or reduce image size.
