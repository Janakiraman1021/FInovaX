"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

/* -- Glowing Chain Block -------------------- */
function ChainBlock({ position, color, emissive, delay }: {
    position: [number, number, number];
    color: string;
    emissive: string;
    delay: number;
}) {
    const mesh = useRef<THREE.Mesh>(null!);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        const t = state.clock.elapsedTime + delay;
        mesh.current.rotation.x = Math.sin(t * 0.4) * 0.3;
        mesh.current.rotation.y = t * 0.35;
        mesh.current.position.y = position[1] + Math.sin(t * 0.8) * 0.18;
        const s = hovered ? 1.25 : 1.0;
        mesh.current.scale.lerp(new THREE.Vector3(s, s, s), 0.08);
    });

    return (
        <mesh ref={mesh} position={position} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)} castShadow>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial
                color={hovered ? "#ffffff" : color}
                emissive={emissive}
                emissiveIntensity={hovered ? 0.9 : 0.5}
                transparent
                opacity={0.88}
                roughness={0.1}
                metalness={0.8}
            />
        </mesh>
    );
}

/* -- Connecting beam between blocks ------- */
function ConnectorBeam({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        if (ref.current) {
            const mat = ref.current.material as THREE.MeshStandardMaterial;
            mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    const mid: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
    const length = Math.sqrt(
        Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2) + Math.pow(to[2] - from[2], 2)
    );

    return (
        <mesh ref={ref} position={mid} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, length, 8]} />
            <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.6} transparent opacity={0.4} />
        </mesh>
    );
}

/* -- Star particle field ------------------- */
function StarField() {
    const ref = useRef<THREE.Points>(null!);
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    useFrame(s => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.02; });
    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.04} color="#a78bfa" transparent opacity={0.7} sizeAttenuation />
        </points>
    );
}

const blocks = [
    { position: [-3.0, 0, 0] as [number,number,number], color: "#a78bfa", emissive: "#7c3aed", delay: 0   },
    { position: [-1.0, 0, 0] as [number,number,number], color: "#67e8f9", emissive: "#06b6d4", delay: 0.8 },
    { position: [ 1.0, 0, 0] as [number,number,number], color: "#f0abfc", emissive: "#ec4899", delay: 1.6 },
    { position: [ 3.0, 0, 0] as [number,number,number], color: "#6ee7b7", emissive: "#10b981", delay: 2.4 },
];

export default function BlockchainVisualizer() {
    return (
        <div className="relative h-[280px] w-full rounded-3xl overflow-hidden galaxy-card">
            <Canvas camera={{ position: [0, 0.5, 7], fov: 50 }} shadows>
                {/* Lighting: galaxy purple/cyan */}
                <ambientLight intensity={0.2} />
                <pointLight position={[ 5,  5, 5]} intensity={1.2} color="#a78bfa" />
                <pointLight position={[-5,  3, 5]} intensity={0.8} color="#06b6d4" />
                <pointLight position={[ 0, -4, 2]} intensity={0.5} color="#ec4899" />

                {/* Stars */}
                <StarField />

                {/* Blocks */}
                {blocks.map((b, i) => <ChainBlock key={i} {...b} />)}

                {/* Connectors */}
                <ConnectorBeam from={blocks[0].position} to={blocks[1].position} />
                <ConnectorBeam from={blocks[1].position} to={blocks[2].position} />
                <ConnectorBeam from={blocks[2].position} to={blocks[3].position} />

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
            </Canvas>

            {/* Overlay label */}
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Live Chain Topology</p>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.9)]" />
                    <span className="text-[9px] text-emerald-400/70 uppercase font-bold">Synced</span>
                </div>
            </div>

            {/* Vignette overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,4,20,0.6) 100%)" }} />
        </div>
    );
}
