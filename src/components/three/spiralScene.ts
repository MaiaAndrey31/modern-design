import * as THREE from "three";

/**
 * Spiral gallery — "frames from the road" wound onto a helix like a film
 * reel. Curved panels sit on a helix around the horizontal axis; scrolling
 * screws the helix along its own track (every panel turns AND advances), so
 * each photo in turn comes round to face the viewer. The far side shows
 * through the gaps, frosted, so the spiral reads as depth.
 *
 * Built from scratch in raw three.js (no r3f/drei) — lazy-loaded chunk.
 */

export interface SpiralSource {
  url: string;
  width: number;
  height: number;
}

export interface SpiralHandle {
  /** Target position along the helix, in panels (0 … count-1). Eased internally. */
  setTarget: (position: number) => void;
  setActive: (active: boolean) => void;
  /** Normalised pointer (-1…1) — a small camera parallax for depth. */
  setPointer: (x: number, y: number) => void;
  /** Screen rect (CSS px, relative to the canvas) of the panel facing the viewer. */
  focusRect: () => { left: number; top: number; width: number; height: number } | null;
  dispose: () => void;
}

// Helix geometry (world units).
const RADIUS = 2.3;
const PANEL_W = 3.1;
const PANEL_H = 1.85;
/** Angle and axial advance between consecutive panels. */
const STEP_ANGLE = 1.02;
const STEP_X = 0.95;
/** The whole reel is tilted a little — reads as motion, not a diagram. */
const TILT = -0.26;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vFacing;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vFacing = dot(n, normalize(-mv.xyz));
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uImage;
  uniform vec2 uPlane;
  uniform float uReady;
  uniform float uFocus;   // 1 when this panel is the one facing the viewer
  varying vec2 vUv;
  varying float vFacing;

  vec2 cover(vec2 uv) {
    float rp = uPlane.x / uPlane.y;
    float ri = uImage.x / uImage.y;
    vec2 scale = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  float roundedBox(vec2 uv, vec2 size, float r) {
    vec2 q = abs(uv - 0.5) * size - (size * 0.5 - r);
    return length(max(q, 0.0)) - r;
  }

  void main() {
    // Rounded corners (in plane units).
    float d = roundedBox(vUv, uPlane, 0.06);
    if (d > 0.0) discard;

    bool back = !gl_FrontFacing;
    vec2 uv = vUv;
    if (back) uv.x = 1.0 - uv.x;   // the far side is seen from behind
    uv = cover(uv);

    vec3 color;
    if (back) {
      // Frosted glass: a small 9-tap blur, desaturated and dimmed.
      vec3 acc = vec3(0.0);
      float b = 0.018;
      for (int x = -1; x <= 1; x++)
        for (int y = -1; y <= 1; y++)
          acc += texture2D(uTexture, uv + vec2(float(x), float(y)) * b).rgb;
      color = acc / 9.0;
      float l = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(l), color, 0.35) * 0.42;
    } else {
      color = texture2D(uTexture, uv).rgb;
      // Panels turning away fall into shadow; the focused one is lit.
      float light = smoothstep(0.0, 1.0, vFacing);
      float l = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(l), color, 0.55 + 0.45 * uFocus);
      color *= 0.38 + 0.52 * light + 0.12 * uFocus;
    }

    // Hairline edge light on every frame (keeps the reel legible even with
    // dark photos) — warm and brighter on the one facing the viewer.
    float edge = smoothstep(-0.014, 0.0, d);
    vec3 rim = mix(vec3(0.55, 0.53, 0.5), vec3(0.95, 0.72, 0.36), uFocus);
    color += rim * edge * (back ? 0.08 : 0.16 + 0.32 * uFocus);

    float alpha = uReady * (back ? 0.62 : 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

/** One shared geometry: a plane bent onto the helix cylinder (radius RADIUS). */
function curvedPanel() {
  const geometry = new THREE.PlaneGeometry(PANEL_W, PANEL_H, 24, 24);
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const phi = y / RADIUS;
    pos.setY(i, RADIUS * Math.sin(phi));
    pos.setZ(i, RADIUS * Math.cos(phi) - RADIUS);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createSpiral(canvas: HTMLCanvasElement, sources: SpiralSource[], onIndex: (index: number) => void): SpiralHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0, 8.6);

  const reel = new THREE.Group();
  reel.rotation.z = TILT;
  scene.add(reel);

  const geometry = curvedPanel();
  const panels = sources.map((source) => {
    const texture = new THREE.Texture();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTexture: { value: texture },
        uImage: { value: new THREE.Vector2(source.width || 1, source.height || 1) },
        uPlane: { value: new THREE.Vector2(PANEL_W, PANEL_H) },
        uReady: { value: 0 },
        uFocus: { value: 0 },
      },
    });
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      texture.image = image;
      texture.needsUpdate = true;
      material.uniforms.uImage.value.set(image.naturalWidth, image.naturalHeight);
      // Fade in rather than pop.
      const start = performance.now();
      const fade = () => {
        const t = Math.min(1, (performance.now() - start) / 700);
        material.uniforms.uReady.value = t;
        if (t < 1) requestAnimationFrame(fade);
      };
      requestAnimationFrame(fade);
    };
    image.src = source.url;

    const mesh = new THREE.Mesh(geometry, material);
    reel.add(mesh);
    return { mesh, material, focus: 0 };
  });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the reel's scale readable on narrower desktop windows.
    camera.position.z = w / h < 1.4 ? 10.5 : 8.6;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  let target = 0;
  let current = 0;
  let pointerX = 0;
  let pointerY = 0;
  let camX = 0;
  let camY = 0;
  let lastIndex = -1;
  let active = false;
  let frame = 0;

  /** Place every panel on the helix for the current position. */
  const layout = () => {
    panels.forEach((panel, i) => {
      const s = i - current; // helix parameter relative to the front
      const theta = s * STEP_ANGLE;
      const { mesh } = panel;
      mesh.visible = Math.abs(s) < 7.5;
      if (!mesh.visible) return;
      mesh.position.set(s * STEP_X, RADIUS * Math.sin(theta), RADIUS * Math.cos(theta) - RADIUS);
      mesh.rotation.set(-theta, 0, 0);
      // Focus: 1 at the front, fading within half a step.
      const f = Math.max(0, 1 - Math.abs(s) * 1.6);
      panel.focus += (f - panel.focus) * 0.2;
      panel.material.uniforms.uFocus.value = panel.focus;
    });
  };

  const render = () => {
    current += (target - current) * 0.085;
    if (Math.abs(target - current) < 0.0005) current = target;

    camX += (pointerX * 0.45 - camX) * 0.05;
    camY += (pointerY * 0.3 - camY) * 0.05;
    camera.position.x = camX;
    camera.position.y = camY;
    camera.lookAt(0, 0, -RADIUS * 0.4);

    layout();
    renderer.render(scene, camera);

    const index = Math.max(0, Math.min(panels.length - 1, Math.round(current)));
    if (index !== lastIndex) {
      lastIndex = index;
      onIndex(index);
    }
    if (active) frame = requestAnimationFrame(render);
  };

  const corner = new THREE.Vector3();

  return {
    setTarget(position) {
      target = Math.max(0, Math.min(panels.length - 1, position));
    },
    setActive(value) {
      if (value === active) return;
      active = value;
      cancelAnimationFrame(frame);
      if (active) frame = requestAnimationFrame(render);
    },
    setPointer(x, y) {
      pointerX = x;
      pointerY = y;
    },
    focusRect() {
      const panel = panels[Math.round(current)];
      if (!panel) return null;
      panel.mesh.updateMatrixWorld();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const phi = (y * PANEL_H) / 2 / RADIUS;
        corner.set((x * PANEL_W) / 2, RADIUS * Math.sin(phi), RADIUS * Math.cos(phi) - RADIUS);
        corner.applyMatrix4(panel.mesh.matrixWorld).project(camera);
        const sx = ((corner.x + 1) / 2) * w;
        const sy = ((1 - corner.y) / 2) * h;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    },
    dispose() {
      active = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      panels.forEach((p) => {
        (p.material.uniforms.uTexture.value as THREE.Texture).dispose();
        p.material.dispose();
      });
      geometry.dispose();
      renderer.dispose();
    },
  };
}
