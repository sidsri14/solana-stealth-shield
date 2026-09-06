export interface StealthMetaKey {
  spendingPubkey: string;
  viewingPubkey: string;
  formattedMetaAddress: string;
}

export interface StealthPayment {
  id: string;
  ephemeralPubkey: string;
  stealthAddress: string;
  amount: number;
  token: 'SOL' | 'USDC' | 'sUSD';
  timestamp: string;
  isClaimed: boolean;
  viewTag: string; // 1-byte fast scan filter
  txHash: string;
}

export interface PrivacyPoolStats {
  totalShieldedValue: number;
  anonymitySetSize: number;
  totalPrivateTxs: number;
  avgZkProofTimeMs: number;
}
