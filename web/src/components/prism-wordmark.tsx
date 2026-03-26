export function PrismWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const lineH = { sm: "h-[1.5px]", md: "h-[2px]", lg: "h-[2.5px]" }[size];

  return (
    <div className="flex flex-col items-start">
      <span className={`font-display font-bold tracking-wide text-[var(--text-primary)] ${textSize}`}>
        PRISM
      </span>
      <div
        className={`${lineH} w-full rounded-full mt-0.5`}
        style={{
          background: "linear-gradient(90deg, #3B82F6, #A855F7, #F59E0B, #22C55E, #06B6D4, #F97316)",
        }}
      />
    </div>
  );
}
