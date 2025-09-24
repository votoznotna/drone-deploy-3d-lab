import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  StatsGl,
  GizmoHelper,
  GizmoViewport,
  Environment,
  useGLTF,
  Line,
} from '@react-three/drei';
import * as THREE from 'three';
function Viewport({ children }: { children: React.ReactNode }) {
  return (
    <div className='viewport card'>
      <Canvas
        shadows
        camera={{ position: [6, 5, 8], fov: 55 }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>
        <OrbitControls makeDefault />
        <GizmoHelper alignment='bottom-right' margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#ef4444', '#22c55e', '#3b82f6']}
            labelColor='white'
          />
        </GizmoHelper>
        <StatsGl />
      </Canvas>
    </div>
  );
}
function SpinningInstancedGrid() {
  const count = 100;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const x = (i % 10) - 4.5,
        y = Math.floor(i / 10) - 4.5;
      dummy.position.set(x * 1.2, Math.sin(t + i * 0.1) * 0.3, y * 1.2);
      dummy.rotation.set(t * 0.2 + i * 0.01, t * 0.3 + i * 0.01, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as any, undefined as any, count]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 0.2, 1]} />
      <meshStandardMaterial metalness={0.2} roughness={0.6} color={'#7dd3fc'} />
    </instancedMesh>
  );
}
function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={'#0b0f16'} roughness={1} />
      </mesh>
      <gridHelper args={[200, 200, '#3b82f6', '#1f2937']} />
    </group>
  );
}
function ScenePBR() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} castShadow intensity={1.2} />
      <SpinningInstancedGrid />
      <Ground />
    </>
  );
}
function GltfModel(props: any) {
  const gltf = useGLTF('/models/mini-cube.gltf');
  return <primitive object={gltf.scene} {...props} />;
}
function SceneGLTF() {
  return (
    <>
      <hemisphereLight intensity={0.8} />
      <Environment files={'/env/pano.jpg'} background />
      <GltfModel position={[0, 0, 0]} />
    </>
  );
}
function PointCloud({ count = 30000 }: { count?: number }) {
  const geom = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 10 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (Math.random() - 0.5) * 6;
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions.set([x, y, z], i * 3);
      color.setHSL((y + 3) / 6, 0.6, 0.5);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    return { positions, colors };
  }, [count]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach='attributes-position'
          array={geom.positions}
          count={geom.positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach='attributes-color'
          array={geom.colors}
          count={geom.colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} vertexColors depthWrite={false} />
    </points>
  );
}
function ClippingPlane({ clip }: { clip: number }) {
  const { scene } = useThree();
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -clip),
    [clip]
  );

  // Apply clipping plane to all materials in the scene
  useMemo(() => {
    scene.traverse((obj: any) => {
      if (obj.material) {
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        mats.forEach((m: any) => {
          m.clippingPlanes = [plane];
          m.needsUpdate = true;
        });
      }
    });
  }, [scene, plane]);

  return null;
}
function MeasureTool() {
  const [pts, setPts] = useState<THREE.Vector3[]>([]);
  const [dist, setDist] = useState(0);
  const { camera, scene, size } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const onDown = (e: any) => {
    const ndc = new THREE.Vector2(
      (e.clientX / size.width) * 2 - 1,
      -(e.clientY / size.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    const hit = hits.find((h) => (h.object as any).isMesh);
    if (hit) {
      const p = hit.point.clone();
      setPts((prev) => {
        const next = [...prev, p].slice(-2);
        if (next.length === 2) setDist(next[0].distanceTo(next[1]));
        return next;
      });
    }
  };
  return (
    <group onPointerDown={onDown as any}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={i === 0 ? '#22c55e' : '#ef4444'} />
        </mesh>
      ))}
      {pts.length === 2 && (
        <Line points={[pts[0], pts[1]]} lineWidth={2} color={'#fde047'} />
      )}
    </group>
  );
}
function ScenePanoMeasure({ clip }: { clip: number }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 8, 5]} intensity={1} />
      <Environment files={'/env/pano.jpg'} background />
      <mesh
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={'#1f2937'} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color={'#4f46e5'} />
      </mesh>
      <mesh castShadow position={[3, 1.5, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color={'#ef4444'} />
      </mesh>
      <mesh castShadow position={[-3, 2, 0]}>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshStandardMaterial color={'#22c55e'} />
      </mesh>
      <PointCloud />
      <ClippingPlane clip={clip} />
      <MeasureTool />
      {/* Visual indicator of clipping plane position */}
      <mesh position={[0, clip, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial
          color={'#ffff00'}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}
export default function App() {
  const [tab, setTab] = useState<'pbr' | 'gltf' | 'pano'>('pbr');
  const [clip, setClip] = useState(0);

  return (
    <div className='app'>
      <h1>DroneDeploy 3D Learning Lab</h1>
      <div className='card'>
        <div className='row'>
          <button
            className={'tab ' + (tab === 'pbr' ? 'active' : '')}
            onClick={() => setTab('pbr')}
          >
            PBR & Instancing
          </button>
          <button
            className={'tab ' + (tab === 'gltf' ? 'active' : '')}
            onClick={() => setTab('gltf')}
          >
            GLTF Loader
          </button>
          <button
            className={'tab ' + (tab === 'pano' ? 'active' : '')}
            onClick={() => setTab('pano')}
          >
            360° + Measure
          </button>
        </div>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Core 3D visualization features: lighting and instancing, GLTF
          ingestion (with an included sample), and 360° environment with
          measurement + clipping.
        </p>
      </div>

      {tab === 'pbr' && (
        <Viewport>
          <ScenePBR />
        </Viewport>
      )}
      {tab === 'gltf' && (
        <Viewport>
          <SceneGLTF />
        </Viewport>
      )}
      {tab === 'pano' && (
        <>
          <Viewport>
            <ScenePanoMeasure clip={clip} />
          </Viewport>
          <div className='card'>
            <div className='hud'>
              <div>Clipping height: {clip.toFixed(2)}</div>
              <input
                className='slider'
                type='range'
                min='-5'
                max='5'
                step='.1'
                value={clip}
                onChange={(e) =>
                  setClip(parseFloat((e.target as HTMLInputElement).value))
                }
              />
            </div>
          </div>
        </>
      )}

      <div className='card'>
        <h3>Tips</h3>
        <ul>
          <li>
            <b>Controls:</b> drag to orbit, <kbd>scroll</kbd> to zoom,{' '}
            <kbd>right-drag</kbd> to pan.
          </li>
          <li>
            <b>Raycasting:</b> click any two points on geometry in the "360° +
            Measure" tab to get a distance line.
          </li>
          <li>
            <b>Next steps:</b> Replace <code>/models/mini-cube.gltf</code> with
            real GLB/GLTF assets; drop in real panoramas to{' '}
            <code>public/env</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
