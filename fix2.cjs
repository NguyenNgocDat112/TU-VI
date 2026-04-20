const fs = require('fs');

// 1. Update App.tsx
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');

// Fix row for interpretation index and title
// Cung interpretation
appContent = appContent.replace(
  /<div className="p-3 md:p-4 flex flex-col md:flex-row gap-3">/g,
  '<div className="p-3 md:p-4 flex flex-row items-start gap-3">'
);

// Decadal interpretation
appContent = appContent.replace(
  /<div className="p-4 md:p-6 flex flex-col md:flex-row gap-5">/g,
  '<div className="p-4 md:p-6 flex flex-row items-start gap-4 md:gap-5">'
);

// Update Markdown prose-strong from font-black to font-bold
appContent = appContent.replace(/prose-strong:font-black/g, 'prose-strong:font-bold');
appContent = appContent.replace(
  /className={cn\(elementColors\[element\] \|\| 'text-primary', "font-black tracking-tight"\)}/g,
  `className={cn(elementColors[element] || 'text-primary', "font-bold tracking-tight")}`
);
appContent = appContent.replace(
  /className="text-foreground font-black"/g,
  `className="text-foreground font-bold"`
);
appContent = appContent.replace(
  /className={cn\("font-black px-1 mx-0\.5 rounded-sm bg-secondary\/30", elementColors\[element\] \|\| 'text-foreground'\)}/g,
  `className={cn("font-bold px-1 mx-0.5 rounded-sm bg-secondary/30", elementColors[element] || 'text-foreground')}`
);
appContent = appContent.replace(
  /<strong className="font-black text-foreground" \{\.\.\.props\}>\{children\}<\/strong>/g,
  `<strong className="font-bold text-foreground" {...props}>{children}</strong>`
);
appContent = appContent.replace( // Catch any other inline strongs
  /return <strong className="text-foreground font-black".*>/g,
  `return <strong className="text-foreground font-bold" {...props}>{children}</strong>;`
);

fs.writeFileSync('./src/App.tsx', appContent, 'utf8');
console.log('App.tsx updated');

// 2. Update PalaceCell.tsx
let pcContent = fs.readFileSync('./src/components/PalaceCell.tsx', 'utf8');

// Reduce font-black to font-bold for major stars, and slightly reduce text size
pcContent = pcContent.replace(
  /isMajor \? "font-black whitespace-nowrap tracking-tighter" : "font-bold whitespace-nowrap tracking-tighter"/g,
  'isMajor ? "font-bold whitespace-nowrap tracking-tighter text-slate-800" : "font-semibold whitespace-nowrap tracking-tighter"'
);

pcContent = pcContent.replace(
  /\? \(palace\.majorStars\.length > 2 \? "text-\[12\.5px\] uppercase" : "text-\[13\.5px\] uppercase"\)/g,
  '? (palace.majorStars.length > 2 ? "text-[11px] uppercase" : "text-[12px] uppercase")'
);

// Get the star font size, it was using fallback. Reduce for non-major too.
pcContent = pcContent.replace(/text-\[7\.5px\]/g, 'text-[7px]');
pcContent = pcContent.replace(/text-\[8\.5px\]/g, 'text-[8px]');
pcContent = pcContent.replace(/text-\[9\.5px\]/g, 'text-[9px]');
pcContent = pcContent.replace(/text-\[10px\]/g, 'text-[9.5px]');

fs.writeFileSync('./src/components/PalaceCell.tsx', pcContent, 'utf8');
console.log('PalaceCell.tsx updated');
