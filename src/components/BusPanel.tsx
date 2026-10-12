import { Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { board, busPins } from "@/lib/data";
import { cn } from "@/lib/utils";

export function BusPanel({ activeLabel, onHighlight, onSelect }: {
  activeLabel: string | null;
  onHighlight: (label: string, keys: string[]) => void;
  onSelect: (key: string) => void;
}) {
  const cats = Object.keys(board.buses);
  return (
    <Tabs defaultValue={cats[0]} className="gap-3">
      <TabsList className="h-auto flex-wrap justify-start">
        {cats.map((c) => <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>)}
      </TabsList>
      {cats.map((cat) => (
        <TabsContent key={cat} value={cat} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {board.buses[cat].map((inst) => {
            const label = `${cat.split(" ")[0]}${inst.inst}`;
            const active = activeLabel === label;
            return (
              <div key={inst.inst} className={cn("rounded-xl border p-3 transition", active && "border-primary ring-1 ring-primary")}>
                <button className="mb-2 flex w-full items-center justify-between text-left"
                  onClick={() => onHighlight(label, busPins(cat, inst))}>
                  <span className="font-medium">{cat.split(" ")[0]} {inst.inst}</span>
                  {inst.complete
                    ? <Badge variant="secondary" className="gap-1 text-emerald-500"><Check className="size-3" />complete</Badge>
                    : <Badge variant="secondary" className="gap-1 text-amber-500"><AlertTriangle className="size-3" />partial</Badge>}
                </button>
                <dl className="flex flex-col gap-1">
                  {Object.entries(inst.signals).map(([sig, pins]) => (
                    <div key={sig} className="flex items-center gap-2 text-xs">
                      <dt className="mono w-12 shrink-0 text-muted-foreground">{sig}</dt>
                      <dd className="flex flex-wrap gap-1">
                        {pins.map((k) => (
                          <button key={k} onClick={() => onSelect(k)}
                            className="mono rounded bg-muted px-1.5 py-0.5 hover:bg-accent">{k}</button>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
                {inst.hw.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">HW flow control: {inst.hw.join(", ")}</p>}
              </div>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
