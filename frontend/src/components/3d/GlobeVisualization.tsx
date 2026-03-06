import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

const SANCTIONS_ARCS = [
  { from: [48.85, 2.35], to: [38.9, -77.04] },
  { from: [51.5, -0.12], to: [1.35, 103.82] },
  { from: [40.71, -74.0], to: [35.68, 139.69] },
  { from: [46.95, 7.45], to: [55.75, 37.62] },
  { from: [45.42, -75.69], to: [25.27, 55.29] },
  { from: [48.85, 2.35], to: [-4.44, 15.27] },
  { from: [40.71, -74.0], to: [51.5, -0.12] },
  { from: [35.68, 139.69], to: [1.35, 103.82] },
  { from: [38.9, -77.04], to: [25.27, 55.29] },
  { from: [55.75, 37.62], to: [-4.44, 15.27] },
]

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function DotGrid({ radius = 2.02, count = 1500 }: { radius?: number; count?: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    return pos
  }, [count, radius])

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#9E59EF"
        size={0.015}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  )
}

function ArcLine({ from, to, color = '#9E59EF', radius = 2 }: {
  from: number[]; to: number[]; color?: string; radius?: number
}) {
  const lineObj = useMemo(() => {
    const start = latLonToVec3(from[0], from[1], radius)
    const end = latLonToVec3(to[0], to[1], radius)
    const mid = start.clone().add(end).multiplyScalar(0.5)
    mid.normalize().multiplyScalar(radius * 1.4)
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    const points = curve.getPoints(40)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
    return new THREE.Line(geometry, material)
  }, [from, to, radius, color])

  useFrame(({ clock }) => {
    const mat = lineObj.material as THREE.LineBasicMaterial
    mat.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 0.8) * 0.2
  })

  return <primitive object={lineObj} />
}

function Globe() {
  const groupRef = useRef<THREE.Group>(null!)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    if (document.hidden) return
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.05 + mouseRef.current.x * 0.05
    groupRef.current.rotation.x = mouseRef.current.y * 0.03
  })

  return (
    <group ref={groupRef}>
      <Sphere args={[2, 32, 32]}>
        <meshBasicMaterial wireframe color="#1a2332" opacity={0.2} transparent />
      </Sphere>
      <DotGrid />
      {SANCTIONS_ARCS.map((arc, i) => (
        <ArcLine key={i} from={arc.from} to={arc.to} />
      ))}
    </group>
  )
}

export default function GlobeVisualization({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <Globe />
      </Canvas>
    </div>
  )
}
