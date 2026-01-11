import { createPublicClient, http, type PublicClient } from 'viem';
import { polygon } from 'viem/chains';
import CTFExchangeABI from '../abi/CTFExchange.json';
import NegRiskCTFExchangeABI from '../abi/NegRiskCTFExchange.json';

// Contract addresses
const POLYGON_CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E' as const;
const POLYGON_NEG_RISK_CTF_EXCHANGE = '0xC5d563A36AE78145C45a50134d48A1215220f80a' as const;

class ContractService {
  private client: PublicClient;

  constructor() {
    this.client = createPublicClient({
      chain: polygon,
      transport: http(),
    });
  }

  async getConditionId(outcomeTokenId: string): Promise<string | null> {
    try {
      // First try the regular CTF Exchange
      const conditionId = await this.client.readContract({
        address: POLYGON_CTF_EXCHANGE,
        abi: CTFExchangeABI,
        functionName: 'getConditionId',
        args: [BigInt(outcomeTokenId)],
      }) as `0x${string}`;

      // If we get a non-zero condition ID, return it
      if (conditionId !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return conditionId;
      }

      // If the first call returns zero, try the Neg Risk CTF Exchange
      const negRiskConditionId = await this.client.readContract({
        address: POLYGON_NEG_RISK_CTF_EXCHANGE,
        abi: NegRiskCTFExchangeABI,
        functionName: 'getConditionId',
        args: [BigInt(outcomeTokenId)],
      }) as `0x${string}`;

      // Return the condition ID if it's not zero
      if (negRiskConditionId !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return negRiskConditionId;
      }

      return null;
    } catch (error) {
      console.error('Error getting condition ID:', error);
      return null;
    }
  }
}

export const ctfExchangeService = new ContractService();