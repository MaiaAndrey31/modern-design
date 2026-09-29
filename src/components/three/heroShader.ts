export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fullscreen "cover" texture sample with a very subtle mouse-reactive ripple
 * displacement + a hairline chromatic split only inside the ripple — the one
 * WebGL language chosen for the Hero (see README/architecture notes).
 */
export const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uTexSize;
  uniform vec2 uScreenSize;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    vec2 s = uScreenSize;
    vec2 i = uTexSize;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 newSize = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((newSize.x - s.x) / 2.0, 0.0) : vec2(0.0, (newSize.y - s.y) / 2.0)) / newSize;
    return uv * s / newSize + offset;
  }

  void main() {
    vec2 uv = coverUv(vUv);

    float dist = distance(vUv, uMouse);
    float ripple = smoothstep(0.4, 0.0, dist) * uIntensity;
    vec2 dir = normalize(vUv - uMouse + 1e-4);
    vec2 displaced = uv + dir * ripple * 0.05 * sin(uTime * 0.6);

    float split = ripple * 0.006;
    float r = texture2D(uTexture, displaced + dir * split).r;
    float g = texture2D(uTexture, displaced).g;
    float b = texture2D(uTexture, displaced - dir * split).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;
