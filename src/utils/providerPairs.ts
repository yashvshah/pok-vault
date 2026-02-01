import { providerRegistry } from '../services/providers';

export interface ProviderPair {
  id: string;
  label: string;
  provider1: string;
  provider2: string;
}

/**
 * Generate all valid provider pairs from registered providers
 */
export function generateProviderPairs(): ProviderPair[] {
  const providers = providerRegistry.getAll();
  const pairs: ProviderPair[] = [];

  for (let i = 0; i < providers.length; i++) {
    for (let j = i + 1; j < providers.length; j++) {
      const p1 = providers[i];
      const p2 = providers[j];
      
      // Create pair ID (alphabetically sorted for consistency)
      const [first, second] = [p1.id, p2.id].sort();
      const pairId = `${first}-${second}`;
      const pairLabel = `${p1.name} × ${p2.name}`;

      pairs.push({
        id: pairId,
        label: pairLabel,
        provider1: first,
        provider2: second,
      });
    }
  }

  return pairs;
}
