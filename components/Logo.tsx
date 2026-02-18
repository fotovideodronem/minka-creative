
import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center gap-3 group py-1 shrink-0">
      {/* Icon Square */}
      <div className="w-11 h-11 bg-black flex items-center justify-center transition-transform duration-500 group-hover:scale-105 shrink-0">
        <span className="font-syne text-white text-2xl font-bold tracking-tighter">
          JM
        </span>
      </div>

      {/* Brand Text to the Right */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-0">
          <span className="font-syne text-[18px] font-light uppercase tracking-tight text-gray-950 leading-none">
            Jakub Minka
          </span>
          <span className="font-syne text-[10px] font-extralight uppercase tracking-[0.2em] text-[#007BFF] ml-2">
            Photo & Video
          </span>
        </div>
        <span className="text-[7px] text-gray-400 font-black uppercase tracking-[0.4em] leading-none mt-1.5">
          Fotograf & Kameraman
        </span>
      </div>
    </Link>
  );
};

export default Logo;
