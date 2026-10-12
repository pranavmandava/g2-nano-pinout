import { board, kindLabel, primaryLabel, type Pin } from "@/lib/data";
import { cn } from "@/lib/utils";

export function PinTable({ pins, selected, onSelect }: {
  pins: Pin[]; selected: string | null; onSelect: (k: string) => void;
}) {
  if (!pins.length) {
    return <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">No pins match the current filters.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Pin</th>
            <th className="px-3 py-2 font-medium">Signal</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">MCU pad</th>
            <th className="hidden px-3 py-2 font-medium md:table-cell">Ball</th>
            <th className="hidden px-3 py-2 font-medium lg:table-cell">Functions</th>
          </tr>
        </thead>
        <tbody>
          {pins.map((p) => (
            <tr key={p.key} onClick={() => onSelect(p.key)}
              className={cn("cursor-pointer border-t transition hover:bg-accent/60", selected === p.key && "bg-accent")}>
              <td className="mono whitespace-nowrap px-3 py-1.5 font-medium">{p.key}</td>
              <td className="mono px-3 py-1.5">{primaryLabel(p)}</td>
              <td className="px-3 py-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className="size-2 rounded-full" style={{ background: board.colors[p.kind] }} />
                  {kindLabel[p.kind]}
                </span>
              </td>
              <td className="mono hidden px-3 py-1.5 text-muted-foreground sm:table-cell">{p.pad ?? "—"}</td>
              <td className="mono hidden px-3 py-1.5 text-muted-foreground md:table-cell">{p.ball ?? "—"}</td>
              <td className="hidden px-3 py-1.5 lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {p.tags.filter((t) => t.bus).slice(0, 5).map((t) => (
                    <span key={t.label} className="mono rounded px-1.5 py-px text-[11px] font-medium text-black"
                      style={{ background: board.colors[t.kind] }}>{t.label}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
