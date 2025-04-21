import { useCallback, useState, useEffect } from 'react'
import { 
  useContractRead as wagmiUseContractRead, 
  useContractWrite as wagmiUseContractWrite,
  useTransaction as wagmiUseTransaction
} from 'wagmi'

// Type definitions
export type Address = `0x${string}`

// Types for ABI and parameters
export type AbiType = readonly unknown[] | unknown[]
export type ArgsType = readonly unknown[] | unknown[]

// Types for our adapters
export type ContractReadParams = {
  address: Address;
  abi: AbiType;
  functionName: string;
  args?: ArgsType;
  enabled?: boolean;
  [key: string]: unknown;
}

export type ContractWriteParams = {
  address: Address;
  abi: AbiType;
  functionName: string;
  [key: string]: unknown;
}

export type WriteAsyncParams = {
  args?: ArgsType;
  value?: bigint;
  [key: string]: unknown;
}

/**
 * Type-safe wrapper for useContractRead from wagmi
 * Adds enabled option that wagmi v2 removed
 */
export function useContractRead<TData = unknown>(params: ContractReadParams) {
  const { enabled = true, ...restParams } = params
  
  if (!enabled) {
    return { 
      data: undefined as TData, 
      isLoading: false, 
      isError: false, 
      error: null, 
      refetch: () => Promise.resolve({ data: undefined as TData }) 
    }
  }
  
  return wagmiUseContractRead(restParams) as {
    data: TData;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<{ data: TData }>;
    [key: string]: unknown;
  }
}

/**
 * Type-safe wrapper for useContractWrite from wagmi
 * Provides a writeAsync method for easier async/await
 */
export function useContractWrite(params: ContractWriteParams) {
  const [data, setData] = useState<Address | undefined>(undefined)
  
  // Get the base hook
  const result = wagmiUseContractWrite()
  
  // Create an async wrapper
  const writeAsync = useCallback(async (writeParams: WriteAsyncParams): Promise<Address> => {
    try {
      const { args = [] } = writeParams
      
      // Tipe uygun params oluştur
      const contractParams: any = {
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args
      }
      
      // Value parametresini koşullu ekle
      if (writeParams.value !== undefined) {
        contractParams.value = writeParams.value
      }
      
      // Call the underlying write function
      const txHash = await result.writeContractAsync(contractParams)
      
      // Store the hash for useWaitForTransaction
      setData(txHash)
      return txHash
    } catch (error) {
      console.error('Contract write error:', error)
      throw error
    }
  }, [params, result])
  
  return {
    writeAsync,
    data,
    isLoading: result.isPending,
    isError: result.isError,
    error: result.error
  }
}

/**
 * Type-safe hook to wait for transaction confirmation
 */
export function useWaitForTransaction({ hash }: { hash?: Address }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  
  // Use the base hook if we have a hash
  const transaction = hash 
    ? wagmiUseTransaction({ hash }) 
    : { data: null, isLoading: false, isError: false }
  
  // Update the state based on transaction status
  useEffect(() => {
    if (!hash) {
      setIsLoading(false)
      setIsSuccess(false)
      setIsError(false)
      return
    }
    
    if (!isLoading && !transaction.isLoading && !isSuccess && !isError) {
      setIsLoading(true)
    }
    
    if (transaction.data?.blockNumber && isLoading) {
      setIsLoading(false)
      setIsSuccess(true)
    }
    
    if (transaction.isError && isLoading) {
      setIsLoading(false)
      setIsError(true)
    }
  }, [hash, transaction.data, transaction.isLoading, transaction.isError, isLoading, isSuccess, isError])
  
  return {
    data: transaction.data,
    isLoading,
    isSuccess,
    isError
  }
} 