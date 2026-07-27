import { cn } from "@/lib/utils";
import logoUrl from "@/assets/silo-logo.png";

export function SiloLogo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const h = size === "sm" ? "h-5" : size === "lg" ? "h-10" : "h-7";
  return <img src={logoUrl} alt="Silo" className={cn(h, "w-auto select-none", className)} draggable={false} />;
}

export function SiloWordmark({ className, taglineClassName, tagline }: { className?: string; taglineClassName?: string; tagline?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <SiloLogo size="md" />
      {tagline && (
        <span className="leading-tight">
          <span className={cn("text-[10px] font-medium block", taglineClassName)}>{tagline}</span>
        </span>
      )}
    </span>
  );
}
