import React from 'react';
import mandtechLogoDark from '../assets/mandtech_logo.png';
import mandtechLogoWhite from '../assets/mandtech_logo_white.png';

export interface LogoProps {
  size?: number;
  height?: number;
  variant?: 'light' | 'dark' | 'auto';
  color?: string;
  accentColor?: string;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MandtechLogo: React.FC<LogoProps> = ({
  size,
  height,
  variant = 'auto',
  color,
  className = '',
  style = {},
}) => {
  const isWhite = variant === 'dark' || color === '#ffffff' || color === 'white';
  const logoSrc = isWhite ? mandtechLogoWhite : mandtechLogoDark;
  const actualHeight = height || size || 32;

  return (
    <img
      src={logoSrc}
      alt="Mandtech Services"
      className={`mandtech-logo-img ${className}`}
      style={{
        height: `${actualHeight}px`,
        width: 'auto',
        maxHeight: `${actualHeight}px`,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      loading="eager"
    />
  );
};

export default MandtechLogo;
