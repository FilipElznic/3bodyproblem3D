import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Trail, Html } from "@react-three/drei";
import { Vector3, Mesh, Object3D } from "three";
import { useControls } from "leva";
import { BodyState } from "../types";

// Constants
const SUB_STEPS = 8;

// Scenarios
type ScenarioType = "figure8" | "2body" | "chaotic" | "galaxy" | "ternary";

const FIGURE8_BASE_POSITIONS = [
  new Vector3(-0.97000436, 0, 0.24308753),
  new Vector3(0.97000436, 0, -0.24308753),
  new Vector3(0, 0, 0),
];

const FIGURE8_BASE_VELOCITIES = [
  new Vector3(0.466203685, 0, 0.43236573),
  new Vector3(0.466203685, 0, 0.43236573),
  new Vector3(-0.93240737, 0, -0.86473146),
];

const FIGURE8_SCALE = 6;
const FIGURE8_VELOCITY_SCALE = 1 / Math.sqrt(FIGURE8_SCALE);

// Modern Space Palette
const COLORS = {
  cyan: "#00f3ff",
  magenta: "#ff00aa",
  gold: "#ffd700",
  white: "#ffffff",
  orange: "#ff8800",
  purple: "#aa00ff",
  green: "#00ff88",
};

const getRandomColor = () => {
  const keys = Object.keys(COLORS) as Array<keyof typeof COLORS>;
  return COLORS[keys[Math.floor(Math.random() * keys.length)]];
};

const getInitialBodies = (scenario: ScenarioType): Omit<BodyState, "ref">[] => {
  switch (scenario) {
    case "2body":
      return [
        {
          id: 1,
          mass: 20,
          position: new Vector3(15, 0, 0),
          velocity: new Vector3(0, 0.8, 0),
          color: COLORS.cyan,
          shape: "sphere",
        },
        {
          id: 2,
          mass: 20,
          position: new Vector3(-15, 0, 0),
          velocity: new Vector3(0, -0.8, 0),
          color: COLORS.magenta,
          shape: "sphere",
        },
      ];
    case "chaotic":
      return [
        {
          id: 1,
          mass: 10 + Math.random() * 5,
          position: new Vector3(
            Math.random() * 30 - 15,
            Math.random() * 30 - 15,
            Math.random() * 30 - 15
          ),
          velocity: new Vector3(
            Math.random() * 1 - 0.5,
            Math.random() * 1 - 0.5,
            Math.random() * 1 - 0.5
          ),
          color: COLORS.cyan,
          shape: "sphere",
        },
        {
          id: 2,
          mass: 10 + Math.random() * 5,
          position: new Vector3(
            Math.random() * 30 - 15,
            Math.random() * 30 - 15,
            Math.random() * 30 - 15
          ),
          velocity: new Vector3(
            Math.random() * 1 - 0.5,
            Math.random() * 1 - 0.5,
            Math.random() * 1 - 0.5
          ),
          color: COLORS.magenta,
          shape: "sphere",
        },
        {
          id: 3,
          mass: 10 + Math.random() * 5,
          position: new Vector3(
            Math.random() * 30 - 15,
            Math.random() * 30 - 15,
            Math.random() * 30 - 15
          ),
          velocity: new Vector3(
            Math.random() * 1 - 0.5,
            Math.random() * 1 - 0.5,
            Math.random() * 1 - 0.5
          ),
          color: COLORS.gold,
          shape: "sphere",
        },
      ];
    case "ternary":
      // Hierarchical System (Sun-Earth-Moon style)
      return [
        {
          id: 1,
          mass: 100,
          position: new Vector3(0, 0, 0),
          velocity: new Vector3(0, 0, 0),
          color: COLORS.gold,
          shape: "sphere",
          radius: 2,
        },
        {
          id: 2,
          mass: 10,
          position: new Vector3(30, 0, 0),
          velocity: new Vector3(0, 0, 2.5), // Approx orbital speed
          color: COLORS.cyan,
          shape: "sphere",
          radius: 1,
        },
        {
          id: 3,
          mass: 1,
          position: new Vector3(33, 0, 0),
          velocity: new Vector3(0, 0, 2.5 + 1.5), // Earth vel + Moon orbital speed
          color: COLORS.white,
          shape: "sphere",
          radius: 0.4,
        },
      ];
    case "galaxy": {
      const bodies: Omit<BodyState, "ref">[] = [];
      // Supermassive Black Hole
      bodies.push({
        id: 0,
        mass: 500,
        position: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        color: COLORS.purple,
        shape: "sphere",
        radius: 3,
      });

      // Stars
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 40;
        // Orbital speed v = sqrt(GM/r)
        // If G=3, v = sqrt(3 * 500 / dist).
        const speed = Math.sqrt((3 * 500) / dist);

        bodies.push({
          id: i + 1,
          mass: 0.1 + Math.random() * 0.5,
          position: new Vector3(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 2, // Slight vertical spread
            Math.sin(angle) * dist
          ),
          velocity: new Vector3(
            -Math.sin(angle) * speed,
            0,
            Math.cos(angle) * speed
          ),
          color: getRandomColor(),
          shape: "sphere",
          radius: 0.2 + Math.random() * 0.2,
        });
      }
      return bodies;
    }
    case "figure8":
    default: {
      const colors = [COLORS.cyan, COLORS.magenta, COLORS.gold];

      return FIGURE8_BASE_POSITIONS.map((basePos, idx) => ({
        id: idx + 1,
        mass: 1,
        position: basePos.clone().multiplyScalar(FIGURE8_SCALE),
        velocity: FIGURE8_BASE_VELOCITIES[idx]
          .clone()
          .multiplyScalar(FIGURE8_VELOCITY_SCALE),
        color: colors[idx],
        shape: "sphere",
        collisionRadius: 0.5,
      }));
    }
  }
};

