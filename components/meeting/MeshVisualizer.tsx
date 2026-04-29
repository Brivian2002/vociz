import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Line, Text, Points, PointMaterial } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useParticipants } from '@livekit/components-react';

function PeerNode({ position, identity, isSpeaking }: { position: [number, number, number], identity: string, isSpeaking: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = isSpeaking ? 1.2 + Math.sin(time * 25) * 0.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <Sphere ref={meshRef} args={[0.3, 16, 16]}>
          <meshStandardMaterial 
            color={isSpeaking ? "#10b981" : "#3b82f6"} 
            emissive={isSpeaking ? "#10b981" : "#3b82f6"}
            emissiveIntensity={isSpeaking ? 3 : 0.4}
            metalness={1}
            roughness={0}
          />
        </Sphere>
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="900"
          font="https://fonts.gstatic.com/s/inter/v12/UcCOjFdcCSiGnHk3_ajDlWSErqQmX7fgw54e7S8pt8UvpA.woff2"
        >
          {identity.toUpperCase()}
        </Text>
      </Float>
    </group>
  );
}

function GlobalCloud() {
  const points = useMemo(() => {
    const p = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
       p[i*3] = (Math.random() - 0.5) * 20;
       p[i*3+1] = (Math.random() - 0.5) * 20;
       p[i*3+2] = (Math.random() - 0.5) * 20;
    }
    return p;
  }, []);

  return (
    <Points positions={points} stride={3}>
      <PointMaterial transparent color="#3b82f6" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.1} />
    </Points>
  );
}

function MeshEdges({ nodes }: { nodes: { id: string, pos: [number, number, number] }[] }) {
  const edges = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    if (nodes.length <= 1) return [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        lines.push([
          new THREE.Vector3(...nodes[i].pos),
          new THREE.Vector3(...nodes[j].pos)
        ]);
      }
    }
    return lines;
  }, [nodes]);

  return (
    <group>
      {edges.map(([start, end], idx) => (
        <Line
          key={idx}
          points={[start, end]}
          color="#3b82f6"
          lineWidth={0.2}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  );
}

export default function MeshVisualizer() {
  const participants = useParticipants();
  const groupRef = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    return participants.map((p, idx) => {
      const angle = (idx / participants.length) * Math.PI * 2;
      const radius = 3.5;
      return {
        id: p.sid,
        identity: p.identity || 'Peer',
        isSpeaking: p.isSpeaking,
        pos: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          Math.sin(idx * 0.5) * 1.5
        ] as [number, number, number]
      };
    });
  }, [participants]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.1;
    }
  });

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#050508']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <spotLight position={[-10, 10, 10]} angle={0.2} penumbra={1} intensity={1} />

        <GlobalCloud />

        <group ref={groupRef}>
          <MeshEdges nodes={nodes.map(n => ({ id: n.id, pos: n.pos }))} />
          {nodes.map((node) => (
            <PeerNode 
              key={node.id} 
              position={node.pos} 
              identity={node.identity} 
              isSpeaking={node.isSpeaking} 
            />
          ))}
        </group>

        <EffectComposer>
          <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
