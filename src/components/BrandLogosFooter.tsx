import React from 'react';
import atlasCopcoSvg from '../assets/atlas_copco.svg';
import sullairSvg from '../assets/sullair.svg';
import ingersollRandSvg from '../assets/ingersoll_rand.svg';
import denairPng from '../assets/denair.png';

export const BrandLogosFooter: React.FC = () => {
  return (
    <div className="w-full pt-4 mt-6 border-t-2 border-black/80 flex items-center justify-between gap-3 px-2 bg-white">
      {/* Atlas Copco */}
      <div className="h-7 flex items-center shrink-0">
        <img src={atlasCopcoSvg} alt="Atlas Copco" className="h-6 w-auto object-contain" />
      </div>

      {/* Sullair */}
      <div className="h-7 flex items-center shrink-0">
        <img src={sullairSvg} alt="Sullair" className="h-6 w-auto object-contain" />
      </div>

      {/* Denair */}
      <div className="h-7 flex items-center shrink-0">
        <img src={denairPng} alt="Denair" className="h-7 w-auto object-contain" />
      </div>

      {/* Kaeser */}
      <div className="h-7 flex flex-col justify-center items-center shrink-0 px-1 border border-black/30 rounded bg-black text-white text-[9px] font-black tracking-tight leading-none py-0.5">
        <span className="tracking-widest">KAESER</span>
        <span className="text-[6px] tracking-normal font-sans text-yellow-400 font-normal italic">COMPRESSORS</span>
      </div>

      {/* Ingersoll Rand */}
      <div className="h-7 flex items-center shrink-0">
        <img src={ingersollRandSvg} alt="Ingersoll Rand" className="h-5 w-auto object-contain" />
      </div>

      {/* Sollant */}
      <div className="h-7 flex items-center shrink-0 text-[#E31B23] font-black text-xs italic tracking-tighter">
        <span>SOLLANT</span>
      </div>

      {/* Doosan */}
      <div className="h-7 flex items-center shrink-0 text-[#003865] font-black text-xs tracking-wider">
        <span>DOOSAN</span>
      </div>

      {/* JMG */}
      <div className="h-7 flex items-center shrink-0 text-[#0A2540] font-black text-sm italic tracking-tight border-b-2 border-red-600">
        <span>JMG</span>
      </div>

      {/* CompAir */}
      <div className="h-7 flex items-center shrink-0 text-[#005596] font-bold text-xs tracking-tight">
        <span>CompAir</span>
      </div>
    </div>
  );
};

export default BrandLogosFooter;
