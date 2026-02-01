import { type FunctionComponent } from 'react';
import { generateProviderPairs, type ProviderPair } from '../utils/providerPairs';

interface ProviderPairSelectorProps {
  selectedPair: string;
  onPairChange: (pairId: string) => void;
}

/**
 * Provider pair selector component
 * Displays a dropdown to select between supported provider pairs
 */
const ProviderPairSelector: FunctionComponent<ProviderPairSelectorProps> = ({
  selectedPair,
  onPairChange,
}) => {
  const pairs = generateProviderPairs();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="provider-pair" className="text-sm font-medium text-gray-300">
        Market Pair:
      </label>
      <select
        id="provider-pair"
        value={selectedPair}
        onChange={(e) => onPairChange(e.target.value)}
        className="bg-[#1c0e0e] border border-[rgba(236,103,105,0.3)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
      >
        {pairs.map((pair) => (
          <option key={pair.id} value={pair.id}>
            {pair.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProviderPairSelector;
export type { ProviderPair };
