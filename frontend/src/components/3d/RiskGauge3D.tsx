import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

function ArcMesh() {
  const mesh = useMemo(() => {
    const segments = 64
    const innerR = 1.3
    const outerR = 1.6
    const vertices: number[] = []
    const colors: number[] = []

    const green = new THREE.Color('#10B981')
    const yellow = new THREE.Color('#F59E0B')
    const red = new THREE.Color('#EF4444')

    for (let i = 0; i < segments; i++) {
      const t1 = i / segments
      const t2 = (i + 1) / segments
      const a1 = Math.PI * (1 - t1)
      const a2 = Math.PI * (1 - t2)

      const color1 = new THREE.Color()
      const color2 = new THREE.Color()
      if (t1 < 0.5) color1.lerpColors(green, yellow, t1 * 2)
      else color1.lerpColors(yellow, red, (t1 - 0.5) * 2)
      if (t2 < 0.5) color2.lerpColors(green, yellow, t2 * 2)
      else color2.lerpColors(yellow, red, (t2 - 0.5) * 2)

      // Inner-left, outer-left, outer-right triangle
      vertices.push(
        innerR * Math.cos(a1), innerR * Math.sin(a1), 0,
        outerR * Math.cos(a1), outerR * Math.sin(a1), 0,
        outerR * Math.cos(a2), outerR * Math.sin(a2), 0,
      )
      colors.push(
        color1.r, color1.g, color1.b,
        color1.r, color1.g, color1.b,
        color2.r, color2.g, color2.b,
      )
      // Inner-left, outer-right, inner-right triangle
      vertices.push(
        innerR * Math.cos(a1), innerR * Math.sin(a1), 0,
        outerR * Math.cos(a2), outerR * Math.sin(a2), 0,
        innerR * Math.cos(a2), innerR * Math.sin(a2), 0,
      )
      colors.push(
        color1.r, color1.g, color1.b,
        color2.r, color2.g, color2.b,
        color2.r, color2.g, color2.b,
      )
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
    return new THREE.Mesh(geo, mat)
  }, [])

  return <primitive object={mesh} />
}

function Needle({ score }: { score: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const targetAngle = Math.PI * (1 - score / 100)

  useFrame(() => {
    if (!groupRef.current) return
    const curr = groupRef.current.rotation.z
    groupRef.current.rotation.z += (targetAngle - curr) * 0.03
  })

  return (
    <group ref={groupRef} rotation={[0, 0, Math.PI]}>
      <mesh position={[0, 0.55, 0.01]}>
        <boxGeometry args={[0.04, 1.2, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.08, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  )
}

function GaugeScene({ score, label }: { score: number; label: string }) {
  const riskColor = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#10B981'

  return (
    <group position={[0, -0.3, 0]}>
      <ArcMesh />
      <Needle score={score} />
      <Html center position={[0, -0.2, 0]} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center select-none">
          <span className="text-4xl font-bold text-white tabular-nums">{score}</span>
          <span
            className="text-xs font-semibold tracking-widest uppercase mt-1"
            style={{ color: riskColor }}
          >
            {label}
          </span>
        </div>
      </Html>
    </group>
  )
}

export default function RiskGauge3D({
  score = 50,
  label = 'MEDIUM',
  className = '',
}: {
  score?: number
  label?: string
  className?: string
}) {
  return (
    <div className={`w-full h-full min-h-[200px] ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 3, 3]} intensity={0.8} />
        <GaugeScene score={score} label={label} />
      </Canvas>
    </div>
  )
}
