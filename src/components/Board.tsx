import { memo, useMemo, useState } from "react";
import { board, kindLabel, layers, primaryLabel, type Pin } from "@/lib/data";
import { cn } from "@/lib/utils";

export type Side = "top" | "bottom";

const MARGIN = 12.5;          // mm of label space above/below the board
const FS = 1.15;             // pill label font size (mm)
const PILL_H = 1.9;
const { width: W, height: H, padDiameter, drill } = board.geometry;

function pillLength(text: string) {
  return text.length * FS * 0.62 + 1.4;
}

interface Props {
  side: Side;
  visible: Set<string>;
  selected: string | null;
  onSelect: (key: string | null) => void;
  showTraces: boolean;
}

const Layer = memo(function Layer({ html, className }: { html: string; className: string }) {
  return <g className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

function PinMark({ pin, side, active, selected, onSelect, onHover }: {
  pin: Pin; side: Side; active: boolean; selected: boolean;
  onSelect: (k: string) => void; onHover: (k: string | null) => void;
}) {
  const x = side === "bottom" ? W - pin.x : pin.x;
  const top = pin.connector === "J2";            // J2 sits on the upper edge
  const color = board.colors[pin.kind];
  const label = primaryLabel(pin);
  const len = pillLength(label);
  const dir = top ? -1 : 1;
  const edge = top ? 0 : H;
  const numY = edge + dir * 1.35;
  const pillStart = edge + dir * 2.7;
  const square = pin.pin === 1;
  const r = padDiameter / 2;

  return (
    <g
      role="button"
      tabIndex={active ? 0 : -1}
      aria-label={`${pin.key} ${label}, ${kindLabel[pin.kind]}`}
      aria-pressed={selected}
      className={cn("cursor-pointer outline-none transition-opacity", active ? "opacity-100" : "opacity-[0.16]")}
      onClick={() => onSelect(pin.key)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(pin.key); } }}
      onMouseEnter={() => onHover(pin.key)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(pin.key)}
      onBlur={() => onHover(null)}
    >
      {/* generous hit target */}
      <rect
        x={x - 1.2} width={2.4} fill="transparent"
        y={top ? pillStart - len : pin.y - r}
        height={len + (top ? pin.y + r - pillStart : pillStart - pin.y + r)}
      />
      {/* pad */}
      {square
        ? <rect x={x - r} y={pin.y - r} width={padDiameter} height={padDiameter} rx={0.15} className="fill-(--board-pad)" />
        : <circle cx={x} cy={pin.y} r={r} className="fill-(--board-pad)" />}
      <circle cx={x} cy={pin.y} r={drill / 2} className="fill-[#0a0c0e]" />
      <circle cx={x} cy={pin.y} r={r + 0.25} fill="none" stroke={color} strokeWidth={0.28} />
      {selected && (
        <circle cx={x} cy={pin.y} r={r + 0.75} fill="none" className="stroke-foreground" strokeWidth={0.22} strokeDasharray="0.5 0.35" />
      )}
      {/* pin number */}
      <text x={x} y={numY} fontSize={0.95} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground mono" >
        {pin.pin}
      </text>
      {/* connector line + pill */}
      <g transform={`translate(${x} ${pillStart}) rotate(${top ? -90 : 90})`}>
        <rect x={0} y={-PILL_H / 2} width={len} height={PILL_H} rx={0.45} fill={color}
          stroke={selected ? "var(--foreground)" : "none"} strokeWidth={0.2} />
        <text x={0.6} y={0} fontSize={FS} dominantBaseline="central" className="mono" fill="#0b0d10" fontWeight={600}>
          {label}
        </text>
      </g>
    </g>
  );
}

