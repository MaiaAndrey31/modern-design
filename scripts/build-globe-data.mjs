/**
 * Builds public/geo/globe.json — the compact geometry used by the
 * "From Minas to the World" globe (src/components/three/globeScene.ts).
 *
 *   node scripts/build-globe-data.mjs
 *
 * Sources (public domain / open data), fetched at build time of this file only:
 *  - Natural Earth 1:110m land + admin-0 countries (public domain)
 *  - Brazilian states GeoJSON from codeforgermany/click_that_hood (IBGE-derived)
 *
 * Output (all coordinates [lon, lat] flattened, rounded):
 *  coast   rings of every landmass outline
 *  dots    points on land, sampled on a Fibonacci sphere (the glowing map)
 *  brazil  Brazil's border
 *  mg      Minas Gerais' border (simplified)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCES = {
  land: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson",
  countries: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
  states: "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson",
};

const DOT_SAMPLES = 22000;

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

/** Polygon/MultiPolygon → list of polygons, each [outer, ...holes]. */
const polygonsOf = (geometry) => (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates);

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const flatRing = (ring, d) => ring.flatMap(([lon, lat]) => [round(lon, d), round(lat, d)]);

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bbox(ring) {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX, maxY];
}

/** Douglas–Peucker in degrees — good enough for a ~10° wide state. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const sqTol = tolerance * tolerance;
  const segDist = (p, a, b) => {
    let [x, y] = a;
    let dx = b[0] - x;
    let dy = b[1] - y;
    if (dx || dy) {
      const t = Math.max(0, Math.min(1, ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)));
      x += dx * t;
      y += dy * t;
    }
    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
  };
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxD = 0;
    let index = 0;
    for (let i = first + 1; i < last; i++) {
      const d = segDist(points[i], points[first], points[last]);
      if (d > maxD) {
        maxD = d;
        index = i;
      }
    }
    if (maxD > sqTol) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const [land, countries, states] = await Promise.all([fetchJson(SOURCES.land), fetchJson(SOURCES.countries), fetchJson(SOURCES.states)]);

// Landmasses
const landPolys = land.features.flatMap((f) => polygonsOf(f.geometry)).map((rings) => ({ rings, box: bbox(rings[0]) }));
const coast = landPolys.map(({ rings }) => flatRing(rings[0], 2));

// Glowing land dots — even spacing on the sphere, kept only over land.
const dots = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < DOT_SAMPLES; i++) {
  const y = 1 - (i / (DOT_SAMPLES - 1)) * 2;
  const theta = golden * i;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((((theta * 180) / Math.PI) % 360) + 540) % 360 - 180;
  const p = [lon, lat];
  const onLand = landPolys.some(({ rings, box }) => {
    if (lon < box[0] || lon > box[2] || lat < box[1] || lat > box[3]) return false;
    return inRing(p, rings[0]) && !rings.slice(1).some((hole) => inRing(p, hole));
  });
  if (onLand) dots.push(round(lon, 2), round(lat, 2));
}

// Brazil + Minas Gerais
const brazilFeature = countries.features.find((f) => f.properties.ADMIN === "Brazil");
const brazil = polygonsOf(brazilFeature.geometry).map((rings) => flatRing(rings[0], 2));
const mgFeature = states.features.find((f) => f.properties.name === "Minas Gerais");
const mg = polygonsOf(mgFeature.geometry).map((rings) => flatRing(simplify(rings[0], 0.025), 3));

const out = path.join(process.cwd(), "public", "geo", "globe.json");
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify({ coast, dots, brazil, mg }));
console.log(`globe.json — ${coast.length} coast rings, ${dots.length / 2} land dots, MG ${mg[0].length / 2} pts`);