const SimulationLoop: React.FC<{
  bodies: BodyState[];
  gravity: number;
  timeScale: number;
  focusedBodyId: number | null;
  setCameraTarget: (pos: Vector3) => void;
  collisionsEnabled: boolean;
}> = ({
  bodies,
  gravity,
  timeScale,
  focusedBodyId,
  setCameraTarget,
  collisionsEnabled,
}) => {
  const diff = useMemo(() => new Vector3(), []);
  const acceleration = useMemo(() => new Map<number, Vector3>(), []);
  const collisionDiff = useMemo(() => new Vector3(), []);
  const collisionNormal = useMemo(() => new Vector3(), []);
  const relativeVelocity = useMemo(() => new Vector3(), []);
  const impulseVec = useMemo(() => new Vector3(), []);
  const separationVec = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const dt = (0.016 * timeScale) / SUB_STEPS;

    const calcAcceleration = (bodyIdx: number, targetVec: Vector3) => {
      targetVec.set(0, 0, 0);
      const bodyA = bodies[bodyIdx];

      for (let j = 0; j < bodies.length; j++) {
        if (bodyIdx === j) continue;
        const bodyB = bodies[j];

        diff.copy(bodyB.position).sub(bodyA.position);
        let distSq = diff.lengthSq();

        if (distSq === 0) {
          diff.set(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          );
          distSq = diff.lengthSq();
        }

        let dist = Math.sqrt(distSq);
        if (collisionsEnabled) {
          const radiusA = bodyA.collisionRadius ?? 0;
          const radiusB = bodyB.collisionRadius ?? 0;
          const minSeparation = radiusA + radiusB;

          if (dist < minSeparation && minSeparation > 0) {
            diff.normalize().multiplyScalar(minSeparation);
            dist = minSeparation;
            distSq = dist * dist;
          }
        }

        const softening = 2.0;
        const distCubed = Math.pow(distSq + softening * softening, 1.5);
        targetVec.addScaledVector(diff, (gravity * bodyB.mass) / distCubed);
      }
    };

    const resolveCollisions = () => {
      if (!collisionsEnabled) return;

      for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const bodyB = bodies[j];

          collisionDiff.copy(bodyB.position).sub(bodyA.position);
          let dist = collisionDiff.length();

          if (dist === 0) {
            collisionDiff.set(
              Math.random() - 0.5,
              Math.random() - 0.5,
              Math.random() - 0.5
            );
            dist = collisionDiff.length();
          }

          const minDist =
            (bodyA.collisionRadius ?? 0) + (bodyB.collisionRadius ?? 0);
          if (dist >= minDist) continue;

          collisionNormal.copy(collisionDiff).divideScalar(dist || 1);
          const penetration = minDist - dist;
          separationVec.copy(collisionNormal).multiplyScalar(penetration * 0.5);

          bodyA.position.addScaledVector(separationVec, -1);
          bodyB.position.addScaledVector(separationVec, 1);

          relativeVelocity.copy(bodyA.velocity).sub(bodyB.velocity);
          const velAlongNormal = relativeVelocity.dot(collisionNormal);
          if (velAlongNormal < 0) {
            const restitution = 0.8;
            const impulseMag =
              (-(1 + restitution) * velAlongNormal) /
              (1 / bodyA.mass + 1 / bodyB.mass);

            impulseVec.copy(collisionNormal).multiplyScalar(impulseMag);
            bodyA.velocity.addScaledVector(impulseVec, -1 / bodyA.mass);
            bodyB.velocity.addScaledVector(impulseVec, 1 / bodyB.mass);
          }
        }
      }
    };

    for (let step = 0; step < SUB_STEPS; step++) {
      bodies.forEach((b) => {
        if (!acceleration.has(b.id)) acceleration.set(b.id, new Vector3());
      });

      for (let i = 0; i < bodies.length; i++) {
        const acc = acceleration.get(bodies[i].id)!;
        if (acc.lengthSq() === 0) {
          calcAcceleration(i, acc);
        }
      }

      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        const acc = acceleration.get(body.id)!;
        body.velocity.addScaledVector(acc, 0.5 * dt);
        body.position.addScaledVector(body.velocity, dt);
      }

      for (let i = 0; i < bodies.length; i++) {
        calcAcceleration(i, acceleration.get(bodies[i].id)!);
      }

      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        const newAcc = acceleration.get(body.id)!;
        body.velocity.addScaledVector(newAcc, 0.5 * dt);
      }

      resolveCollisions();
    }

    // Sync Visuals & Camera
    let focusedPos: Vector3 | null = null;
    for (const body of bodies) {
      if (body.ref.current) {
        body.ref.current.position.copy(body.position);
      }
      if (body.id === focusedBodyId) {
        focusedPos = body.position;
      }
    }

    if (focusedPos) {
      setCameraTarget(focusedPos);
    }
  });

  return null;
};

