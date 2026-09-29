import { useId, type CSSProperties } from "react";

interface VinylProps {
  className?: string;
  style?: CSSProperties;
  /** Small arc lettering around the label edge. */
  labelText?: string;
}

const GROOVES = Array.from({ length: 46 }, (_, i) => 72 + i * 2.6);
const TRACK_GAPS = [104, 138, 166];

/**
 * Pure SVG/CSS record — no raster. Structure (class hooks used by GSAP):
 *  .vinyl-spin    rotating group (grooves + label)
 *  .vinyl-body    disc + grooves
 *  .vinyl-label   bronze centre label
 *  .vinyl-mark    the "AS" letters
 *  .vinyl-sheen   static light reflection — stays put while the disc spins,
 *                 which is what sells the "real record under a light" look.
 */
export function Vinyl({ className, style, labelText = "ALAN SAHER · SUL DE MINAS · EST. 1993 · " }: VinylProps) {
  const id = useId().replace(/:/g, "");

  return (
    <div className={`vinyl relative aspect-square ${className ?? ""}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <radialGradient id={`disc-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#141414" />
            <stop offset="70%" stopColor="#0b0b0b" />
            <stop offset="96%" stopColor="#070707" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </radialGradient>
          <radialGradient id={`label-${id}`} cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#ecc47a" />
            <stop offset="55%" stopColor="#d9a94e" />
            <stop offset="100%" stopColor="#8f6424" />
          </radialGradient>
          <path id={`arc-${id}`} d="M200,200 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" />
        </defs>

        <g className="vinyl-spin" style={{ transformOrigin: "200px 200px", transformBox: "view-box" }}>
          <g className="vinyl-body">
            <circle cx="200" cy="200" r="198" fill={`url(#disc-${id})`} />
            <circle cx="200" cy="200" r="197" fill="none" stroke="#2a2a2a" strokeWidth="1" />
            {GROOVES.map((r) => (
              <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.035" strokeWidth="0.6" />
            ))}
            {TRACK_GAPS.map((r) => (
              <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#000" strokeOpacity="0.9" strokeWidth="2.2" />
            ))}
            {/* Asymmetric groove highlight so the rotation actually reads. */}
            <path d="M200 12 A188 188 0 0 1 350 90" fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" />
            <path d="M200 388 A188 188 0 0 1 58 318" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
          </g>

          <g className="vinyl-label" style={{ transformOrigin: "200px 200px", transformBox: "view-box" }}>
            <circle cx="200" cy="200" r="66" fill={`url(#label-${id})`} />
            <circle cx="200" cy="200" r="61" fill="none" stroke="#050505" strokeOpacity="0.35" strokeWidth="0.6" />
            <text fontSize="6.4" letterSpacing="1.6" fill="#050505" fillOpacity="0.7" fontFamily="var(--font-inter), sans-serif">
              <textPath href={`#arc-${id}`} startOffset="0">
                {labelText.repeat(2)}
              </textPath>
            </text>
            <text
              className="vinyl-mark"
              x="200"
              y="200"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="44"
              letterSpacing="10"
              fill="#070707"
              style={{ fontFamily: "var(--font-orbitron), sans-serif", fontWeight: 800 }}
            >
              {/* Leading hair space balances the trailing letter-spacing so the spindle sits between A and S. */}
              <tspan dx="5">AS</tspan>
            </text>
            <circle cx="200" cy="200" r="3.6" fill="#050505" />
          </g>
        </g>
      </svg>
      <div className="vinyl-sheen pointer-events-none absolute inset-[1%] rounded-full" />
    </div>
  );
}
