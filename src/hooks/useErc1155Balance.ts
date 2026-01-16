import { useAccount, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { erc1155Abi } from 'viem';

export function useErc1155Balance({
  tokenAddress,
  tokenId,
  chainId,
}: {
  tokenAddress: Address;
  tokenId: bigint;
  chainId: number;
}) {
  const { address } = useAccount();
  return useReadContract({
    abi: erc1155Abi,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000', tokenId],
    chainId,
  });
}
