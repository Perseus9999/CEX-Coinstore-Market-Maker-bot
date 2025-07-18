"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Float, Sphere, Box, Cylinder, Torus, Html } from "@react-three/drei"
import { useRef, useState, useMemo } from "react"
import type * as THREE from "three"

interface Bot3DVisualizationProps {
  isRunning: boolean
  ammPrice?: number
  activeOrders?: number
  botParams?: {
    tradingPair: string,
    baseAmount: string,
    spread: string,
    orderAmount: string,
    refreshInterval: string,
    maxPosition: string,
    stopLoss: string,
    takeProfit: string,
    server: string,
    minOrderSize: string,
  }
}

function TradingBot({ isRunning }: { isRunning: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const antennaRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      // Main body floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.2
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }

    if (headRef.current && isRunning) {
      // Head scanning animation when running
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.3
    }

    if (leftArmRef.current && rightArmRef.current && isRunning) {
      // Arms moving animation when trading
      leftArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.3
      rightArmRef.current.rotation.z = -Math.sin(state.clock.elapsedTime * 3) * 0.5 - 0.3
    }

    if (antennaRef.current && isRunning) {
      // Antenna spinning when active
      antennaRef.current.rotation.y = state.clock.elapsedTime * 4
    }
  })

  return (
    <Float speed={isRunning ? 2 : 0.8} rotationIntensity={isRunning ? 0.3 : 0.1} floatIntensity={isRunning ? 0.4 : 0.2}>
      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        {/* Main Bot Body */}
        <Box args={[1.5, 2, 1]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={isRunning ? "#00ff88" : "#666666"}
            metalness={0.8}
            roughness={0.2}
            emissive={isRunning ? "#004422" : "#000000"}
            emissiveIntensity={isRunning ? 0.3 : 0}
          />
        </Box>

        {/* Bot Chest Panel */}
        <Box args={[1.2, 1.5, 0.1]} position={[0, 0, 0.55]}>
          <meshStandardMaterial
            color={isRunning ? "#0088ff" : "#333333"}
            metalness={0.9}
            roughness={0.1}
            emissive={isRunning ? "#002244" : "#000000"}
            emissiveIntensity={isRunning ? 0.5 : 0}
          />
        </Box>

        {/* Bot Head */}
        <Sphere ref={headRef} args={[0.8]} position={[0, 1.8, 0]}>
          <meshStandardMaterial
            color={isRunning ? "#0088ff" : "#444444"}
            metalness={0.9}
            roughness={0.1}
            emissive={isRunning ? "#002244" : "#000000"}
            emissiveIntensity={isRunning ? 0.4 : 0}
          />
        </Sphere>

        {/* Eyes */}
        <Sphere args={[0.15]} position={[-0.3, 1.9, 0.7]}>
          <meshStandardMaterial
            color={isRunning ? "#ffff00" : "#ff0000"}
            emissive={isRunning ? "#ffff00" : "#ff0000"}
            emissiveIntensity={1}
          />
        </Sphere>
        <Sphere args={[0.15]} position={[0.3, 1.9, 0.7]}>
          <meshStandardMaterial
            color={isRunning ? "#ffff00" : "#ff0000"}
            emissive={isRunning ? "#ffff00" : "#ff0000"}
            emissiveIntensity={1}
          />
        </Sphere>

        {/* Antenna */}
        <group ref={antennaRef} position={[0, 2.6, 0]}>
          <Cylinder args={[0.05, 0.05, 0.8]} position={[0, 0.4, 0]}>
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </Cylinder>
          <Sphere args={[0.1]} position={[0, 0.8, 0]}>
            <meshStandardMaterial
              color={isRunning ? "#ff00ff" : "#666666"}
              emissive={isRunning ? "#ff00ff" : "#000000"}
              emissiveIntensity={isRunning ? 0.8 : 0}
            />
          </Sphere>
        </group>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-1.2, 0.5, 0]}>
          <Cylinder args={[0.15, 0.15, 1.2]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </Cylinder>
          {/* Left Hand */}
          <Sphere args={[0.2]} position={[-0.8, 0, 0]}>
            <meshStandardMaterial
              color={isRunning ? "#00ffff" : "#666666"}
              metalness={0.8}
              roughness={0.2}
              emissive={isRunning ? "#004444" : "#000000"}
              emissiveIntensity={isRunning ? 0.3 : 0}
            />
          </Sphere>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[1.2, 0.5, 0]}>
          <Cylinder args={[0.15, 0.15, 1.2]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </Cylinder>
          {/* Right Hand */}
          <Sphere args={[0.2]} position={[0.8, 0, 0]}>
            <meshStandardMaterial
              color={isRunning ? "#00ffff" : "#666666"}
              metalness={0.8}
              roughness={0.2}
              emissive={isRunning ? "#004444" : "#000000"}
              emissiveIntensity={isRunning ? 0.3 : 0}
            />
          </Sphere>
        </group>

        {/* Legs */}
        <Cylinder args={[0.2, 0.2, 1.5]} position={[-0.4, -1.75, 0]}>
          <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 1.5]} position={[0.4, -1.75, 0]}>
          <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
        </Cylinder>

        {/* Feet */}
        <Box args={[0.6, 0.2, 0.8]} position={[-0.4, -2.6, 0.2]}>
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </Box>
        <Box args={[0.6, 0.2, 0.8]} position={[0.4, -2.6, 0.2]}>
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </Box>

        {/* Status Display */}
        {isRunning && (
          <Html position={[0, 3.5, 0]} center>
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg px-3 py-1 text-green-400 text-sm font-bold animate-pulse">
              MARKET MAKING ACTIVE
            </div>
          </Html>
        )}
      </group>
    </Float>
  )
}

