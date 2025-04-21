import { useState, useEffect } from 'react'
import { useTransaction } from 'wagmi'

/**
 * Custom hook to wait for a transaction to complete
 * This works around the missing useWaitForTransaction hook in wagmi v2
 */
export function useWaitForTransaction({ hash }: { hash?: `0x${string}` }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Use wagmi's useTransaction hook to get transaction data
  // Only query if we have a hash
  const { data: transaction, isLoading: txLoading, isError: txError } = 
    hash ? useTransaction({ hash }) : { data: null, isLoading: false, isError: false }

  useEffect(() => {
    if (!hash) {
      setIsLoading(false)
      setIsSuccess(false)
      setIsError(false)
      setError(null)
      return
    }

    // Set loading state while we wait for transaction
    setIsLoading(true)
    setIsSuccess(false)
    setIsError(false)

    // Check if transaction has an error
    if (txError) {
      setIsLoading(false)
      setIsError(true)
      setError(new Error('Transaction failed'))
      return
    }

    // Check if transaction is confirmed
    if (transaction?.blockNumber) {
      setIsLoading(false)
      setIsSuccess(true)
    }
  }, [hash, transaction, txLoading, txError])

  return {
    data: transaction,
    isLoading,
    isSuccess,
    isError,
    error,
  }
}

export default useWaitForTransaction 