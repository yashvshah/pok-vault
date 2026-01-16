import { useCallback } from "react";
import { useWriteContract, useAccount } from "wagmi";
import type { Address, Abi, ContractFunctionName, ContractFunctionArgs } from "viem";
import { encodeFunctionData } from "viem";
import GnosisSafeAbi from "../abi/GnosisSafe.json";
import { ZERO_ADDRESS } from "../config/safe";
import { generateSingleOwnerSignature } from "../utils/safe";

interface WriteContractParams<
  TAbi extends Abi | readonly unknown[] = Abi,
  TFunctionName extends ContractFunctionName<TAbi, "nonpayable" | "payable"> = ContractFunctionName<TAbi, "nonpayable" | "payable">
> {
  address: Address;
  abi: TAbi;
  functionName: TFunctionName;
  args?: ContractFunctionArgs<TAbi, "nonpayable" | "payable", TFunctionName>;
  value?: bigint;
  chainId?: number;
}

interface UseSafeWriteParams {
  safeAddress?: Address | null;
  chainId: number;
}

/**
 * Universal write hook that handles both EOA and Gnosis Safe transactions
 * If safeAddress is provided and exists, wraps the call in execTransaction
 * Otherwise, uses standard writeContract
 */
export function useSafeWrite({ safeAddress, chainId }: UseSafeWriteParams) {
  const { writeContract } = useWriteContract();
  const { address: eoaAddress } = useAccount();

  const write = useCallback(
    async <
      TAbi extends Abi | readonly unknown[] = Abi,
      TFunctionName extends ContractFunctionName<TAbi, "nonpayable" | "payable"> = ContractFunctionName<TAbi, "nonpayable" | "payable">
    >(
      params: WriteContractParams<TAbi, TFunctionName>
    ) => {
      // If no safe address, use regular writeContract
      if (!safeAddress || !eoaAddress) {
        return writeContract({
          address: params.address,
          abi: params.abi as Abi,
          functionName: params.functionName as string,
          args: params.args as readonly unknown[],
          value: params.value,
          chainId: params.chainId ?? chainId,
        });
      }

      // Encode the function call
      const data = encodeFunctionData({
        abi: params.abi as Abi,
        functionName: params.functionName as string,
        args: params.args as readonly unknown[],
      });

      // Generate signature for single owner (the connected EOA)
      const signatures = generateSingleOwnerSignature(eoaAddress);

      // Execute through Gnosis Safe
      return writeContract({
        address: safeAddress,
        abi: GnosisSafeAbi as Abi,
        functionName: "execTransaction",
        args: [
          params.address,           // to
          params.value ?? 0n,       // value
          data,                     // data
          0,                        // operation (0 = CALL)
          0n,                       // safeTxGas
          0n,                       // baseGas
          0n,                       // gasPrice
          ZERO_ADDRESS,             // gasToken
          ZERO_ADDRESS,             // refundReceiver
          signatures,               // signatures
        ],
        chainId: params.chainId ?? chainId,
      });
    },
    [safeAddress, eoaAddress, writeContract, chainId]
  );

  return { write, writeAsync: write };
}
