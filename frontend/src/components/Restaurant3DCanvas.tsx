import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Table3DData {
  id: string;
  number: number;
  name: string;
  status: 'available' | 'seated' | 'ready' | 'reserved' | 'cleaning';
  capacity: number;
  currentParty?: string;
  waitTimeMins?: number;
  position: [number, number, number];
  zone: 'main' | 'vip' | 'bar' | 'terrace';
  vibeTag: string;
  popularDish: string;
}

const INITIAL_TABLES: Table3DData[] = [
  { id: 't1', number: 1, name: 'Table 01', status: 'ready', capacity: 2, currentParty: 'Sharma (2)', waitTimeMins: 0, position: [-4.5, 0, -2], zone: 'main', vibeTag: 'Romantic Window View', popularDish: 'Woodfired Truffle Pizza' },
  { id: 't2', number: 2, name: 'Table 02', status: 'seated', capacity: 4, currentParty: 'Verma (4)', waitTimeMins: 12, position: [-1.5, 0, -3.5], zone: 'main', vibeTag: 'Cozy Family Booth', popularDish: 'Charcoal Grilled Tikka' },
  { id: 't3', number: 3, name: 'Table 03', status: 'available', capacity: 4, waitTimeMins: 0, position: [1.5, 0, -3.5], zone: 'main', vibeTag: 'Central Lounge', popularDish: 'Artisanal Mocktail' },
  { id: 't4', number: 4, name: 'Table 04', status: 'seated', capacity: 6, currentParty: 'Kapoor (5)', waitTimeMins: 25, position: [4.5, 0, -2], zone: 'main', vibeTag: 'Grand Feast Table', popularDish: 'Smoked Butter Chicken' },
  { id: 't5', number: 5, name: 'VIP Booth 1', status: 'reserved', capacity: 8, currentParty: 'Mehta VIP', waitTimeMins: 5, position: [-5, 0, 2], zone: 'vip', vibeTag: 'VIP Executive Lounge', popularDish: 'Lobster & Steak Platter' },
  { id: 't6', number: 6, name: 'Chef Counter A', status: 'ready', capacity: 2, currentParty: 'Rao (2)', waitTimeMins: 0, position: [-1.5, 0, 2.5], zone: 'bar', vibeTag: "Chef's Omakase Bar", popularDish: 'Handrolled Sushi Roll' },
  { id: 't7', number: 7, name: 'Chef Counter B', status: 'seated', capacity: 2, currentParty: 'Singhania (2)', waitTimeMins: 18, position: [1.5, 0, 2.5], zone: 'bar', vibeTag: 'Live Cocktail Station', popularDish: 'Smoked Bourbon Sour' },
  { id: 't8', number: 8, name: 'Terrace Suite', status: 'available', capacity: 4, waitTimeMins: 0, position: [5, 0, 2], zone: 'terrace', vibeTag: 'Sunset Skyline View', popularDish: 'Truffle Pasta & Wine' },
];

interface Props {
  onSelectTable?: (table: Table3DData) => void;
  activeQueueCount?: number;
}

