export function PrismWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const lineH = { sm: "h-[2px]", md: "h-[2.5px]", lg: "h-[3px]" }[size];

  const gradient = "linear-gradient(90deg, #3B82F6, #A855F7, #F59E0B, #22C55E, #06B6D4, #F97316)";

  return (
    <div className="flex flex-col items-start">
      <span className={`font-display font-bold tracking-widest text-[var(--text-primary)] ${textSize}`}>
        PRISM
      </span>
      <div
        className={`${lineH} w-full rounded-full mt-0.5 relative`}
        style={{ background: gradient }}
      >
        <div
          className="absolute inset-0 rounded-full blur-sm opacity-60"
          style={{ background: gradient }}
        />
      </div>
    </div>
  );
}
