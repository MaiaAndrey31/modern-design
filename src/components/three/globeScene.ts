import * as THREE from "three";

/**
 * "From Minas to the World" globe — raw three.js (no r3f/drei) so this chunk
 * stays small and fully lazy.
 *
 *  - dark occluding sphere, soft warm rim + atmosphere halo
 *  - the world drawn in light: glowing land dots + coastlines
 *    (Natural Earth 1:110m, pre-baked by scripts/build-globe-data.mjs)
 *  - Brazil's border in bronze, Minas Gerais filled and glowing as the origin
 *  - routes from Minas that draw progressively with scroll, each led by a
 *    small airplane oriented along its flight path
 *
 * Destinations are places tied to the artist's actual career.
 */

export interface GlobeData {
  coast: number[][];
  dots: number[];
  brazil: number[][];
  mg: number[][];
}

type LatLon = [lat: number, lon: number];

const DESTINATIONS: { at: LatLon; window: [number, number] }[] = [
  { at: [-19.87, -43.97], window: [0.1, 0.26] }, // Belo Horizonte — Mineirão (2014)
  { at: [-22.91, -43.17], window: [0.22, 0.4] }, // Rio de Janeiro (2016)
  { at: [-23.55, -46.63], window: [0.34, 0.52] }, // São Paulo — Copa América (2019)
  { at: [55.75, 37.62], window: [0.46, 0.86] }, // Moscow — World Cup (2018)
];

const GOLD = new THREE.Color("#d9a94e");
const GOLD_LIGHT = new THREE.Color("#ffd98a");
const LIGHT = new THREE.Color("#f3ead6");
const DEG = Math.PI / 180;

const R_LAND = 1.0;
const R_COAST = 1.003;
const R_BRAZIL = 1.004;
const R_MG = 1.006;

function toVec(lat: number, lon: number, radius = 1) {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  return new THREE.Vector3(Math.cos(phi) * Math.sin(lambda), Math.sin(phi), Math.cos(phi) * Math.cos(lambda)).multiplyScalar(radius);
}

/** Flattened [lon, lat, …] rings → one LineSegments-ready position buffer on the sphere. */
function ringsToSegments(rings: number[][], radius: number) {
  const out: number[] = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 2; i += 2) {
      const a = toVec(ring[i + 1], ring[i], radius);
      const b = toVec(ring[i + 3], ring[i + 2], radius);
      out.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  return new THREE.Float32BufferAttribute(out, 3);
}

function centroid(ring: number[]): LatLon {
  let lon = 0;
  let lat = 0;
  const n = ring.length / 2;
  for (let i = 0; i < ring.length; i += 2) {
    lon += ring[i];
    lat += ring[i + 1];
  }
  return [lat / n, lon / n];
}

/** Top-view airliner silhouette, nose on +X, ~1 unit long. */
function airplaneGeometry() {
  const half: [number, number][] = [
    [0.5, 0],
    [0.42, 0.045],
    [0.12, 0.055],
    [-0.08, 0.46],
    [-0.19, 0.46],
    [-0.08, 0.055],
    [-0.36, 0.05],
    [-0.47, 0.19],
    [-0.54, 0.19],
    [-0.5, 0.0],
  ];
  const pts = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [x, -y] as [number, number])];
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ShapeGeometry(shape);
}

