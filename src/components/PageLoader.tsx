import prodemLogo from "@/assets/prodem-logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: 'radial-gradient(ellipse at center, hsl(25 40% 8%) 0%, hsl(222 30% 4%) 60%, hsl(222 30% 2%) 100%)' }}>
      {/* Super subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(25 85% 54% / 0.15) 0%, transparent 70%)' }} />

      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/10" />

        {/* Rotating ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-[spin_1s_ease-in-out_infinite]"
        />

        {/* Circular Logo Mask */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/5 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_hsl(25_85%_54%_/_0.2)]">
          <img
            alt="Prodem Gestão"
            className="w-full h-full object-cover animate-pulse"
            src={prodemLogo}
            style={{ animationDuration: '2s' }}
          />
        </div>
      </div>
    </div>
  );
}