// Custom FPS Counter Component
const FPSCounter = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const time = performance.now();
    if (time >= lastTime.current + 1000) {
      setFps(
        Math.round((frameCount.current * 1000) / (time - lastTime.current))
      );
      frameCount.current = 0;
      lastTime.current = time;
    }
  });

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div className="absolute bottom-6 right-6 z-10 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg shadow-lg select-none flex items-center gap-3 pointer-events-auto">
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-white font-mono leading-none">
            {fps}
          </span>
          <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
            FPS
          </span>
        </div>
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            fps > 50
              ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
              : fps > 30
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        ></div>
      </div>
    </Html>
  );
};

const BodyMesh: React.FC<{ body: BodyState }> = ({ body }) => {
  const radius = body.radius || 1;
  return (
    <group>
      <Trail
        width={4}
        length={80}
        color={body.color}
        attenuation={(t) => t * t}
        target={body.ref as unknown as React.MutableRefObject<Object3D>} // Explicitly set target to the mesh ref
      >
        <mesh ref={body.ref} position={body.position} castShadow receiveShadow>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial
            color={body.color}
            emissive={body.color}
            emissiveIntensity={2}
            toneMapped={false}
            roughness={0.1}
            metalness={0.8}
          />
          {/* Glow Halo */}
          <pointLight
            color={body.color}
            intensity={2}
            distance={15}
            decay={2}
          />
        </mesh>
      </Trail>
    </group>
  );
};

