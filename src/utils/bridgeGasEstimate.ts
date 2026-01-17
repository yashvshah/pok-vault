import { AxelarQueryAPI, Environment, EvmChain } from '@axelar-network/axelarjs-sdk';
import { parseEther } from 'viem';

const queryAPI = new AxelarQueryAPI({
  environment: Environment.MAINNET,
});

const GAS_LIMIT = 96000;

export interface GasFeeEstimate {
  feeInWei: string;
  feeInEther: string;
}

/**
 * Estimate gas fee for bridging from Polygon to BSC
 * @returns Gas fee estimate in wei and ether
 */
export async function estimateGasFeePolygonToBSC(): Promise<GasFeeEstimate> {
  try {
    const fee = await queryAPI.estimateGasFee(
      EvmChain.POLYGON,
      EvmChain.BINANCE,
      GAS_LIMIT
    );

    // The fee is returned as a string in wei
    const feeInWei = typeof fee === 'string' ? fee : fee.baseFee;
    
    // Convert wei to ether for display (1 ether = 10^18 wei)
    const feeInEther = (BigInt(feeInWei) / BigInt(10 ** 18)).toString();

    console.log('Gas fee estimate (Polygon → BSC):', {
      feeInWei,
      feeInEther,
    });

    return {
      feeInWei,
      feeInEther,
    };
  } catch (error) {
    console.error('Error estimating gas fee (Polygon → BSC):', error);
    throw error;
  }
}

/**
 * Estimate gas fee for bridging from BSC to Polygon
 * @returns Gas fee estimate in wei and ether
 */
export async function estimateGasFeeBSCToPolygon(): Promise<GasFeeEstimate> {
  try {
    const fee = await queryAPI.estimateGasFee(
      EvmChain.BINANCE,
      EvmChain.POLYGON,
      GAS_LIMIT
    );

    // The fee is returned as a string in wei
    const feeInWei = typeof fee === 'string' ? fee : fee.baseFee;
    
    // Convert wei to ether for display (1 ether = 10^18 wei)
    const feeInEther = parseEther(BigInt(feeInWei).toString()).toString();

    console.log('Gas fee estimate (BSC → Polygon):', {
      feeInWei,
      feeInEther,
    });

    return {
      feeInWei,
      feeInEther,
    };
  } catch (error) {
    console.error('Error estimating gas fee (BSC → Polygon):', error);
    throw error;
  }
}

/**
 * Estimate gas fee for bridging based on direction
 * @param direction - Direction of bridge transaction
 * @returns Gas fee estimate in wei and ether
 */
export async function estimateBridgeGasFee(
  direction: 'polygon-to-bsc' | 'bsc-to-polygon'
): Promise<GasFeeEstimate> {
  if (direction === 'polygon-to-bsc') {
    return estimateGasFeePolygonToBSC();
  } else {
    return estimateGasFeeBSCToPolygon();
  }
}
