import React from 'react';

export const Logo: React.FC<{ size?: number }> = ({ size = 60 }) => {
  // DiceBear Avatar configuration for "Short hair Asian chubby girl"
  // Seed 'Ruby' with specific options to match the description:
  // - top: shortHairRound (Short hair)
  // - skinColor: ffdbb4 (Light Asian tone)
  // - hairColor: 2c1b18 (Black/Dark Brown)
  // - mouth: smile (Happy)
  const avatarUrl = "https://api.dicebear.com/9.x/avataaars/svg?seed=RubyChan2&top=shortHairRound&hairColor=2c1b18&skinColor=ffdbb4&clothing=graphicShirt&clothingColor=e6e6e6&eyes=happy&mouth=smile&eyebrows=defaultNatural&accessories[]=";

  return (
    <div 
      className="relative group shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      {/* Soft Glow effect on hover */}
      <div className="absolute -inset-1 bg-kawaii-sub rounded-full opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-500"></div>
      
      {/* Main Avatar Circle */}
      <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-kawaii-sub/30 transition-transform duration-300 group-hover:scale-105 bg-yellow-50">
        <img 
          src={avatarUrl}
          alt="Ruby Logo" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Cute sparkle decoration */}
      <div className="absolute top-0 right-0 w-[25%] h-[25%] bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-bounce-short z-10">
        <div className="w-[40%] h-[40%] bg-white rounded-full opacity-80"></div>
      </div>
    </div>
  );
};