export function Board({ side, visible, selected, onSelect, showTraces }: Props) {
  const [hoverPin, setHoverPin] = useState<string | null>(null);
  const [hoverPart, setHoverPart] = useState<string | null>(null);
  const L = layers[side];
  const parts = useMemo(() => board.geometry.parts.filter((p) => p.side === side), [side]);
  const flip = side === "bottom" ? `translate(${W} 0) scale(-1 1)` : undefined;

  const hp = hoverPin ? board.pins.find((p) => p.key === hoverPin) : null;
  const part = hoverPart ? board.geometry.parts.find((p) => p.ref === hoverPart) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border bg-(--stage) [background-image:radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--foreground)_6%,transparent),transparent_70%)]">
        <svg
          viewBox={`-3 ${-MARGIN} ${W + 6} ${H + 2 * MARGIN}`}
          className="mx-auto block min-w-[860px] w-full select-none"
          role="group"
          aria-label={`G2 Nano ${side} view`}
        >
          <defs>
            <filter id="board-shadow" x="-5%" y="-10%" width="110%" height="130%">
              <feDropShadow dx="0" dy="0.6" stdDeviation="0.7" floodOpacity="0.45" />
            </filter>
          </defs>

          <g transform={flip}>
            <rect x={0} y={0} width={W} height={H} rx={0.4} className="fill-(--board-fill)" filter="url(#board-shadow)" />
            {showTraces && <Layer html={L.copper} className="text-(--board-trace) opacity-60" />}
            <Layer html={L.pads} className="text-(--board-pad)" />
            {/* component bodies */}
            {parts.map((p) => {
              const [x0, y0, x1, y1] = p.bbox;
              const big = (x1 - x0) * (y1 - y0) > 20;
              const active = hoverPart === p.ref;
              return (
                <g key={p.ref}
                  onMouseEnter={() => setHoverPart(p.ref)} onMouseLeave={() => setHoverPart(null)}>
                  <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={0.3}
                    className={cn("fill-(--board-body) transition", active ? "opacity-95 stroke-white" : "opacity-70 stroke-white/20")}
                    strokeWidth={0.12} />
                  {big && (
                    <text
                      x={(x0 + x1) / 2} y={(y0 + y1) / 2} fontSize={1.4} textAnchor="middle" dominantBaseline="central"
                      className="mono pointer-events-none fill-white/70"
                      transform={side === "bottom" ? `translate(${x0 + x1} 0) scale(-1 1)` : undefined}
                    >
                      {p.ref}
                    </text>
                  )}
                </g>
              );
            })}
            <Layer html={L.silk} className="text-(--board-silk) opacity-90 pointer-events-none" />
            <Layer html={layers.outline} className="text-(--board-edge) pointer-events-none" />
          </g>

          {board.pins.map((pin) => (
            <PinMark
              key={pin.key} pin={pin} side={side}
              active={visible.has(pin.key)} selected={selected === pin.key}
              onSelect={onSelect} onHover={setHoverPin}
            />
          ))}

          <text x={-1} y={-MARGIN + 1.8} fontSize={1.3} className="fill-muted-foreground mono">J2 · UPPER BANK</text>
          <text x={-1} y={H + MARGIN - 1} fontSize={1.3} className="fill-muted-foreground mono">J1 · LOWER BANK</text>
          <text x={W + 1} y={H + MARGIN - 1} fontSize={1.3} textAnchor="end" className="fill-muted-foreground mono">
            {side.toUpperCase()} VIEW{side === "bottom" ? " (mirrored)" : ""}
          </text>
        </svg>
      </div>

      <div className="mono min-h-6 px-1 text-xs text-muted-foreground" aria-live="polite">
        {hp ? (
          <span>
            <b className="text-foreground">{hp.key}</b> · {primaryLabel(hp)}
            {hp.pad && <> · {hp.pad}{hp.ball && ` (${hp.ball})`}</>}
            {hp.tags.length > 1 && <> · {hp.tags.slice(1).map((t) => t.label).join(", ")}</>}
          </span>
        ) : part ? (
          <span><b className="text-foreground">{part.ref}</b> · {part.value} · {part.footprint} · {part.side}</span>
        ) : (
          <span>Hover a pin or component · click a pin for details</span>
        )}
      </div>
    </div>
  );
}
