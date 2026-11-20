"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Environment, Float, Lightformer, ContactShadows, RoundedBox } from "@react-three/drei";

type Props = { lite?: boolean; still?: boolean; dark?: boolean };

/** Shared pointer + scroll state, written by DOM listeners and read inside useFrame. */
const input = { x: 0, y: 0, scroll: 0 };
if (typeof window !== "undefined") {
  window.addEventListener("pointermove", (e) => {
    input.x = (e.clientX / window.innerWidth) * 2 - 1;
    input.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener("scroll", () => {
    input.scroll = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
  }, { passive: true });
}

const EMBER = "#d24f26";
const BONE = "#efe6da";
const INK = "#221c17";
const CLAY = "#c9a27e";

/** A lathed ceramic vase: the "goods" side of the marketplace. */
function Vase(props: ThreeElements["group"]) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const r = 0.32 + Math.sin(t * Math.PI * 1.05) * 0.38 - Math.pow(t, 6) * 0.25 + (t > 0.9 ? (t - 0.9) * 1.4 : 0);
      pts.push(new THREE.Vector2(Math.max(0.05, r), t * 1.8 - 0.9));
    }
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  return (
    <group {...props}>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial color={EMBER} roughness={0.38} clearcoat={0.6} clearcoatRoughness={0.25} sheen={0.4} sheenColor="#ffb08a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A glass orb with a warm core: the "experiences" side. */
function Orb(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh castShadow>
        <sphereGeometry args={[0.62, 64, 64]} />
        <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={1.2} roughness={0.05} ior={1.35} clearcoat={1} attenuationColor="#ffd6bf" attenuationDistance={1.6} />
      </mesh>
      <mesh scale={0.26}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Ring — jewellery / craft. */
function Ring(props: ThreeElements["mesh"]) {
  return (
    <mesh castShadow {...props}>
      <torusGeometry args={[0.5, 0.13, 48, 128]} />
      <meshPhysicalMaterial color={CLAY} metalness={0.85} roughness={0.22} clearcoat={0.5} />
    </mesh>
  );
}

/** Parcel — delivery. */
function Parcel(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <RoundedBox args={[0.9, 0.7, 0.7]} radius={0.09} smoothness={5} castShadow>
        <meshPhysicalMaterial color={BONE} roughness={0.7} sheen={0.3} />
      </RoundedBox>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.16, 0.72, 0.72]} />
        <meshStandardMaterial color={INK} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Calendar tile — bookings. */
function Tile(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <RoundedBox args={[0.85, 0.85, 0.16]} radius={0.1} smoothness={5} castShadow>
        <meshPhysicalMaterial color={INK} roughness={0.35} clearcoat={0.8} />
      </RoundedBox>
      {[-0.22, 0, 0.22].flatMap((x) =>
        [-0.12, 0.12].map((y) => (
          <mesh key={`${x}${y}`} position={[x, y - 0.06, 0.09]}>
            <circleGeometry args={[0.055, 24]} />
            <meshBasicMaterial color={x === 0 && y > 0 ? EMBER : "#5b5048"} />
          </mesh>
        ))
      )}
      <mesh position={[0, 0.3, 0.09]}>
        <planeGeometry args={[0.6, 0.08]} />
        <meshBasicMaterial color={EMBER} />
      </mesh>
    </group>
  );
}

function Rig({ still }: { still?: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera }, dt) => {
    if (!group.current) return;
    const k = still ? 1 : Math.min(1, dt * 3);
    // Pointer parallax on the camera, scroll pushes the cluster away and turns it.
    camera.position.x += (input.x * 0.5 - camera.position.x) * k;
    camera.position.y += (-input.y * 0.3 + 0.2 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
    group.current.rotation.y += ((still ? 0 : input.scroll * 0.9) - group.current.rotation.y) * k;
    group.current.position.y += (input.scroll * 1.2 - group.current.position.y) * k;
    const s = 1 - input.scroll * 0.18;
    group.current.scale.setScalar(group.current.scale.x + (s - group.current.scale.x) * k);
  });
  return <group ref={group}><Cluster still={still} /></group>;
}

function Cluster({ still, lite }: { still?: boolean; lite?: boolean }) {
  const speed = still ? 0 : 1.2;
  return (
    <>
      <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.8}>
        <Vase position={[-0.35, 0.05, 0]} rotation={[0.1, 0, -0.12]} />
      </Float>
      <Float speed={speed * 1.3} rotationIntensity={0.8} floatIntensity={1.1}>
        <Orb position={[1.25, 0.85, -0.4]} />
      </Float>
      <Float speed={speed * 0.9} rotationIntensity={1.4} floatIntensity={1}>
        <Ring position={[1.35, -0.75, 0.3]} rotation={[1.1, 0.3, 0.4]} />
      </Float>
      {!lite && (
        <>
          <Float speed={speed * 1.1} rotationIntensity={0.6} floatIntensity={0.9}>
            <Parcel position={[-1.65, -0.85, 0.2]} rotation={[0.3, 0.6, 0.1]} />
          </Float>
          <Float speed={speed * 0.8} rotationIntensity={0.7} floatIntensity={0.7}>
            <Tile position={[-1.45, 1.05, -0.5]} rotation={[0.15, 0.45, -0.1]} />
          </Float>
        </>
      )}
    </>
  );
}

export default function HeroScene({ lite, still, dark }: Props) {
  return (
    <Canvas
      shadows={!lite}
      dpr={lite ? [1, 1.4] : [1, 2]}
      frameloop={still ? "demand" : "always"}
      camera={{ position: [0, 0.2, 5.4], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <directionalLight position={[3, 5, 4]} intensity={dark ? 1.6 : 2.2} castShadow={!lite} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, -1, 2]} intensity={12} color="#ff9a6b" distance={8} />
      {lite ? <Cluster still={still} lite /> : <Rig still={still} />}
      {!lite && <ContactShadows position={[0, -1.7, 0]} opacity={dark ? 0.55 : 0.35} scale={9} blur={2.6} far={3} />}
      <Environment resolution={lite ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffd9c4" position={[-4, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="circle" intensity={1.6} color="#ffffff" position={[4, 1, 1]} rotation-y={-Math.PI / 2} scale={3} />
        <Lightformer form="ring" intensity={0.8} color={EMBER} position={[0, -3, -2]} scale={4} />
      </Environment>
    </Canvas>
  );
}
