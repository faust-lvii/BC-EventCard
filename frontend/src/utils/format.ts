import { formatEther } from 'viem';

/**
 * Format a timestamp to a human-readable date and time
 * @param timestamp Unix timestamp in seconds
 * @param locale Locale for formatting (default: 'tr-TR')
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  timestamp: bigint | number,
  locale = 'tr-TR',
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(Number(timestamp) * 1000);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleString(locale, options || defaultOptions);
};

/**
 * Format a unix timestamp to a relative time (e.g. "2 days ago", "in 3 hours")
 * @param timestamp Unix timestamp in seconds
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: bigint | number): string => {
  const now = Math.floor(Date.now() / 1000);
  const time = Number(timestamp);
  const diff = time - now;
  
  const absSeconds = Math.abs(diff);
  const isPast = diff < 0;
  
  if (absSeconds < 60) {
    return isPast ? 'az önce' : 'birazdan';
  }
  
  if (absSeconds < 3600) {
    const minutes = Math.floor(absSeconds / 60);
    return isPast ? `${minutes} dakika önce` : `${minutes} dakika içinde`;
  }
  
  if (absSeconds < 86400) {
    const hours = Math.floor(absSeconds / 3600);
    return isPast ? `${hours} saat önce` : `${hours} saat içinde`;
  }
  
  if (absSeconds < 2592000) {
    const days = Math.floor(absSeconds / 86400);
    return isPast ? `${days} gün önce` : `${days} gün içinde`;
  }
  
  const months = Math.floor(absSeconds / 2592000);
  return isPast ? `${months} ay önce` : `${months} ay içinde`;
};

/**
 * Format ETH amount with specified decimals
 * @param amount Amount in wei (as bigint)
 * @param decimals Number of decimal places to show (default: 4)
 * @returns Formatted ETH amount string
 */
export const formatEtherAmount = (amount: bigint, decimals = 4): string => {
  const ethString = formatEther(amount);
  const parts = ethString.split('.');
  
  if (parts.length === 1) return ethString;
  
  const integerPart = parts[0];
  const decimalPart = parts[1].slice(0, decimals);
  
  return `${integerPart}.${decimalPart}`;
};

/**
 * Format address to a shortened version
 * @param address Ethereum address
 * @param prefixLength Number of characters to keep at the beginning
 * @param suffixLength Number of characters to keep at the end
 * @returns Shortened address
 */
export const shortenAddress = (
  address: string,
  prefixLength = 6,
  suffixLength = 4
): string => {
  if (!address || address.length < prefixLength + suffixLength) {
    return address || '';
  }
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

export default {
  formatDateTime,
  formatRelativeTime,
  formatEtherAmount,
  shortenAddress
}; 