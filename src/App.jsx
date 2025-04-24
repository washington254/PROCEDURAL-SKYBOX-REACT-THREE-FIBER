import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import {  Start } from "./components/Sky/Settings";
import { PerspectiveCamera } from "@react-three/drei";



function App() {
  Start();
  return (
    <Canvas shadows >
      <PerspectiveCamera makeDefault position={[3, 3, 9]} fov={70} />
      <Experience />
    </Canvas>
  );
}

export default App;
