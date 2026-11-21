import React from 'react';
import atlasCopcoSvg from '../assets/atlas_copco.svg';
import sullairSvg from '../assets/sullair.svg';
import ingersollRandSvg from '../assets/ingersoll_rand.svg';
import denairPng from '../assets/denair.png';

export interface PartnerBrand {
  id: string;
  name: string;
  enabled: boolean;
  type: 'image' | 'styled-text' | 'badge';
  logoUrl?: string;
  textColor?: string;
  badgeBg?: string;
  subText?: string;
  subTextColor?: string;
  customStyle?: string;
}

export const DEFAULT_PARTNERS: PartnerBrand[] = [
  {
    id: 'atlas-copco',
    name: 'Atlas Copco',
    enabled: true,
    type: 'image',
    logoUrl: atlasCopcoSvg,
  },
  {
    id: 'sullair',
    name: 'SULLAIR',
    enabled: true,
    type: 'image',
    logoUrl: sullairSvg,
  },
  {
    id: 'denair',
    name: 'DENAIR',
    enabled: true,
    type: 'image',
    logoUrl: denairPng,
  },
  {
    id: 'kaeser',
    name: 'KAESER',
    enabled: true,
    type: 'badge',
    badgeBg: '#000000',
    textColor: '#FFFFFF',
    subText: 'COMPRESSORS',
    subTextColor: '#FACC15',
  },
  {
    id: 'atlas-copco-red',
    name: 'Atlas Copco (Red)',
    enabled: true,
    type: 'styled-text',
    textColor: '#D92D20',
    customStyle: 'font-bold text-[11px] tracking-tight border-t-2 border-[#D92D20] pt-0.5',
  },
  {
    id: 'sollant',
    name: 'SOLLANT',
    enabled: true,
    type: 'styled-text',
    textColor: '#E31B23',
    customStyle: 'font-black italic text-xs tracking-tighter',
  },
  {
    id: 'ingersoll-rand',
    name: 'Ingersoll Rand',
    enabled: true,
    type: 'image',
    logoUrl: ingersollRandSvg,
  },
  {
    id: 'doosan',
    name: 'DOOSAN',
    enabled: true,
    type: 'styled-text',
    textColor: '#003865',
    customStyle: 'font-black text-xs tracking-wider',
  },
  {
    id: 'jmg',
    name: 'JMG',
    enabled: true,
    type: 'styled-text',
    textColor: '#0A2540',
    customStyle: 'font-black text-sm italic tracking-tight border-b-2 border-red-600',
  },
  {
    id: 'compair',
    name: 'CompAir',
    enabled: true,
    type: 'styled-text',
    textColor: '#005596',
    customStyle: 'font-bold text-xs tracking-tight',
  },
];

interface BrandLogosFooterProps {
  partners?: PartnerBrand[];
  onOpenPartnerSettings?: () => void;
  className?: string;
}

export const BrandLogosFooter: React.FC<BrandLogosFooterProps> = ({
  partners = DEFAULT_PARTNERS,
  onOpenPartnerSettings,
  className = '',
}) => {
  const activePartners = partners.filter((p) => p.enabled !== false);

  return (
    <div
      onClick={onOpenPartnerSettings}
      className={`w-full pt-3 mt-5 border-t-2 border-black/80 flex flex-wrap items-center justify-between gap-3 px-2 bg-white relative group ${
        onOpenPartnerSettings ? 'cursor-pointer' : ''
      } ${className}`}
      title={onOpenPartnerSettings ? 'Click to edit or add partner logos' : undefined}
    >
      {activePartners.map((p) => {
        if (p.type === 'image' && p.logoUrl) {
          return (
            <div key={p.id} className="h-7 flex items-center shrink-0">
              <img
                src={p.logoUrl}
                alt={p.name}
                className="h-6 w-auto object-contain max-w-[85px]"
              />
            </div>
          );
        }

        if (p.type === 'badge') {
          return (
            <div
              key={p.id}
              style={{ backgroundColor: p.badgeBg || '#000000', color: p.textColor || '#FFFFFF' }}
              className="h-7 flex flex-col justify-center items-center shrink-0 px-1.5 border border-black/30 rounded text-[9px] font-black tracking-tight leading-none py-0.5"
            >
              <span className="tracking-widest">{p.name}</span>
              {p.subText && (
                <span
                  style={{ color: p.subTextColor || '#FACC15' }}
                  className="text-[6px] tracking-normal font-sans font-normal italic"
                >
                  {p.subText}
                </span>
              )}
            </div>
          );
        }

        // styled-text or fallback
        return (
          <div
            key={p.id}
            style={{ color: p.textColor || '#000000' }}
            className={`h-7 flex items-center shrink-0 ${p.customStyle || 'font-black text-xs tracking-tight'}`}
          >
            <span>{p.name}</span>
          </div>
        );
      })}

      {/* Edit partners hover indicator */}
      {onOpenPartnerSettings && (
        <span className="absolute -top-3 right-0 bg-primary hover:bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex items-center gap-1 no-print">
          <span className="material-symbols-outlined text-xs">edit</span>
          Edit Partners
        </span>
      )}
    </div>
  );
};

export default BrandLogosFooter;
