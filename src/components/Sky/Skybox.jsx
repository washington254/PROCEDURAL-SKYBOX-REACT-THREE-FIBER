import { BufferAttribute, BufferGeometry, MathUtils, Matrix3, Mesh, Uniform, Vector3 } from "three";
import { fragment, vertex } from "./SkyboxShader.js";

import { useFrame, useThree } from '@react-three/fiber';
import { Random } from './Random.js';


import React, { useRef, useMemo, useEffect } from 'react';
import {  extend } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader, DataTexture, RepeatWrapping } from 'three';



class SkyboxMaterial extends THREE.ShaderMaterial {
    constructor() {
      super({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          _SkyRotationMatrix: { value: new THREE.Matrix3() },
          _DitherTexture: { value: null },
          _DitherTextureSize: { value: new THREE.Vector2() },
          _SunVisibility: { value: 1.0 },
          _TwilightTime: { value: 0.0 },
          _TwilightVisibility: { value: 0.0 },
          _MoonVisibility: { value: 0.0 },
          _GridSize: { value: 64 },
          _GridSizeScaled: { value: 64 * 6 },
          _Stars: { value: null },
          _SpecularVisibility: { value: 1.0 },
          _DirToLight: { value: new THREE.Vector3(0, 1, 0) },
          _Light: { value: new THREE.Vector3(1, 1, 1) }
        }
      });
    }
  }
  
extend({ SkyboxMaterial });