export const ThreeBodyScene: React.FC = () => {
  const [scenario, setScenario] = useState<ScenarioType>("figure8");
  const [key, setKey] = useState(0);
  const controlsRef = useRef<any>(null);
  const [bodies, setBodies] = useState<BodyState[]>([]);
  const shouldPerturb = useRef(false);

  const { gravity, timeScale, focusedBodyId } = useControls({
    gravity: { value: 3, min: 0.2, max: 5, step: 0.1, label: "Gravity (G)" },
    timeScale: { value: 4, min: 0, max: 10, step: 0.1, label: "Time Speed" },
    focusedBodyId: {
      value: 0,
      options: {
        None: 0,
        "Body 1 (Cyan)": 1,
        "Body 2 (Magenta)": 2,
        "Body 3 (Gold)": 3,
      },
      label: "Camera Focus",
    },
  });

  // Initialize bodies when scenario or key changes
  useEffect(() => {
    const initialData = getInitialBodies(scenario);
    const newBodies = initialData.map((data) => {
      const pos = data.position.clone();
      const vel = data.velocity.clone();

      if (shouldPerturb.current) {
        pos.add(
          new Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
          )
        );
        vel.add(
          new Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
          )
        );
      }

      return {
        ...data,
        position: pos,
        velocity: vel,
        ref: React.createRef<Mesh>(),
        shape: "sphere" as const,
        radius: data.radius || 0.8,
        collisionRadius: data.collisionRadius || 0.5,
      };
    });
    setBodies(newBodies);
    shouldPerturb.current = false;
  }, [scenario, key]);

  const handleReset = () => {
    setKey((k) => k + 1);
  };

  const handlePerturb = () => {
    shouldPerturb.current = true;
    setKey((k) => k + 1);
  };

  const handleAddBody = () => {
    const newBody: BodyState = {
      id: bodies.length + 1 + Math.random(), // Simple unique ID
      mass: 5 + Math.random() * 10,
      position: new Vector3(
        Math.random() * 40 - 20,
        Math.random() * 40 - 20,
        Math.random() * 40 - 20
      ),
      velocity: new Vector3(
        Math.random() * 1 - 0.5,
        Math.random() * 1 - 0.5,
        Math.random() * 1 - 0.5
      ),
      color: getRandomColor(),
      ref: React.createRef<Mesh>(),
      shape: "sphere",
      radius: 0.6 + Math.random() * 0.4,
      collisionRadius: 0.5,
    };
    setBodies((prev) => [...prev, newBody]);
  };

  const setCameraTarget = (pos: Vector3) => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(pos, 0.1);
      controlsRef.current.update();
    }
  };

  return (
    <div className="w-full h-full relative bg-[#020204]">
      {/* Modern UI Overlay */}
      <div className="absolute top-6 left-6 z-50 w-80 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-2xl select-none pointer-events-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm font-bold tracking-[0.2em] text-white uppercase">
            Simulation Control
          </h1>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">
              Scenarios
            </h2>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              <button
                onClick={() => setScenario("figure8")}
                className={`w-full py-3 px-4 rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-between group ${
                  scenario === "figure8"
                    ? "bg-blue-500/10 border border-blue-500/50 text-blue-400"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-gray-400"
                }`}
              >
                <span>Figure-8 Orbit</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    scenario === "figure8"
                      ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                      : "bg-gray-600"
                  }`}
                ></span>
              </button>

              <button
                onClick={() => setScenario("ternary")}
                className={`w-full py-3 px-4 rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-between group ${
                  scenario === "ternary"
                    ? "bg-blue-500/10 border border-blue-500/50 text-blue-400"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-gray-400"
                }`}
              >
                <span>Sun-Earth-Moon</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    scenario === "ternary"
                      ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                      : "bg-gray-600"
                  }`}
                ></span>
              </button>

              <button
                onClick={() => setScenario("galaxy")}
                className={`w-full py-3 px-4 rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-between group ${
                  scenario === "galaxy"
                    ? "bg-blue-500/10 border border-blue-500/50 text-blue-400"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-gray-400"
                }`}
              >
                <span>Galaxy Cluster</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    scenario === "galaxy"
                      ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                      : "bg-gray-600"
                  }`}
                ></span>
              </button>

              <button
                onClick={() => setScenario("2body")}
                className={`w-full py-3 px-4 rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-between group ${
                  scenario === "2body"
                    ? "bg-blue-500/10 border border-blue-500/50 text-blue-400"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-gray-400"
                }`}
              >
                <span>2-Body Stable</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    scenario === "2body"
                      ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                      : "bg-gray-600"
                  }`}
                ></span>
              </button>

              <button
                onClick={() => setScenario("chaotic")}
                className={`w-full py-3 px-4 rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-between group ${
                  scenario === "chaotic"
                    ? "bg-blue-500/10 border border-blue-500/50 text-blue-400"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-gray-400"
                }`}
              >
                <span>Chaotic Random</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    scenario === "chaotic"
                      ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                      : "bg-gray-600"
                  }`}
                ></span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">
              Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-lg text-xs font-medium transition-all text-gray-300 hover:text-white"
              >
                Reset
              </button>
              <button
                onClick={handlePerturb}
                className="py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-lg text-xs font-medium transition-all text-purple-300 hover:text-purple-200"
              >
                Butterfly Effect
              </button>
              <button
                onClick={handleAddBody}
                className="col-span-2 py-2 px-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-lg text-xs font-medium transition-all text-green-300 hover:text-green-200"
              >
                + Add Random Body
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] leading-relaxed text-gray-500 font-mono">
              {scenario === "2body" && "STABLE SYSTEM // CLOSED-FORM SOLUTION"}

              {scenario === "chaotic" && "UNSTABLE // DETERMINISTIC CHAOS"}
              {scenario === "galaxy" && "MASSIVE SYSTEM // 100+ BODIES"}
              {scenario === "ternary" && "HIERARCHICAL // SUN-EARTH-MOON"}
            </p>
          </div>
        </div>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 20, 40], fov: 35 }}
        key={key}
        dpr={[1, 2]}
      >
        <FPSCounter />
        <color attach="background" args={["#020204"]} />
        <fog attach="fog" args={["#020204", 30, 100]} />

        {/* Lighting */}
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#4444ff"
        />

        {/* Environment */}
        <Stars
          radius={100}
          depth={50}
          count={7000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          maxDistance={100}
          minDistance={5}
        />

        {/* Simulation Logic */}
        <SimulationLoop
          bodies={bodies}
          gravity={gravity}
          timeScale={timeScale}
          focusedBodyId={focusedBodyId === 0 ? null : focusedBodyId}
          setCameraTarget={setCameraTarget}
          collisionsEnabled={scenario !== "figure8"}
        />

        {/* Visuals */}
        {bodies.map((body) => (
          <BodyMesh key={body.id} body={body} />
        ))}

        {/* FPS Counter */}
        <FPSCounter />
      </Canvas>
    </div>
  );
};
