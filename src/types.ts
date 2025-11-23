import { Vector3, Mesh } from "three";

export interface BodyState {
  id: number;
  mass: number;
  position: Vector3;
  velocity: Vector3;
  color: string;
  ref: React.MutableRefObject<Mesh | null>;
  shape?: "sphere" | "cube" | "dodecahedron";
  radius?: number;
  collisionRadius?: number;
}
