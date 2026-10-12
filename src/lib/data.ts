import boardJson from "@/data/board.json";
import layersJson from "@/data/layers.json";

export type Kind =
  | "power" | "ground" | "uart" | "gpio" | "adc" | "spi" | "i2c"
  | "can" | "audio" | "motion" | "sys";

export interface Tag { label: string; kind: Kind; bus: string | null }
export interface Cap { alt: number; fn: string }

export interface Pin {
  key: string;
  connector: "J1" | "J2";
  pin: number;
  kind: Kind;
  signal: string | null;
  desc: string | null;
  net: string;
  pad: string | null;
  ball: string | null;
  rail: string | null;
  pull: string | null;
  adc: string | null;
  acmp: string | null;
  default: string | null;
  defaultAlt: string | null;
  caps: Record<string, Cap[]>;
  reserved: string | null;
  settings: Record<string, string>;
  tags: Tag[];
  x: number;
  y: number;
}

export interface Part {
  ref: string; value: string; side: "top" | "bottom";
  x: number; y: number; rot: number; bbox: [number, number, number, number];
  footprint: string;
}

export interface BusInstance {
  inst: string; complete: boolean; signals: Record<string, string[]>;
  hw: string[]; pins: number;
}

export interface BoardData {
  board: string; rev: string; vendor: string;
  mcu: Record<string, string>;
  summary: Record<string, unknown> & { header_pins: number; gpio: number; adc_pins: number };
  geometry: { width: number; height: number; parts: Part[]; padDiameter: number; drill: number };
  pins: Pin[];
  buses: Record<string, BusInstance[]>;
  onBoard: Record<string, [string, string]>;
  kindOrder: string[];
  colors: Record<Kind, string>;
  legend: { c: Kind; label: string }[];
}

export interface Layers {
  top: { copper: string; pads: string; silk: string };
  bottom: { copper: string; pads: string; silk: string };
  outline: string;
}

export const board = boardJson as unknown as BoardData;
export const layers = layersJson as unknown as Layers;
export const pinByKey = new Map(board.pins.map((p) => [p.key, p]));

export function primaryLabel(p: Pin): string {
  if (p.kind === "ground") return "GND";
  return p.signal ?? p.tags[0]?.label ?? p.pad ?? p.key;
}

const haystack = new Map<string, string>(
  board.pins.map((p) => {
    const parts = [
      p.key, p.signal, p.desc, p.net, p.pad, p.ball, p.adc, p.acmp, p.default, p.kind,
      ...p.tags.map((t) => t.label),
      ...Object.values(p.caps).flatMap((c) => c.map((e) => e.fn)),
    ];
    return [p.key, parts.filter(Boolean).join(" ").toLowerCase()];
  }),
);

export function matchesQuery(p: Pin, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const h = haystack.get(p.key)!;
  return tokens.every((t) => h.includes(t));
}

/** Pins used by a bus instance, e.g. category "UART", instance "7". */
export function busPins(category: string, inst: BusInstance): string[] {
  void category;
  return [...new Set(Object.values(inst.signals).flat())];
}

export const kindLabel = Object.fromEntries(board.legend.map((l) => [l.c, l.label])) as Record<Kind, string>;
