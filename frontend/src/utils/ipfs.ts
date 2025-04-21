// IPFS Gateway URLs to try
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/'
];

// Interface for metadata returned from IPFS
export interface IPFSMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: unknown;
}

/**
 * Convert an IPFS URI (ipfs://) to an HTTP URL using a gateway
 * @param ipfsUri The IPFS URI to convert
 * @param gatewayIndex Optional index of the gateway to use
 * @returns HTTP URL for the content
 */
export const ipfsToHttpUrl = (ipfsUri: string, gatewayIndex = 0): string => {
  // Handle invalid input
  if (!ipfsUri || typeof ipfsUri !== 'string') {
    return '';
  }
  
  // Ensure we don't exceed the gateway array bounds
  const safeIndex = gatewayIndex % IPFS_GATEWAYS.length;
  const gateway = IPFS_GATEWAYS[safeIndex];
  
  // Convert ipfs:// URI to HTTP URL
  if (ipfsUri.startsWith('ipfs://')) {
    return gateway + ipfsUri.slice(7);
  }
  
  // Handle CIDs directly
  if (ipfsUri.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return gateway + ipfsUri;
  }
  
  // Return the original if it doesn't match IPFS format
  return ipfsUri;
};

/**
 * Fetch metadata from IPFS URI
 * @param ipfsUri The IPFS URI for the metadata
 * @returns Metadata object or null if fetch fails
 */
export const fetchIPFSMetadata = async (ipfsUri: string): Promise<IPFSMetadata | null> => {
  // Try each gateway in order
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const url = ipfsToHttpUrl(ipfsUri, i);
      const response = await fetch(url);
      
      if (!response.ok) {
        continue; // Try next gateway
      }
      
      const metadata = await response.json();
      
      // If the metadata has an IPFS image, convert it to HTTP URL
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        metadata.image = ipfsToHttpUrl(metadata.image, i);
      }
      
      return metadata;
    } catch (error) {
      console.warn(`Failed to fetch from gateway ${i}:`, error);
      // Continue to next gateway
    }
  }
  
  console.error(`Failed to fetch metadata from all IPFS gateways: ${ipfsUri}`);
  return null;
};

export default {
  ipfsToHttpUrl,
  fetchIPFSMetadata
}; 