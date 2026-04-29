import { cn } from "@/lib/cn";

export function Logo({ className, dotClass }: { className?: string; dotClass?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-display font-semibold tracking-tight", className)}>
      <span>Ten</span>
      <span className={cn("ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-ember", dotClass)} aria-hidden />
    </span>
  );
}
