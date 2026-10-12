import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { board, kindLabel, primaryLabel, type Pin } from "@/lib/data";
import { CopyButton } from "./CopyButton";

function Field({ label, value, copy }: { label: string; value: string | null | undefined; copy?: boolean }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mono flex items-center gap-1 text-sm">
        <span className="truncate">{value}</span>
        {copy && <CopyButton value={value} />}
      </dd>
    </div>
  );
}

export function PinDetail({ pin, onClose, onHighlightBus }: {
  pin: Pin | null; onClose?: () => void;
  onHighlightBus: (bus: string) => void;
}) {
  if (!pin) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <p className="text-foreground">No pin selected</p>
        <p>Click a pin on the board or in the table to see its MCU pad, ball, and every alternate function.</p>
      </div>
    );
  }
  const color = board.colors[pin.kind];
  const capEntries = Object.entries(pin.caps);
  const settings = Object.entries(pin.settings);
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: color }} />
            <h2 className="mono text-xl font-semibold">{pin.key}</h2>
            <CopyButton value={pin.key} />
          </div>
          <p className="mono mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            {primaryLabel(pin)} <CopyButton value={primaryLabel(pin)} />
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" style={{ borderColor: color, color }}>{kindLabel[pin.kind]}</Badge>
          {onClose && <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X /></Button>}
        </div>
      </header>

      {pin.desc && <p className="text-sm">{pin.desc}</p>}
      {pin.reserved && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
          {pin.reserved}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="MCU pad" value={pin.pad} copy />
        <Field label="BGA ball" value={pin.ball} copy />
        <Field label="Net" value={pin.net.startsWith("Net-(") ? null : pin.net} copy />
        <Field label="I/O rail" value={pin.rail} />
        <Field label="Reset default" value={pin.default ? `${pin.defaultAlt ?? ""} ${pin.default}`.trim() : null} />
        <Field label="Internal pull" value={pin.pull} />
        <Field label="ADC" value={pin.adc} copy />
        <Field label="Comparator" value={pin.acmp} copy />
      </dl>

      {settings.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Pad reset config</h3>
          <div className="flex flex-wrap gap-1.5">
            {settings.map(([k, v]) => (
              <Badge key={k} variant="secondary" className="font-normal"><span className="uppercase text-muted-foreground">{k}</span>&nbsp;{v}</Badge>
            ))}
          </div>
        </section>
      )}

      {pin.tags.filter((t) => t.bus).length > 0 && (
        <section>
          <h3 className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Buses on this pin</h3>
          <div className="flex flex-wrap gap-1.5">
            {pin.tags.filter((t) => t.bus).map((t) => (
              <button key={t.label} onClick={() => onHighlightBus(t.bus!)}
                className="mono rounded-md px-2 py-0.5 text-xs font-medium text-black transition hover:brightness-110"
                style={{ background: board.colors[t.kind] }}
                title={`Highlight all ${t.bus} pins`}>
                {t.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {capEntries.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Alternate functions</h3>
          <div className="flex flex-col gap-3">
            {capEntries.map(([cat, entries]) => (
              <div key={cat}>
                <div className="mb-1 text-xs font-medium">{cat}</div>
                <ul className="flex flex-col divide-y divide-border/60 rounded-md border">
                  {entries.map((e) => (
                    <li key={e.alt + e.fn} className="mono flex items-center gap-2 px-2 py-1 text-xs">
                      <span className="w-12 shrink-0 text-muted-foreground">ALT{e.alt}</span>
                      <span className="flex-1 truncate">{e.fn}</span>
                      <CopyButton value={e.fn} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