/** Soft radial glow disc (used under MG and under each plane). */
function glowMaterial(color: THREE.Color, strength: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uStrength: { value: strength } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5));
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, a * a * uStrength);
      }
    `,
  });
}

/** Orients an object lying flat on the sphere at `point`, facing `forward`. */
const basisX = new THREE.Vector3();
const basisY = new THREE.Vector3();
const basisZ = new THREE.Vector3();
const basis = new THREE.Matrix4();
function orientOnSphere(object: THREE.Object3D, point: THREE.Vector3, forward: THREE.Vector3) {
  basisZ.copy(point).normalize();
  basisY.crossVectors(basisZ, forward).normalize();
  basisX.crossVectors(basisY, basisZ).normalize();
  basis.makeBasis(basisX, basisY, basisZ);
  object.quaternion.setFromRotationMatrix(basis);
  object.position.copy(point);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface GlobeHandle {
  setProgress: (progress: number) => void;
  setActive: (active: boolean) => void;
  resize: () => void;
  dispose: () => void;
}

export function createMinasGlobe(canvas: HTMLCanvasElement, data: GlobeData): GlobeHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 4.6);

  const globe = new THREE.Group();
  scene.add(globe);

  /* ---------------- Core + atmosphere ---------------- */
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.99, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: { uRim: { value: new THREE.Color("#b9ab8c") } },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uRim;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
          gl_FragColor = vec4(mix(vec3(0.018), uRim, rim * 0.45), 1.0);
        }
      `,
    })
  );
  globe.add(core);

  // Halo sits outside the rotating group so it never "turns".
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 64, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color("#e9dcc0") } },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying vec3 vNormal;
        void main() {
          float i = pow(max(0.0, 0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.2);
          gl_FragColor = vec4(uColor, i * 0.55);
        }
      `,
    })
  );
  scene.add(atmosphere);

  /* ---------------- The world, drawn in light ---------------- */
  const dotCount = data.dots.length / 2;
  const dotPositions = new Float32Array(dotCount * 3);
  const dotSeeds = new Float32Array(dotCount);
  for (let i = 0; i < dotCount; i++) {
    const v = toVec(data.dots[i * 2 + 1], data.dots[i * 2], R_LAND);
    dotPositions.set([v.x, v.y, v.z], i * 3);
    dotSeeds[i] = Math.random() * Math.PI * 2;
  }
  const dotsGeometry = new THREE.BufferGeometry();
  dotsGeometry.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
  dotsGeometry.setAttribute("aSeed", new THREE.BufferAttribute(dotSeeds, 1));
  const dotsMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: LIGHT },
      uSize: { value: 15 * pixelRatio },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      attribute float aSeed;
      varying float vTwinkle;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTwinkle = 0.72 + 0.28 * sin(uTime * 1.3 + aSeed * 7.0);
        gl_PointSize = uSize / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.22, 0.0, d);
        float glow = smoothstep(0.5, 0.0, d) * 0.35;
        gl_FragColor = vec4(uColor, (core + glow) * vTwinkle * 0.8);
      }
    `,
  });
  globe.add(new THREE.Points(dotsGeometry, dotsMaterial));

  const coastGeometry = new THREE.BufferGeometry();
  coastGeometry.setAttribute("position", ringsToSegments(data.coast, R_COAST));
  globe.add(
    new THREE.LineSegments(
      coastGeometry,
      new THREE.LineBasicMaterial({ color: LIGHT, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending })
    )
  );

  const brazilGeometry = new THREE.BufferGeometry();
  brazilGeometry.setAttribute("position", ringsToSegments(data.brazil, R_BRAZIL));
  globe.add(
    new THREE.LineSegments(
      brazilGeometry,
      new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending })
    )
  );

  /* ---------------- Minas Gerais — the origin ---------------- */
  const mgRing = data.mg[0];
  const [mgLat, mgLon] = centroid(mgRing);
  const mgShape = new THREE.Shape();
  for (let i = 0; i < mgRing.length; i += 2) {
    if (i === 0) mgShape.moveTo(mgRing[i], mgRing[i + 1]);
    else mgShape.lineTo(mgRing[i], mgRing[i + 1]);
  }
  // Triangulated flat in lon/lat, then wrapped onto the sphere (MG is small
  // enough that the chord error is invisible).
  const mgFillGeometry = new THREE.ShapeGeometry(mgShape);
  const mgPos = mgFillGeometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < mgPos.count; i++) {
    const v = toVec(mgPos.getY(i), mgPos.getX(i), R_MG);
    mgPos.setXYZ(i, v.x, v.y, v.z);
  }
  mgFillGeometry.computeBoundingSphere();
  const mgFillMaterial = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  globe.add(new THREE.Mesh(mgFillGeometry, mgFillMaterial));

  const mgOutlineGeometry = new THREE.BufferGeometry();
  mgOutlineGeometry.setAttribute("position", ringsToSegments(data.mg, R_MG + 0.001));
  globe.add(
    new THREE.LineSegments(
      mgOutlineGeometry,
      new THREE.LineBasicMaterial({ color: GOLD_LIGHT, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending })
    )
  );

  const origin = toVec(mgLat, mgLon, R_MG + 0.002);
  const north = toVec(mgLat + 1, mgLon, R_MG + 0.002).sub(origin).normalize();

  const mgGlowMaterial = glowMaterial(GOLD, 0.6);
  const mgGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), mgGlowMaterial);
  orientOnSphere(mgGlow, origin, north);
  globe.add(mgGlow);

  const pulseMaterial = new THREE.MeshBasicMaterial({ color: GOLD_LIGHT, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const pulse = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.106, 64), pulseMaterial);
  orientOnSphere(pulse, origin, north);
  globe.add(pulse);

  /* ---------------- Routes + airplanes ---------------- */
  const TUBULAR = 160;
  const RADIAL = 6;
  const planeGeometry = airplaneGeometry();
  const planeGlowGeometry = new THREE.PlaneGeometry(1, 1);
  const markerGeometry = new THREE.SphereGeometry(0.014, 16, 16);

  const routes = DESTINATIONS.map(({ at, window: w }) => {
    const target = toVec(at[0], at[1], R_MG);
    const distance = origin.distanceTo(target);
    const lift = 1 + Math.min(0.5, 0.1 + distance * 0.3);
    const mid = origin.clone().add(target).multiplyScalar(0.5).normalize().multiplyScalar(lift);
    const curve = new THREE.QuadraticBezierCurve3(origin.clone(), mid, target);

    const line = new THREE.TubeGeometry(curve, TUBULAR, 0.0042, RADIAL, false);
    const glow = new THREE.TubeGeometry(curve, TUBULAR, 0.013, RADIAL, false);
    line.setDrawRange(0, 0);
    glow.setDrawRange(0, 0);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: GOLD_LIGHT, transparent: true, opacity: 0.95, depthWrite: false });
    const glowMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
    globe.add(new THREE.Mesh(line, lineMaterial), new THREE.Mesh(glow, glowMat));

    const planeMaterial = new THREE.MeshBasicMaterial({ color: "#fff8ea", transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    const planeScale = 0.075 + Math.min(0.03, distance * 0.02);
    plane.scale.setScalar(planeScale);
    const planeGlowMaterial = glowMaterial(LIGHT, 0);
    const planeGlow = new THREE.Mesh(planeGlowGeometry, planeGlowMaterial);
    planeGlow.scale.setScalar(planeScale * 2.4);
    globe.add(planeGlow, plane);

    const dotMaterial = new THREE.MeshBasicMaterial({ color: "#fffaf0", transparent: true, opacity: 0 });
    const dot = new THREE.Mesh(markerGeometry, dotMaterial);
    dot.position.copy(target);
    globe.add(dot);

    return { curve, line, glow, window: w, plane, planeMaterial, planeGlow, planeGlowMaterial, dotMaterial };
  });

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  /* ---------------- Camera path ---------------- */
  // Start facing Minas; end framing Brazil → Russia together.
  const START = { lat: mgLat + 3, lon: mgLon };
  const END = { lat: 10, lon: -9 };

  let progress = 0;
  let active = false;
  let frame = 0;
  let drift = 0;

  const apply = () => {
    const eased = easeInOut(clamp01(progress / 0.9));
    const lat = START.lat + (END.lat - START.lat) * eased;
    const lon = START.lon + (END.lon - START.lon) * eased;
    globe.rotation.set(lat * DEG, -lon * DEG + drift, 0);

    routes.forEach((route) => {
      const [a, b] = route.window;
      const t = easeInOut(clamp01((progress - a) / (b - a)));
      const count = Math.floor(TUBULAR * t) * RADIAL * 6;
      route.line.setDrawRange(0, count);
      route.glow.setDrawRange(0, count);

      // The airplane leads the line while in flight, then lands and fades.
      const inFlight = t > 0.001 && t < 0.999;
      const fadeIn = clamp01(t / 0.06);
      const fadeOut = clamp01((1 - t) / 0.08);
      const alpha = inFlight ? Math.min(fadeIn, fadeOut) : 0;
      route.planeMaterial.opacity = alpha;
      route.planeGlowMaterial.uniforms.uStrength.value = alpha * 0.55;
      route.plane.visible = route.planeGlow.visible = alpha > 0;
      if (alpha > 0) {
        const u = Math.max(0.001, Math.min(0.999, t));
        route.curve.getPointAt(u, point);
        route.curve.getTangentAt(u, tangent);
        point.multiplyScalar(1.004);
        orientOnSphere(route.plane, point, tangent);
        orientOnSphere(route.planeGlow, point, tangent);
      }

      route.dotMaterial.opacity = t >= 0.999 ? 1 : 0;
    });
  };

  const render = (now: number) => {
    // Barely-there idle drift so the sculpture feels alive even when scroll stops.
    drift = Math.sin(now * 0.00012) * 0.06;
    dotsMaterial.uniforms.uTime.value = now / 1000;
    const phase = (now % 2600) / 2600;
    pulse.scale.setScalar(1 + phase * 1.6);
    pulseMaterial.opacity = 0.7 * (1 - phase);
    mgGlowMaterial.uniforms.uStrength.value = 0.5 + Math.sin(now * 0.002) * 0.12;
    apply();
    renderer.render(scene, camera);
    if (active) frame = requestAnimationFrame(render);
  };

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!active) renderer.render(scene, camera);
  };

  resize();
  apply();
  renderer.render(scene, camera);

  return {
    setProgress(value) {
      progress = clamp01(value);
      if (!active) {
        apply();
        renderer.render(scene, camera);
      }
    },
    setActive(value) {
      if (value === active) return;
      active = value;
      cancelAnimationFrame(frame);
      if (active) frame = requestAnimationFrame(render);
    },
    resize,
    dispose() {
      active = false;
      cancelAnimationFrame(frame);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      renderer.dispose();
    },
  };
}