function TradingRings({ isRunning }: { isRunning: boolean }) {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (isRunning) {
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = state.clock.elapsedTime * 1
        ring1Ref.current.rotation.y = state.clock.elapsedTime * 0.5
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = -state.clock.elapsedTime * 0.8
        ring2Ref.current.rotation.z = state.clock.elapsedTime * 0.7
      }
      if (ring3Ref.current) {
        ring3Ref.current.rotation.y = state.clock.elapsedTime * 1.2
        ring3Ref.current.rotation.z = -state.clock.elapsedTime * 0.4
      }
    }
  })

  if (!isRunning) return null

  return (
    <group>
      <Torus ref={ring1Ref} args={[4, 0.1, 16, 100]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.3} transparent opacity={0.6} />
      </Torus>
      <Torus ref={ring2Ref} args={[5, 0.08, 16, 100]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.3} transparent opacity={0.4} />
      </Torus>
      <Torus ref={ring3Ref} args={[6, 0.06, 16, 100]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.3} transparent opacity={0.3} />
      </Torus>
    </group>
  )
}

function DataOrbs({ isRunning }: { isRunning: boolean }) {
  const orbsRef = useRef<THREE.Group>(null)

  const orbPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radius = 8 + Math.random() * 4
      const height = (Math.random() - 0.5) * 6
      positions.push({
        x: Math.cos(angle) * radius,
        y: height,
        z: Math.sin(angle) * radius,
        color: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3"][Math.floor(Math.random() * 6)],
        speed: 0.5 + Math.random() * 1.5,
      })
    }
    return positions
  }, [])

  useFrame((state) => {
    if (orbsRef.current && isRunning) {
      orbsRef.current.rotation.y = state.clock.elapsedTime * 0.2
      orbsRef.current.children.forEach((child, index) => {
        const orb = orbPositions[index]
        child.position.y = orb.y + Math.sin(state.clock.elapsedTime * orb.speed + index) * 2
      })
    }
  })

  if (!isRunning) return null

  return (
    <group ref={orbsRef}>
      {orbPositions.map((orb, index) => (
        <Float key={index} speed={2 + Math.random()} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[0.2]} position={[orb.x, orb.y, orb.z]}>
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  )
}

function TradingData({ isRunning, ammPrice, activeOrders, botParams }: { isRunning: boolean, ammPrice: number, activeOrders: number, botParams: any }) {
  const dataRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (dataRef.current && isRunning) {
      dataRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  if (!isRunning) return null

  return (
    <group ref={dataRef}>
      <Html position={[-6, 3, 0]} center>
        <div className="bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-2 text-cyan-400 text-xs">
          <div className="text-green-400 w-36">Trading-Pair: {botParams.tradingPair}</div>
        </div>
      </Html>
      <Html position={[6, 2, 1]} center>
        <div className="w-48 bg-purple-500/20 backdrop-blur-sm border border-purple-500/50 rounded-lg p-2 text-purple-400 text-xs">
          <div className="text-yellow-400">Trading Amount: {botParams.baseAmount} XRP</div>
        </div>
      </Html>
      <Html position={[0, -4, 3]} center>
        <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg p-2 text-green-400 text-xs">
          <div></div>
          <div className="text-green-400 w-60">Current Price: {(ammPrice).toFixed(4)} srfx/XRP</div>
        </div>
      </Html>
      <Html position={[-4, -2, -4]} center>
        <div className="bg-pink-500/20 backdrop-blur-sm border border-pink-500/50 rounded-lg p-2 text-pink-400 text-xs">
          <div className="text-pink-400 w-20">Spread: {botParams.spread}%</div>
        </div>
      </Html>
    </group>
  )
}

function ParticleField({ isRunning }: { isRunning: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)

  const particleCount = 200
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return pos
  }, [])

  useFrame((state) => {
    if (pointsRef.current && isRunning) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={isRunning ? "#00ff88" : "#666666"}
        transparent
        opacity={isRunning ? 0.6 : 0.2}
        sizeAttenuation={true}
      />
    </points>
  )
}

export function Bot3DVisualization({ isRunning, ammPrice, activeOrders, botParams }: Bot3DVisualizationProps) {
  return (
    <Canvas camera={{ position: [8, 6, 8], fov: 60 }} gl={{ antialias: true }}>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ecdc4" />
      <pointLight position={[0, 15, 0]} intensity={0.8} color="#ff00ff" />
      <spotLight
        position={[0, 20, 0]}
        angle={0.3}
        penumbra={1}
        intensity={isRunning ? 2 : 0.5}
        color={isRunning ? "#00ff88" : "#ffffff"}
        castShadow
      />

      {/* 3D Components */}
      <TradingBot isRunning={isRunning} />
      <TradingRings isRunning={isRunning} />
      <DataOrbs isRunning={isRunning} />
      <TradingData isRunning={isRunning} ammPrice={ammPrice ?? 0} activeOrders={activeOrders ?? 0} botParams={botParams}/>
      <ParticleField isRunning={isRunning} />

      {/* Environment */}
      <Environment preset="sunset" />

      {/* Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        maxDistance={20}
        minDistance={5}
        maxPolarAngle={Math.PI / 2}
        autoRotate={isRunning}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  )
}
