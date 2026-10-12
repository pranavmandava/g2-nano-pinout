import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Search, X, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Board, type Side } from "@/components/Board";
import { BusPanel } from "@/components/BusPanel";
import { PinDetail } from "@/components/PinDetail";
import { PinTable } from "@/components/PinTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { board, matchesQuery, pinByKey, type Kind } from "@/lib/data";

const initial = new URLSearchParams(window.location.search);

export default function App() {
  const [side, setSide] = useState<Side>(initial.get("side") === "bottom" ? "bottom" : "top");
  const [query, setQuery] = useState(initial.get("q") ?? "");
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [connector, setConnector] = useState<"all" | "J1" | "J2">("all");
  const [highlight, setHighlight] = useState<{ label: string; keys: Set<string> } | null>(null);
  const [selected, setSelected] = useState<string | null>(initial.get("pin"));
  const [traces, setTraces] = useState(initial.has("copper"));
  const searchRef = useRef<HTMLInputElement>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");

  const visible = useMemo(() => {
    const set = new Set<string>();
    for (const p of board.pins) {
      if (kinds.length && !kinds.includes(p.kind)) continue;
      if (highlight && !highlight.keys.has(p.key)) continue;
      if (!matchesQuery(p, query)) continue;
      set.add(p.key);
    }
    return set;
  }, [kinds, highlight, query]);

  const tablePins = useMemo(
    () => board.pins.filter((p) => visible.has(p.key) && (connector === "all" || p.connector === connector)),
    [visible, connector],
  );

  const highlightBus = useCallback((label: string, keys?: string[]) => {
    const k = keys ?? board.pins.filter((p) => p.tags.some((t) => t.bus === label)).map((p) => p.key);
    setHighlight((h) => (h?.label === label ? null : { label, keys: new Set(k) }));
  }, []);

  const clearAll = () => { setQuery(""); setKinds([]); setHighlight(null); };
  const filtering = query || kinds.length || highlight;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === "INPUT";
      if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { if (typing) searchRef.current?.blur(); setSelected(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pin = selected ? pinByKey.get(selected) ?? null : null;
  const s = board.summary;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight">
              G2 Nano <span className="text-muted-foreground">Pinout</span>
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {board.vendor} · rev {board.rev} · {board.mcu.part}
            </p>
          </div>
          <div className="relative order-last w-full sm:order-none sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pin, net, ball, LPUART3…  ( / )" className="pl-8 pr-8" aria-label="Search pins" />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/G2-Nano-DEV-Board-Pinout.csv" download><Download /> CSV</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/G2-Nano-DEV-Board-Pinout.xlsx" download><Download /> XLSX</a>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="board-h" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="board-h" className="sr-only">Board diagram</h2>
              <Tabs value={side} onValueChange={(v) => setSide(v as Side)}>
                <TabsList>
                  <TabsTrigger value="top">Top</TabsTrigger>
                  <TabsTrigger value="bottom">Bottom</TabsTrigger>
                </TabsList>
              </Tabs>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={traces} onChange={(e) => setTraces(e.target.checked)} className="accent-primary" />
                Show copper
              </label>
            </div>

            <ToggleGroup type="multiple" value={kinds} onValueChange={(v) => setKinds(v as Kind[])}
              variant="outline" size="sm" className="flex-wrap justify-start gap-1.5" aria-label="Filter by function">
              {board.legend.map((l) => (
                <ToggleGroupItem key={l.c} value={l.c} className="gap-1.5 rounded-full! px-3 text-xs">
                  <span className="size-2 rounded-full" style={{ background: board.colors[l.c] }} />{l.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {(highlight || filtering) && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{visible.size} of {board.pins.length} pins shown</span>
                {highlight && (
                  <Badge variant="secondary" className="gap-1">{highlight.label}
                    <button aria-label="Clear bus highlight" onClick={() => setHighlight(null)}><X className="size-3" /></button>
                  </Badge>
                )}
                <button className="underline underline-offset-2 hover:text-foreground" onClick={clearAll}>Clear filters</button>
              </div>
            )}

            <Board side={side} visible={visible} selected={selected} onSelect={setSelected} showTraces={traces} />
          </section>

          <section aria-labelledby="mcu-h" className="grid gap-3 sm:grid-cols-3">
            <h2 id="mcu-h" className="sr-only">Summary</h2>
            <Stat icon label="MCU" value={board.mcu.part} sub={board.mcu.cores} />
            <Stat label="Header pins" value={String(s.header_pins)} sub={`${s.gpio} GPIO · ${s.adc_pins} ADC · 2 × 30-pin`} />
            <Stat label="Package" value="289-ball BGA" sub={board.mcu.package.replace("289-ball MAPBGA, ", "")} />
          </section>

          <section aria-labelledby="buses-h" className="flex flex-col gap-3">
            <h2 id="buses-h" className="text-base font-semibold">Peripheral buses</h2>
            <p className="-mt-2 text-sm text-muted-foreground">Select an instance to highlight its pins on the board.</p>
            <BusPanel activeLabel={highlight?.label ?? null} onHighlight={highlightBus} onSelect={setSelected} />
          </section>

          <section aria-labelledby="pins-h" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="pins-h" className="text-base font-semibold">All pins <span className="font-normal text-muted-foreground">({tablePins.length})</span></h2>
              <Tabs value={connector} onValueChange={(v) => setConnector(v as typeof connector)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="J1">J1 Lower</TabsTrigger>
                  <TabsTrigger value="J2">J2 Upper</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <PinTable pins={tablePins} selected={selected} onSelect={setSelected} />
          </section>
        </div>

        {desktop && (
          <aside className="sticky top-[76px] hidden max-h-[calc(100vh-92px)] self-start overflow-y-auto rounded-xl border bg-card lg:block">
            <PinDetail pin={pin} onHighlightBus={(b) => highlightBus(b)} />
          </aside>
        )}
      </main>

      {!desktop && (
        <Drawer open={!!pin} onOpenChange={(o) => !o && setSelected(null)}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerTitle className="sr-only">Pin details</DrawerTitle>
            <DrawerDescription className="sr-only">Details for the selected pin</DrawerDescription>
            <div className="overflow-y-auto">
              <PinDetail pin={pin} onClose={() => setSelected(null)} onHighlightBus={(b) => { highlightBus(b); setSelected(null); }} />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <footer className="mx-auto max-w-[1500px] px-4 pb-8 text-xs text-muted-foreground">
        Generated from the KiCad project, i.MX RT1170 reference manual &amp; datasheet. Board view drawn from the PCB layout.
      </footer>
    </div>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub: string; icon?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon && <Cpu className="size-3" />}{label}
      </div>
      <div className="mono mt-0.5 text-sm font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
