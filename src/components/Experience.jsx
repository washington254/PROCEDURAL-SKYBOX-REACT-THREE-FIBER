import { OrbitControls } from "@react-three/drei";
import { ProceduralSkybox } from "./Sky/Skybox.jsx";

export const Experience = () => {

  return (
    <>
      <ProceduralSkybox />   
      <OrbitControls   />
      <mesh>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial color="green" />
      </mesh>
    </>
  );
};
