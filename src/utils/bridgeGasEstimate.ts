import { AxelarQueryAPI, Environment, EvmChain } from '@axelar-network/axelarjs-sdk';
import { formatEther } from 'viem';

const queryAPI = new AxelarQueryAPI({
  environment: Environment.MAINNET,
});

const GAS_LIMIT = 120_000;

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
//     interface GMPParams {
//     showDetailedFees: boolean;
//     transferAmount?: number;
//     transferAmountInUnits?: string;
//     destinationContractAddress: string;
//     sourceContractAddress: string;
//     tokenSymbol: string;
// }

//  /**
//      * Calculate estimated gas amount to pay for the gas receiver contract.
//      * @param sourceChainId Can be of the EvmChain enum or string. If string, should try to generalize to use the CHAINS constants (e.g. CHAINS.MAINNET.ETHEREUM)
//      * @param destinationChainId Can be of the EvmChain enum or string. If string, should try to generalize to use the CHAINS constants (e.g. CHAINS.MAINNET.ETHEREUM)
//      * @param gasLimit An estimated gas amount required to execute the transaction at the destination chain. For destinations on OP Stack chains (Optimism, Base, Scroll, Fraxtal, Blast, etc.), set only the L2 gas limit. The endpoint will automatically handle L1 gas estimation and bundling.
//      * @param gasMultiplier (Optional) A multiplier used to create a buffer above the calculated gas fee, to account for potential slippage throughout tx execution, e.g. 1.1 = 10% buffer. supports up to 3 decimal places
//      * The default value is "auto", which uses the gas multiplier from the fee response
//      * @param sourceChainTokenSymbol (Optional) the gas token symbol on the source chain.
//      * @param minGasPrice (Optional) A minimum value, in wei, for the gas price on the destination chain that is used to override the estimated gas price if it falls below this specified value.
//      * @param executeData (Optional) The data to be executed on the destination chain. It's recommended to specify it if the destination chain is an L2 chain to calculate more accurate gas fee.
//      * @param gmpParams (Optional) Additional parameters for GMP transactions, including the ability to see a detailed view of the fee response
//      * @returns
//      */

// we need to show the entire fee response for debugging
    const fee = await queryAPI.estimateGasFee(
      EvmChain.POLYGON,
      EvmChain.BNBCHAIN,
      GAS_LIMIT,
      300 // gas multiplier to account for fluctuations (why is this much multiplier doesn't work??)
    );

    // The fee is returned as a string in wei
    const feeInWei = typeof fee === 'string' ? (BigInt(fee)).toString() : ((BigInt(fee.baseFee) + BigInt(fee.executionFeeWithMultiplier))).toString();
    
    // Convert wei to ether for display (1 ether = 10^18 wei)
    const feeInEther = formatEther(BigInt(feeInWei));

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
      EvmChain.BNBCHAIN,
      EvmChain.POLYGON,
      GAS_LIMIT,
      500 // gas multiplier to account for fluctuations (why is this much multiplier doesn't work??)
    );

    // The fee is returned as a string in wei
    const feeInWei = typeof fee === 'string' 
      ? (BigInt(fee)).toString()
      : ((BigInt(fee.baseFee) + BigInt(fee.executionFeeWithMultiplier))).toString();
    
    // Convert wei to ether for display (1 ether = 10^18 wei)
    const feeInEther = formatEther(BigInt(feeInWei));

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
