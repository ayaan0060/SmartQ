import React from 'react';

const HeroHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconClassName = "bg-primary text-white",
  children 
}) => {
  return (
    <header className="flex items-center gap-6 mb-12">
      {Icon && (
        <div className={`inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl shadow-2xl shadow-slate-200 transition-transform hover:scale-110 duration-500 ${iconClassName}`}>
          <Icon size={40} />
        </div>
      )}
      <div className="space-y-2 min-w-0">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white font-display leading-[1.1]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </header>
  );
};

export default HeroHeader;
