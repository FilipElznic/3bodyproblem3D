import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Trail } from "@react-three/drei";
import { Vector3, Mesh } from "three";
import { BodyState } from "../types";

// Constants
const G = 0.5; // Gravitational constant (tweaked for visual effect)
const TIME_STEP = 0.016; // Approx 60FPS
const SUB_STEPS = 4; // Physics sub-steps for stability

// Scenarios
type ScenarioType = "figure8" | "2body" | "chaotic";

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
    default:
      return [
        {
          id: 1,
          mass: 10,
          position: new Vector3(10, 0, 0),
          velocity: new Vector3(0, 1.5, 0.5),
          color: "#ff4444",
          shape: "cube",
        },
        {
          id: 2,
          mass: 10,
          position: new Vector3(-10, 0, 0),
          velocity: new Vector3(0, -1.5, -0.5),
          color: "#44ff44",
          shape: "dodecahedron",
        },
        {
          id: 3,
          mass: 10,
          position: new Vector3(0, 10, 0),
          velocity: new Vector3(-1.5, 0, 0),
          color: "#4444ff",
          shape: "sphere",
        },
      ];
  }
};

const SimulationLoop: React.FC<{ bodies: BodyState[] }> = ({ bodies }) => {
  // Temporary vectors for calculation to avoid garbage collection
  const force = useMemo(() => new Vector3(), []);
  const diff = useMemo(() => new Vector3(), []);

  useFrame(() => {
    // Run physics sub-steps
    for (let step = 0; step < SUB_STEPS; step++) {
      const dt = TIME_STEP / SUB_STEPS;

      // 1. Calculate Forces
      // Reset forces for this step (we'll just calculate acceleration directly)
      // But to be clean, let's compute net forces or accelerations.

      // We need to store current accelerations to update velocities
      // Let's compute velocity updates directly based on forces from other bodies

      for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i];

        // Calculate total force on bodyA
        force.set(0, 0, 0);

        for (let j = 0; j < bodies.length; j++) {
          if (i === j) continue;
          const bodyB = bodies[j];

          // Vector from A to B
          diff.copy(bodyB.position).sub(bodyA.position);

          const distSq = diff.lengthSq();
          const dist = Math.sqrt(distSq);

          // Softening parameter to avoid singularities if they collide
          const softening = 0.5;

          // F = G * m1 * m2 / r^2
          // F_vector = F * normalize(diff)
          // F_vector = (G * m1 * m2 / r^2) * (diff / r)
          // F_vector = G * m1 * m2 * diff / r^3

          const fMagnitude =
            (G * bodyA.mass * bodyB.mass) / Math.pow(dist + softening, 3);

          // Add force contribution
          force.addScaledVector(diff, fMagnitude);
        }

        // 2. Update Velocity (Semi-Implicit Euler: Velocity first)
        // F = ma => a = F/m
        // v_new = v_old + a * dt
        const acceleration = force.divideScalar(bodyA.mass);
        bodyA.velocity.addScaledVector(acceleration, dt);
      }

      // 3. Update Position (Semi-Implicit Euler: Position second, using new velocity)
      // p_new = p_old + v_new * dt
      for (let i = 0; i < bodies.length; i++) {
        bodies[i].position.addScaledVector(bodies[i].velocity, dt);
      }
    }

    // 4. Sync Visuals
    for (const body of bodies) {
      if (body.ref.current) {
        body.ref.current.position.copy(body.position);
      }
    }
  });

  return null;
};

const BodyMesh: React.FC<{ body: BodyState }> = ({ body }) => {
  return (
    <group>
      <Trail
        width={2}
        length={50}
        color={body.color}
        attenuation={(t) => t * t}
      >
        <mesh ref={body.ref} position={body.position} castShadow receiveShadow>
          {body.shape === "cube" && <boxGeometry args={[1.5, 1.5, 1.5]} />}
          {body.shape === "dodecahedron" && (
            <dodecahedronGeometry args={[1, 0]} />
          )}
          {(body.shape === "sphere" || !body.shape) && (
            <sphereGeometry args={[1, 32, 32]} />
          )}
          <meshStandardMaterial
            color={body.color}
            emissive={body.color}
            emissiveIntensity={0.2}
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

  // Initialize bodies with refs
  const bodies = useMemo<BodyState[]>(() => {
    const initialData = getInitialBodies(scenario);
    return initialData.map((data) => ({
      ...data,
      position: data.position.clone(),
      velocity: data.velocity.clone(),
      ref: React.createRef<Mesh>(),
      shape: data.shape as BodyState["shape"],
    }));
  }, [scenario, key]);

  const handleReset = () => {
    setKey((k) => k + 1);
  };

  const handlePerturb = () => {
    // Apply a tiny random force to the first body
    if (bodies.length > 0) {
      bodies[0].velocity.add(new Vector3(0.001, 0.001, 0.001));
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 text-white bg-black/50 p-4 rounded backdrop-blur-sm max-w-md">
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
        <OrbitControls />

        {/* Simulation Logic */}
        <SimulationLoop bodies={bodies} />

        {/* Visuals */}
        {bodies.map((body) => (
          <BodyMesh key={body.id} body={body} />
        ))}
      </Canvas>
    </div>
  );
};
