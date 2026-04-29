import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Line, Text } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useParticipants } from '@livekit/components-react';

function PeerNode({ position, identity, isSpeaking }: { position: [number, number, number], identity: string, isSpeaking: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = isSpeaking ? 1.2 + Math.sin(time * 20) * 0.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere ref={meshRef} args={[0.4, 32, 32]}>
          <meshStandardMaterial 
            color={isSpeaking ? "#4ade80" : "#2563eb"} 
            emissive={isSpeaking ? "#4ade80" : "#2563eb"}
            emissiveIntensity={isSpeaking ? 2 : 0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </Sphere>
      </Float>
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.2}
        color="white"
        font="/fonts/GeistMono-Bold.woff2"
        anchorX="center"
        anchorY="middle"
      >
        {identity.toUpperCase()}
      </Text>
    </group>
  );
}

function MeshEdges({ nodes }: { nodes: { id: string, pos: [number, number, number] }[] }) {
  const edges = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
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
          color="#2563eb"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  );
}

export default function MeshVisualizer() {
  const participants = useParticipants();
  
  const nodes = useMemo(() => {
    return participants.map((p, idx) => {
      const angle = (idx / participants.length) * Math.PI * 2;
      const radius = 4;
      return {
        id: p.sid,
        identity: p.identity || 'Peer',
        isSpeaking: p.isSpeaking,
        pos: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          Math.sin(idx) * 2
        ] as [number, number, number]
      };
    });
  }, [participants]);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={['#000B1A']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

        <group rotation={[0, 0, 0]}>
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
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
