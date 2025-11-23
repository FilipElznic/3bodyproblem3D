import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Trail } from "@react-three/drei";
import { Vector3, Mesh } from "three";
// import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useControls } from "leva";
import { BodyState } from "../types";

// Constants
const SUB_STEPS = 8; // Increased for better stability with RK4/Verlet

// Scenarios
type ScenarioType = "figure8" | "2body" | "chaotic";

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

const getInitialBodies = (scenario: ScenarioType): Omit<BodyState, "ref">[] => {
  switch (scenario) {
    case "2body":
      return [
        {
          id: 1,
          mass: 20,
          position: new Vector3(10, 0, 0),
          velocity: new Vector3(0, 1, 0),
          color: "#ff4444",
          shape: "cube",
        },
        {
          id: 2,
          mass: 20,
          position: new Vector3(-10, 0, 0),
          velocity: new Vector3(0, -1, 0),
          color: "#44ff44",
          shape: "dodecahedron",
        },
      ];
    case "chaotic":
      return [
        {
          id: 1,
          mass: 10 + Math.random() * 5,
          position: new Vector3(
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5
          ),
          velocity: new Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ),
          color: "#ff4444",
          shape: "cube",
        },
        {
          id: 2,
          mass: 10 + Math.random() * 5,
          position: new Vector3(
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5
          ),
          velocity: new Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ),
          color: "#44ff44",
          shape: "dodecahedron",
        },
        {
          id: 3,
          mass: 10 + Math.random() * 5,
          position: new Vector3(
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5
          ),
          velocity: new Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ),
          color: "#4444ff",
          shape: "sphere",
        },
      ];
    case "figure8":
    default: {
      const colors = ["#ff4444", "#44ff44", "#4444ff"];
      const shapes: BodyState["shape"][] = ["cube", "dodecahedron", "sphere"];

      return FIGURE8_BASE_POSITIONS.map((basePos, idx) => ({
        id: idx + 1,
        mass: 1,
        position: basePos.clone().multiplyScalar(FIGURE8_SCALE),
        velocity: FIGURE8_BASE_VELOCITIES[idx]
          .clone()
          .multiplyScalar(FIGURE8_VELOCITY_SCALE),
        color: colors[idx],
        shape: shapes[idx],
        collisionRadius: 0.05,
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

        const softening = 0.1;
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

    // 4. Sync Visuals & Camera
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
      // Smoothly interpolate camera or just lock?
      // Let's lock relative offset? Or just lookAt?
      // "Follow Body" usually means camera moves with it.
      // Simple implementation: Keep camera at same relative offset
      // But OrbitControls fights this.
      // Better: Update OrbitControls target.
      setCameraTarget(focusedPos);
    }
  });

  return null;
};

const BodyMesh: React.FC<{ body: BodyState }> = ({ body }) => {
  const radius = body.radius || 1;
  return (
    <group>
      <Trail
        width={2}
        length={50}
        color={body.color}
        attenuation={(t) => t * t}
      >
        <mesh ref={body.ref} position={body.position} castShadow receiveShadow>
          {body.shape === "cube" && (
            <boxGeometry args={[radius * 1.5, radius * 1.5, radius * 1.5]} />
          )}
          {body.shape === "dodecahedron" && (
            <dodecahedronGeometry args={[radius, 0]} />
          )}
          {(body.shape === "sphere" || !body.shape) && (
            <sphereGeometry args={[radius, 32, 32]} />
          )}
          <meshStandardMaterial
            color={body.color}
            emissive={body.color}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      </Trail>
    </group>
  );
};

export const ThreeBodyScene: React.FC = () => {
  const [scenario, setScenario] = useState<ScenarioType>("figure8");
  const [key, setKey] = useState(0); // Force re-mount on reset
  const controlsRef = useRef<any>(null);

  const { gravity, timeScale, focusedBodyId } = useControls({
    gravity: { value: 1, min: 0.2, max: 3, step: 0.1, label: "Gravity (G)" },
    timeScale: { value: 1, min: 0, max: 5, step: 0.1, label: "Time Speed" },
    focusedBodyId: {
      value: 0,
      options: {
        None: 0,
        "Body 1 (Red)": 1,
        "Body 2 (Green)": 2,
        "Body 3 (Blue)": 3,
      },
      label: "Camera Focus",
    },
  });

  // Initialize bodies with refs
  const bodies = useMemo<BodyState[]>(() => {
    const initialData = getInitialBodies(scenario);
    return initialData.map((data) => ({
      ...data,
      position: data.position.clone(),
      velocity: data.velocity.clone(),
      ref: React.createRef<Mesh>(),
      shape: data.shape as BodyState["shape"],
      radius:
        data.shape === "cube" ? 1.5 : data.shape === "dodecahedron" ? 1.2 : 1,
      collisionRadius:
        data.collisionRadius ??
        (data.shape === "cube"
          ? 1.0
          : data.shape === "dodecahedron"
          ? 0.8
          : 0.6),
    }));
  }, [scenario, key]);

  const handleReset = () => {
    setKey((k) => k + 1);
  };
  const handlePerturb = () => {
    if (bodies.length > 0) {
      bodies[0].velocity.add(new Vector3(0.001, 0.001, 0.001));
    }
  };

  const setCameraTarget = (pos: Vector3) => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(pos, 0.1);
      controlsRef.current.update();
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 text-white bg-black/50 p-4 rounded backdrop-blur-sm max-w-md pointer-events-none select-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-bold mb-2">3-Body Simulation</h1>
          <p className="text-sm opacity-80 mb-4">
            Select a scenario to explore the concepts.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setScenario("2body")}
              className={`px-3 py-1 rounded text-sm ${
                scenario === "2body"
                  ? "bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              2-Body (Stable)
            </button>
            <button
              onClick={() => setScenario("figure8")}
              className={`px-3 py-1 rounded text-sm ${
                scenario === "figure8"
                  ? "bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Figure-8 (Meta-Stable)
            </button>
            <button
              onClick={() => setScenario("chaotic")}
              className={`px-3 py-1 rounded text-sm ${
                scenario === "chaotic"
                  ? "bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Random (Chaotic)
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-semibold transition-colors text-sm"
            >
              Reset Scenario
            </button>
            <button
              onClick={handlePerturb}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-semibold transition-colors text-sm"
              title="Nudge one body slightly to see the Butterfly Effect"
            >
              Nudge (Butterfly Effect)
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-300">
            {scenario === "2body" && (
              <p>
                Two bodies orbit in a predictable pattern forever. A closed-form
                solution exists.
              </p>
            )}
            {scenario === "figure8" && (
              <p>
                A rare stable solution for 3 bodies. Even tiny errors will
                eventually cause it to collapse.
              </p>
            )}
            {scenario === "chaotic" && (
              <p>
                Unpredictable movement. No formula can predict the future state
                indefinitely.
              </p>
            )}
          </div>
        </div>
      </div>

      <Canvas shadows camera={{ position: [0, 20, 40], fov: 45 }} key={key}>
        <color attach="background" args={["#050505"]} />

        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#4444ff"
        />

        {/* Environment */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <OrbitControls ref={controlsRef} />

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

        {/* Post Processing - Removed due to compatibility issues */}
        {/* <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer> */}
      </Canvas>
    </div>
  );
};
