import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function ParticleCloud({ count = 60, connectionDistance = 1.5 }: {
  count?: number; connectionDistance?: number
}) {
  const pointsRef = useRef<THREE.Points>(null!)
  const linesRef = useRef<THREE.LineSegments>(null!)

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4
      vel[i * 3] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002
    }
    return { positions: pos, velocities: vel }
  }, [count])

  const lineGeo = useMemo(() => {
    const maxLines = count * count
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxLines * 6), 3))
    geo.setDrawRange(0, 0)
    return geo
  }, [count])

  useFrame(() => {
    if (document.hidden) return
    if (!pointsRef.current) return

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    // Move particles
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3]
      arr[i * 3 + 1] += velocities[i * 3 + 1]
      arr[i * 3 + 2] += velocities[i * 3 + 2]

      // Bounce off bounds
      if (Math.abs(arr[i * 3]) > 5) velocities[i * 3] *= -1
      if (Math.abs(arr[i * 3 + 1]) > 2) velocities[i * 3 + 1] *= -1
      if (Math.abs(arr[i * 3 + 2]) > 2) velocities[i * 3 + 2] *= -1
    }
    posAttr.needsUpdate = true

    // Update connection lines
    if (!linesRef.current) return
    const linePos = lineGeo.attributes.position as THREE.BufferAttribute
    const lineArr = linePos.array as Float32Array
    let lineIdx = 0

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = arr[i * 3] - arr[j * 3]
        const dy = arr[i * 3 + 1] - arr[j * 3 + 1]
        const dz = arr[i * 3 + 2] - arr[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < connectionDistance) {
          lineArr[lineIdx++] = arr[i * 3]
          lineArr[lineIdx++] = arr[i * 3 + 1]
          lineArr[lineIdx++] = arr[i * 3 + 2]
          lineArr[lineIdx++] = arr[j * 3]
          lineArr[lineIdx++] = arr[j * 3 + 1]
          lineArr[lineIdx++] = arr[j * 3 + 2]
        }
      }
    }
    linePos.needsUpdate = true
    lineGeo.setDrawRange(0, lineIdx / 3)
  })

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#4B5563" transparent opacity={0.8} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial color="#00D4AA" transparent opacity={0.15} />
      </lineSegments>
    </>
  )
}

export default function ParticleNetwork({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ParticleCloud />
      </Canvas>
    </div>
  )
}