export const ProceduralSkybox = ({ 
    speed = 0.05, 
    size = 2000, 
    starsSeed = 87, 
    gridSize = 64, 
    starsCount = 10000, 
    maxOffset = 0.43, 
    ...props 
  }) => {
    const meshRef = useRef();
    const materialRef = useRef();
    const rotationMatrix = useRef(new THREE.Matrix3());
    const dirToLight = useRef(new THREE.Vector3(0, 1, 0));
    const clock = useRef(new THREE.Clock());
    const angle = useRef(-1);
    
    // Create axis for rotation
    const axis = useMemo(() => {
      return new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0), 
        MathUtils.degToRad(-30)
      );
    }, []);
    
    // Create initial vector
    const initial = useMemo(() => new THREE.Vector3(0, 1, 0), []);
    
    // Set up dither texture
    const ditherTexture = useMemo(() => {
      const loader = new TextureLoader();
      const texture = loader.load('/bluenoise.png');
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      return texture;
    }, []);
    
    // Generate stars texture
    const starsTexture = useMemo(() => {
      const starsMap = new Uint8Array(gridSize * gridSize * 24);
      const random = new Random(starsSeed);
      
      const Vector3ToStarMap = (dir, value) => {
        const absDir = new Vector3(Math.abs(dir.x), Math.abs(dir.y), Math.abs(dir.z));
        
        const xPositive = dir.x > 0;
        const yPositive = dir.y > 0;
        const zPositive = dir.z > 0;
        
        let maxAxis = 0;
        let u = 0;
        let v = 0;
        let i = 0;
        
        if (xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z) {
          maxAxis = absDir.x;
          u = -dir.z;
          v = dir.y;
          i = 0;
        }
        
        if (!xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z) {
          maxAxis = absDir.x;
          u = dir.z;
          v = dir.y;
          i = 1;
        }
        
        if (yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z) {
          maxAxis = absDir.y;
          u = dir.x;
          v = -dir.z;
          i = 2;
        }
        
        if (!yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z) {
          maxAxis = absDir.y;
          u = dir.x;
          v = dir.z;
          i = 3;
        }
        
        if (zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y) {
          maxAxis = absDir.z;
          u = dir.x;
          v = dir.y;
          i = 4;
        }
        
        if (!zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y) {
          maxAxis = absDir.z;
          u = -dir.x;
          v = dir.y;
          i = 5;
        }
        
        u = Math.floor((u / maxAxis + 1) * 0.5 * gridSize);
        v = Math.floor((v / maxAxis + 1) * 0.5 * gridSize);
        
        const j = (v * gridSize * 6 + i * gridSize + u) * 4;
        starsMap[j] = value[0];
        starsMap[j + 1] = value[1];
        starsMap[j + 2] = value[2];
        starsMap[j + 3] = value[3];
      };
      
      for (let i = 0; i < starsCount; i++) {
        const a = random.Next() * Math.PI * 2;
        const b = random.Next() * 2 - 1;
        const c = Math.sqrt(1 - b * b);
        const target = new Vector3(Math.cos(a) * c, Math.sin(a) * c, b);
        Vector3ToStarMap(target, [
          MathUtils.lerp(0.5 - maxOffset, 0.5 + maxOffset, random.Next()) * 255, 
          MathUtils.lerp(0.5 - maxOffset, 0.5 + maxOffset, random.Next()) * 255, 
          Math.pow(random.Next(), 6) * 255, 
          random.Next() * 255
        ]);
      }
      
      const texture = new DataTexture(starsMap, gridSize * 6, gridSize);
      texture.needsUpdate = true;
      return texture;
    }, [gridSize, starsSeed, starsCount, maxOffset]);
    
    // Create skybox geometry
    const geometry = useMemo(() => {

        const halfSize = size / 4;
      
    const vertices = new Float32Array
       ([
           -halfSize, -halfSize, -halfSize,
           halfSize, -halfSize, -halfSize,
           -halfSize, -halfSize, halfSize,
           halfSize, -halfSize, halfSize,
   
           -halfSize, halfSize, -halfSize,
           halfSize, halfSize, -halfSize,
           -halfSize, halfSize, halfSize,
           halfSize, halfSize, halfSize
       ]);
   
       const indices = 
       [
           2, 3, 0, 3, 1, 0,
           0, 1, 4, 1, 5, 4,
           1, 3, 5, 3, 7, 5,
           3, 2, 7, 2, 6, 7,
           2, 0, 6, 0, 4, 6,
           4, 5, 6, 5, 7, 6
       ];
   
       const geo = new BufferGeometry();
       geo.setAttribute("position", new BufferAttribute(vertices, 3));
       geo.setAttribute("coord", new BufferAttribute(vertices, 3));
       geo.setIndex(indices);
      
      return geo;
    }, [size]);
    
    // Helper function to set rotation matrix
    const setSkyRotationMatrix = (angle) => {
      const cos = Math.cos(angle);
      const cos1 = 1 - cos;
      const sin = Math.sin(angle);
      const u = axis;
      const u2 = new THREE.Vector3().copy(axis).multiply(axis);
      
      rotationMatrix.current.set(
        cos + u2.x * cos1, u.x * u.y * cos1 - u.z * sin, u.x * u.z * cos1 + u.y * sin,
        u.y * u.x * cos1 + u.z * sin, cos + u2.y * cos1, u.y * u.z * cos1 - u.x * sin,
        u.z * u.x * cos1 - u.y * sin, u.z * u.y * cos1 + u.x * sin, cos + u2.z * cos1
      );
      
      return rotationMatrix.current;
    };
    
    // Initialize
    useEffect(() => {
      if (!materialRef.current) return;
      
      // Start the clock
      clock.current.start();
      
      // Set dither texture and size
      if (ditherTexture.image) {
        materialRef.current.uniforms._DitherTextureSize.value.set(
          ditherTexture.image.width,
          ditherTexture.image.height
        );
      }
      materialRef.current.uniforms._DitherTexture.value = ditherTexture;
      
      // Set stars texture
      materialRef.current.uniforms._Stars.value = starsTexture;
      
      // Initialize rotation
      const matrix = setSkyRotationMatrix(angle.current);
      materialRef.current.uniforms._SkyRotationMatrix.value = matrix;
      
      // Initialize light direction
      initial.copy(new THREE.Vector3(0, 1, 0));
      initial.applyMatrix3(matrix);
      dirToLight.current.set(-initial.x, initial.y, -initial.z);
      initial.set(0, 1, 0);
      
    }, [ditherTexture, starsTexture, initial, axis]);
    
    // Update each frame
    useFrame(({ camera }) => {
      if (!materialRef.current || !meshRef.current) return;
      
      // Update time
      const deltaTime = clock.current.getDelta();
      
      // Update rotation
      angle.current += deltaTime * speed;
      const matrix = setSkyRotationMatrix(angle.current);
      materialRef.current.uniforms._SkyRotationMatrix.value = matrix;
      
      // Update light direction
      initial.copy(new THREE.Vector3(0, 1, 0));
      initial.applyMatrix3(matrix);
      dirToLight.current.set(-initial.x, initial.y, -initial.z);
      materialRef.current.uniforms._DirToLight.value = dirToLight.current;
      initial.set(0, 1, 0);
      
      // Update sun/moon visibility
      const up = new THREE.Vector3(0, 1, 0);
      const intensity = dirToLight.current.dot(up);
      const sunVisibility = MathUtils.clamp((intensity + 0.1) * 2, 0, 1);
      const twilightTime = MathUtils.clamp((intensity + 0.1) * 3, 0, 1);
      const twilightVisibility = 1 - Math.min(Math.abs(intensity * 3), 1);
      const specularVisibility = Math.sqrt(sunVisibility);
      const l = Math.min(sunVisibility + 0.333, 1);
      
      materialRef.current.uniforms._SunVisibility.value = sunVisibility;
      materialRef.current.uniforms._TwilightTime.value = twilightTime;
      materialRef.current.uniforms._TwilightVisibility.value = twilightVisibility;
      materialRef.current.uniforms._SpecularVisibility.value = specularVisibility;
      materialRef.current.uniforms._Light.value.set(l, l, l);
      
      // Update skybox position to follow camera
      meshRef.current.position.copy(camera.position);
    });
    
    return (
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        {...props}
      >
        <skyboxMaterial ref={materialRef} />
      </mesh>
    );
  };
  