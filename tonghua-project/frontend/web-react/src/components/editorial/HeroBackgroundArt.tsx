interface HeroBackgroundArtProps {
  className?: string;
}

export default function HeroBackgroundArt({ className = '' }: HeroBackgroundArtProps) {
  return (
    <svg
      className={`absolute inset-0 z-[1] w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 900 580"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Top left blob */}
      <path d="M60 180 Q90 140 130 170 Q110 200 70 195 Z" fill="#E8C5A0" opacity="0.35"/>
      <path d="M80 200 Q120 185 140 210 Q115 225 85 215 Z" fill="#D4A87C" opacity="0.25"/>

      {/* Top circle accent */}
      <circle cx="200" cy="120" r="28" fill="#B84B2A" opacity="0.08"/>
      <circle cx="195" cy="118" r="16" fill="none" stroke="#B84B2A" strokeWidth="1" opacity="0.2"/>

      {/* Middle green blob */}
      <path d="M350 400 Q380 370 420 395 Q400 425 360 415 Z" fill="#7BAE7F" opacity="0.2"/>
      <path d="M330 420 Q370 405 390 430 Q365 445 335 435 Z" fill="#5A9A5E" opacity="0.15"/>

      {/* Star/diamond shape top right */}
      <path d="M500 80 L520 60 L540 85 L530 100 L510 95 Z" fill="#E8C5A0" opacity="0.3"/>
      <path d="M510 70 L528 68 L524 88 L512 90 Z" fill="none" stroke="#C8955A" strokeWidth="1.2" opacity="0.4"/>
      <line x1="505" y1="100" x2="508" y2="130" stroke="#C8955A" strokeWidth="0.8" opacity="0.3"/>

      {/* Middle right rust blob */}
      <path d="M650 200 Q680 175 710 195 Q695 220 665 215 Z" fill="#B84B2A" opacity="0.12"/>

      {/* Concentric circles */}
      <circle cx="700" cy="310" r="45" fill="none" stroke="#B84B2A" strokeWidth="0.8" opacity="0.15"/>
      <circle cx="700" cy="310" r="30" fill="none" stroke="#B84B2A" strokeWidth="0.5" opacity="0.1"/>

      {/* Bottom left blob */}
      <path d="M140 480 Q170 455 200 475 Q185 500 155 495 Z" fill="#D4A87C" opacity="0.2"/>

      {/* Bottom middle green blob */}
      <path d="M420 500 Q450 480 475 500 Q460 520 430 515 Z" fill="#7BAE7F" opacity="0.18"/>

      {/* Bottom right blob */}
      <path d="M760 420 Q790 400 815 425 Q800 448 770 440 Z" fill="#E8C5A0" opacity="0.25"/>

      {/* Top right corner blob */}
      <path d="M820 150 Q850 130 875 155 Q860 175 832 168 Z" fill="#B84B2A" opacity="0.1"/>

      {/* Dashed line path */}
      <path d="M100 350 Q130 340 160 355" stroke="#C8955A" strokeWidth="0.8" opacity="0.2" fill="none" strokeDasharray="3,3"/>

      {/* Middle blob */}
      <path d="M240 300 Q260 280 285 295 Q270 315 248 308 Z" fill="#B0C9A8" opacity="0.22"/>

      {/* Green circle bottom left */}
      <circle cx="50" cy="430" r="12" fill="none" stroke="#7BAE7F" strokeWidth="0.8" opacity="0.25"/>
      <circle cx="50" cy="430" r="6" fill="#7BAE7F" opacity="0.15"/>
    </svg>
  );
}
