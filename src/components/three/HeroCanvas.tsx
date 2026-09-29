"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Component, Suspense, useMemo, useRef, useEffect, type ReactNode } from "react";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./heroShader";

function RippleScene({ imageSrc }: { imageSrc: string }) {
  const texture = useTexture(imageSrc);
  const { size, viewport } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseCurrent = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(() => {
    // Three.js textures are configured imperatively after load — this is
    // standard Three.js usage and doesn't affect React's render output.
    // eslint-disable-next-line react-hooks/immutability
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = texture.image as HTMLImageElement | undefined;
    return {
      uTexture: { value: texture },
      uTexSize: { value: new THREE.Vector2(image?.width ?? 1, image?.height ?? 1) },
      uScreenSize: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);

  useEffect(() => {
    uniforms.uScreenSize.value.set(size.width, size.height);
  }, [size, uniforms]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    const targetUv = new THREE.Vector2((state.pointer.x + 1) / 2, (state.pointer.y + 1) / 2);
    const velocity = targetUv.distanceTo(mouseCurrent.current);
    mouseCurrent.current.lerp(targetUv, 0.08);

    material.uniforms.uMouse.value.copy(mouseCurrent.current);
    material.uniforms.uTime.value += delta;

    const targetIntensity = Math.min(velocity * 18, 1);
    material.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      material.uniforms.uIntensity.value,
      targetIntensity,
      0.06
    );
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

/**
 * A failed texture load (or lost WebGL context) must only drop this layer —
 * never bubble up and take the Hero down with it.
 */
class WebGLLayerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[HeroCanvas] WebGL layer disabled:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface HeroCanvasProps {
  imageSrc: string;
  active: boolean;
}

/**
 * Hero's single WebGL layer: a fullscreen plane sampling the hero photo with
 * a very subtle mouse-reactive ripple + hairline chromatic split. Purely a
 * progressive-enhancement layer over the real <Image> underneath — safe to
 * unmount at any time with no loss of content or LCP impact.
 */
export default function HeroCanvas({ imageSrc, active }: HeroCanvasProps) {
  // This component is only ever mounted client-side (dynamic import with
  // ssr:false in Hero.tsx), so reading `window` directly here is safe.
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  return (
    <WebGLLayerBoundary>
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        frameloop={active ? "always" : "never"}
        className="!absolute inset-0"
      >
        <Suspense fallback={null}>
          <RippleScene imageSrc={imageSrc} />
        </Suspense>
      </Canvas>
    </WebGLLayerBoundary>
  );
}
