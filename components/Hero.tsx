import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-primary p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-border">
      {/* Repeating "+" Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
        <svg width="100%" height="100%">
          <pattern id="plus-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 15 5 L 15 25 M 5 15 L 25 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#plus-pattern)" />
        </svg>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 text-center md:text-left flex flex-col gap-3">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm self-center md:self-start">
          Masakan Nusantara
        </span>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium font-display text-white leading-tight tracking-tight max-w-xl">
          Aneka Resep Masakan Indonesia
        </h1>
        <p className="text-white/80 text-sm md:text-base font-medium max-w-md">
          Temukan ribuan resep masakan nusantara yang lezat, otentik, dan mudah dibuat sendiri di rumah.
        </p>
      </div>

      {/* Hero Image */}
      <div className="relative z-10 w-[270px] h-[210px] flex-shrink-0 rounded-xl overflow-hidden border border-white/20">
        <Image
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80"
          alt="Indonesian Food Preparation"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
