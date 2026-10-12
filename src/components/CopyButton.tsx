import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({ value, className, label }: { value: string; className?: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label ?? `Copy ${value}`}
      title={`Copy ${value}`}
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
      className={cn("inline-flex size-5 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground", className)}
    >
      {done ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
    </button>
  );
}
