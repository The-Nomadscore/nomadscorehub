const MERIDIAN_SCALES = [0.72, 0.42, 0.14];
const PARALLELS = [
  { top: '27%', inset: '5%' },
  { top: '50%', inset: '0%' },
  { top: '73%', inset: '5%' },
];
const PINS = [
  { top: '36%', left: '28%' },
  { top: '28%', left: '58%' },
  { top: '54%', left: '66%' },
  { top: '64%', left: '40%' },
  { top: '47%', left: '49%' },
];

export default function HeroGlobe() {
  return (
    <div aria-hidden="true" className="flex min-w-0 flex-[1_1_340px] justify-center">
      <div className="relative aspect-square w-[440px] max-w-full rounded-full border border-brand-border bg-[radial-gradient(circle_at_35%_30%,#234651_0%,#122A32_45%,#0A161B_100%)] shadow-[0_0_120px_rgba(229,161,92,0.14)]">
        {MERIDIAN_SCALES.map((scale) => (
          <div
            key={scale}
            className="absolute inset-0 rounded-full border border-brand-muted/20"
            style={{ transform: `scaleX(${scale})` }}
          />
        ))}
        {PARALLELS.map(({ top, inset }) => (
          <div
            key={top}
            className="absolute h-px bg-brand-muted/20"
            style={{ top, left: inset, right: inset }}
          />
        ))}
        {PINS.map((pin) => (
          <div
            key={`${pin.top}-${pin.left}`}
            className="absolute h-3 w-3 rounded-full bg-brand-accent shadow-[0_0_0_7px_rgba(229,161,92,0.2)]"
            style={pin}
          />
        ))}
      </div>
    </div>
  );
}