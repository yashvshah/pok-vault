import type { MarketActivityInfo } from "../types/vault";

interface MarketDisplayProps {
  marketInfoA?: MarketActivityInfo;
  marketInfoB?: MarketActivityInfo;
  fallbackText?: string;
}

function MarketRow({ info }: { info: MarketActivityInfo }) {
  const platformName = info.platform.charAt(0).toUpperCase() + info.platform.slice(1);
  
  const content = (
    <div className="flex items-start gap-2 py-1">
      <img 
        src={info.platformLogo} 
        alt={platformName} 
        className="w-4 h-4 mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" title={info.question}>
          {info.question}
        </p>
        <p className="text-xs text-gray-400">
          {info.outcomeType.toUpperCase()} • {platformName}
        </p>
      </div>
    </div>
  );

  if (info.url) {
    return (
      <a
        href={info.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:bg-white/5 rounded px-2 -mx-2 transition block"
      >
        {content}
      </a>
    );
  }

  return <div className="px-2 -mx-2">{content}</div>;
}

export function MarketDisplay({ marketInfoA, marketInfoB, fallbackText }: MarketDisplayProps) {
  if (!marketInfoA && !marketInfoB) {
    return <span className="text-gray-400">{fallbackText || "N/A"}</span>;
  }

  return (
    <div className="space-y-1">
      {marketInfoA && <MarketRow info={marketInfoA} />}
      {marketInfoB && <MarketRow info={marketInfoB} />}
    </div>
  );
}