export default function Restaurant3DCanvas({ onSelectTable, activeQueueCount = 8 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedTable, setSelectedTable] = useState<Table3DData | null>(INITIAL_TABLES[0]);
  const [hoveredTable, setHoveredTable] = useState<Table3DData | null>(null);
  const [currentZone, setCurrentZone] = useState<'all' | 'main' | 'vip' | 'bar' | 'terrace'>('all');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 7.5, 9.5));
  const targetCamLookRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentCamLookRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const tableGroupMapRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0908);
    scene.fog = new THREE.FogExp2(0x0a0908, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 9.5);
    cameraRef.current = camera;
    camera.lookAt(0, 0, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    // 3. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.6);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffb74d, 3.5);
    mainSpot.position.set(0, 12, 4);
    mainSpot.angle = Math.PI / 3;
    mainSpot.penumbra = 0.8;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    cyanRimLight.position.set(-8, 6, -6);
    scene.add(cyanRimLight);

    const goldRimLight = new THREE.DirectionalLight(0xf59e0b, 1.2);
    goldRimLight.position.set(8, 6, -6);
    scene.add(goldRimLight);

    // 4. FLOORS
    const floorGeo = new THREE.PlaneGeometry(24, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x141210,
      roughness: 0.25,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0xf59e0b, 0x262420);
    grid.position.y = -0.49;
    scene.add(grid);

    // 5. CENTER HOLOGRAM PODIUM
    const podiumGroup = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.4, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f1912, metalness: 0.8, roughness: 0.2 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.3;
    baseMesh.receiveShadow = true;
    podiumGroup.add(baseMesh);

    const ringGeo = new THREE.TorusGeometry(1.1, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.08;
    podiumGroup.add(ringMesh);

    const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.5,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = 0.65;
    crystalMesh.castShadow = true;
    podiumGroup.add(crystalMesh);

    const beamGeo = new THREE.CylinderGeometry(0.8, 0.2, 2.5, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 1.0;
    podiumGroup.add(beamMesh);

    scene.add(podiumGroup);

    // 6. CREATING 3D TABLES
    const createTable3D = (tableData: Table3DData) => {
      const group = new THREE.Group();
      group.position.set(...tableData.position);
      group.userData = { tableData };

      let accentColor = 0x10b981;
      if (tableData.status === 'seated') accentColor = 0x3b82f6;
      if (tableData.status === 'ready') accentColor = 0xf59e0b;
      if (tableData.status === 'reserved') accentColor = 0x8b5cf6;
      if (tableData.status === 'cleaning') accentColor = 0xf43f5e;

      const pedestalGeo = new THREE.CylinderGeometry(0.12, 0.35, 1.0, 16);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x2b2621, metalness: 0.7, roughness: 0.3 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = 0;
      pedestal.castShadow = true;
      group.add(pedestal);

      const isLarge = tableData.capacity > 4;
      const topGeo = isLarge
        ? new THREE.BoxGeometry(1.8, 0.1, 1.1)
        : new THREE.CylinderGeometry(0.75, 0.75, 0.1, 32);

      const topMat = new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.2,
        metalness: 0.3,
      });
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.y = 0.5;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      const rimGeo = isLarge
        ? new THREE.BoxGeometry(1.84, 0.02, 1.14)
        : new THREE.CylinderGeometry(0.77, 0.77, 0.02, 32);
      const rimMat = new THREE.MeshBasicMaterial({ color: accentColor });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.y = 0.45;
      group.add(rimMesh);

      const chairCount = tableData.capacity;
      for (let i = 0; i < chairCount; i++) {
        const angle = (i / chairCount) * Math.PI * 2;
        const radius = isLarge ? 0.95 : 0.9;
        const cx = Math.cos(angle) * radius;
        const cz = Math.sin(angle) * radius;

        const chairGeo = new THREE.BoxGeometry(0.35, 0.45, 0.35);
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.6 });
        const chair = new THREE.Mesh(chairGeo, chairMat);
        chair.position.set(cx, 0.225, cz);
        chair.rotation.y = -angle - Math.PI / 2;
        chair.castShadow = true;
        group.add(chair);
      }

      const clocheGeo = new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const clocheMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
      const cloche = new THREE.Mesh(clocheGeo, clocheMat);
      cloche.position.set(0, 0.55, 0);
      cloche.castShadow = true;
      group.add(cloche);

      const badgeGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const badgeMat = new THREE.MeshBasicMaterial({ color: accentColor });
      const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
      badgeMesh.position.set(0, 1.25, 0);
      badgeMesh.name = 'statusBadge';
      group.add(badgeMesh);

      scene.add(group);
      tableGroupMapRef.current.set(tableData.id, group);
    };

    INITIAL_TABLES.forEach(createTable3D);

    // 7. PARTICLES
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 20;
      particlePositions[i * 3 + 1] = Math.random() * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: 0.005 + Math.random() * 0.012,
        z: (Math.random() - 0.5) * 0.008,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.09,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 8. RAYCASTING
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (currentZone === 'all') {
        targetCamPosRef.current.x = mouse.x * 1.5;
        targetCamPosRef.current.z = 9.5 + mouse.y * 0.8;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let foundTable: Table3DData | null = null;
      for (const hit of intersects) {
        let parent: THREE.Object3D | null = hit.object;
        while (parent) {
          if (parent.userData && parent.userData.tableData) {
            foundTable = parent.userData.tableData;
            break;
          }
          parent = parent.parent;
        }
        if (foundTable) break;
      }

      setHoveredTable(foundTable);
      container.style.cursor = foundTable ? 'pointer' : 'default';
    };

    const handlePointerClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let parent: THREE.Object3D | null = hit.object;
        while (parent) {
          if (parent.userData && parent.userData.tableData) {
            const table = parent.userData.tableData as Table3DData;
            setSelectedTable(table);
            if (onSelectTable) onSelectTable(table);
            targetCamLookRef.current.set(table.position[0], 0.5, table.position[2]);
            return;
          }
          parent = parent.parent;
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerClick);

    // 9. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      crystalMesh.rotation.y = elapsedTime * 0.8;
      crystalMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2;
      crystalMesh.position.y = 0.65 + Math.sin(elapsedTime * 2) * 0.08;

      tableGroupMapRef.current.forEach((grp, id) => {
        const badge = grp.getObjectByName('statusBadge');
        if (badge) {
          badge.position.y = 1.25 + Math.sin(elapsedTime * 3 + grp.position.x) * 0.06;
        }
        const isHovered = hoveredTable?.id === id;
        const targetScale = isHovered ? 1.12 : 1.0;
        grp.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      });

      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleVelocities[i].y;
        positions[i * 3] += particleVelocities[i].x;

        if (positions[i * 3 + 1] > 8) {
          positions[i * 3 + 1] = 0;
          positions[i * 3] = (Math.random() - 0.5) * 20;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      camera.position.lerp(targetCamPosRef.current, 0.05);
      currentCamLookRef.current.lerp(targetCamLookRef.current, 0.05);
      camera.lookAt(currentCamLookRef.current);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerClick);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const handleZoneChange = (zone: 'all' | 'main' | 'vip' | 'bar' | 'terrace') => {
    setCurrentZone(zone);
    if (!cameraRef.current) return;

    if (zone === 'all') {
      targetCamPosRef.current.set(0, 7.5, 9.5);
      targetCamLookRef.current.set(0, 0, 0);
    } else if (zone === 'main') {
      targetCamPosRef.current.set(0, 5.5, 5);
      targetCamLookRef.current.set(0, 0, -2.5);
    } else if (zone === 'vip') {
      targetCamPosRef.current.set(-6, 4.5, 4.5);
      targetCamLookRef.current.set(-5, 0, 2);
    } else if (zone === 'bar') {
      targetCamPosRef.current.set(0, 4.2, 5.2);
      targetCamLookRef.current.set(0, 0, 2.5);
    } else if (zone === 'terrace') {
      targetCamPosRef.current.set(6, 4.5, 4.5);
      targetCamLookRef.current.set(5, 0, 2);
    }
  };

  const activeTable = hoveredTable || selectedTable;

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden border border-amber-500/30 bg-stone-950 shadow-2xl shadow-amber-950/40 group">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Glassmorphism Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        <div className="bg-stone-900/80 backdrop-blur-xl border border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-lg pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">3D Live Floor View</div>
            <div className="text-xs text-stone-300 font-medium">Interactive Waitlist & Table Map</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 px-4 py-2 rounded-2xl font-black text-xs shadow-xl flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-stone-950 animate-pulse" />
          <span>{activeQueueCount} Guests Waiting Live</span>
        </div>
      </div>

      {/* Zone Navigation Pills Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-950/85 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl z-10">
        {[
          { id: 'all', label: 'Full Floor' },
          { id: 'main', label: 'Main Dining' },
          { id: 'vip', label: 'VIP Booths' },
          { id: 'bar', label: "Chef's Bar" },
          { id: 'terrace', label: 'Terrace' },
        ].map((z) => (
          <button
            key={z.id}
            onClick={() => handleZoneChange(z.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              currentZone === z.id
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-md scale-105'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>

      {/* Selected / Hovered Table Floating Glass Inspector Card */}
      {activeTable && (
        <div className="absolute top-20 right-4 w-72 bg-stone-900/90 backdrop-blur-2xl border border-amber-500/40 p-4 rounded-2xl shadow-2xl text-white space-y-3 z-10 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {activeTable.zone.toUpperCase()} ZONE • {activeTable.vibeTag}
              </span>
              <h4 className="font-display font-extrabold text-base">{activeTable.name}</h4>
            </div>

            <span
              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                activeTable.status === 'ready'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : activeTable.status === 'seated'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : activeTable.status === 'reserved'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {activeTable.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 p-2 rounded-xl">
              <div className="text-[10px] text-stone-400">Capacity</div>
              <div className="font-bold text-stone-200">{activeTable.capacity} Guests</div>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <div className="text-[10px] text-stone-400">Current Party</div>
              <div className="font-bold text-amber-300">{activeTable.currentParty || 'Available'}</div>
            </div>
          </div>

          <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 text-xs space-y-1">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Popular Pre-Order Dish</div>
            <div className="font-medium text-stone-200">✨ {activeTable.popularDish}</div>
          </div>

          <button
            onClick={() => {
              if (onSelectTable) onSelectTable(activeTable);
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs transition shadow-md active:scale-95"
          >
            Join Queue For {activeTable.name}
          </button>
        </div>
      )}

      {/* Ambient Canvas Accent */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-stone-950 via-transparent to-stone-950/60" />
    </div>
  );
}
