import { useAccount, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { erc1155Abi } from 'viem';

export function useErc1155Balance({
  tokenAddress,
  tokenId,
  chainId,
  ownerAddress,
}: {
  tokenAddress: Address;
  tokenId: bigint;
  chainId: number;
  ownerAddress?: Address | null;
}) {
  const { address } = useAccount();
  
  // Use provided ownerAddress (safe) if available, otherwise use connected EOA
  const effectiveOwner = ownerAddress ?? address ?? '0x0000000000000000000000000000000000000000';
  
  return useReadContract({
    abi: erc1155Abi,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: [effectiveOwner, tokenId],
    chainId,
  });
}
