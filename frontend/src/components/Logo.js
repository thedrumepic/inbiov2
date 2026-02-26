import React, { useState, useEffect } from 'react';


const Logo = ({ className = "", size = "default", forceTheme = null }) => {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // If theme is forced, we don't need to observe changes
    if (forceTheme) return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const sizes = {
    xs: "h-5",
    sm: "h-7",
    default: "h-9",
    lg: "h-11",
    xl: "h-14",
  };

  let logoFile;
  if (forceTheme === 'light') {
    logoFile = 'logo-dark.png';
  } else if (forceTheme === 'dark') {
    logoFile = 'logo.png';
  } else {
    logoFile = isDark ? 'logo.png' : 'logo-dark.png';
  }

  // Use local public folder for logo
  return (
    <img
      src={`/${logoFile}`}
      alt="inbio"
      className={`${sizes[size] || sizes.default} w-auto object-contain ${className}`}
    />
  );
};

// Text logo for inline use
const LogoText = ({ className = "" }) => {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-foreground">1</span>
      <span className="text-foreground">bio</span>
    </span>
  );
};

// Logo with text for footer/powered by
const LogoWithText = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Logo size="xs" />
      <span className="text-xs text-gray-500">.cc</span>
    </div>
  );
};

export { Logo, LogoText, LogoWithText };
export default Logo;
