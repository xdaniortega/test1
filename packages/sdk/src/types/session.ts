import { type Address, type Hex } from 'viem';

export interface SessionKeyPermissions {
  /** Allowed target contract addresses (empty = all allowed) */
  allowedTargets?: Address[];
  /** Allowed function selectors per target */
  allowedFunctions?: Record<string, Hex[]>;
  /** Maximum value per transaction in wei */
  maxValuePerTransaction?: bigint;
  /** Maximum total value across all transactions in wei */
  maxTotalValue?: bigint;
  /** Maximum number of transactions */
  maxTransactions?: number;
}

export interface SessionKeyConfig {
  /** Human-readable label for this session */
  label: string;
  /** When the session becomes valid (unix timestamp in seconds) */
  validAfter: number;
  /** When the session expires (unix timestamp in seconds) */
  validUntil: number;
  /** Permission constraints */
  permissions: SessionKeyPermissions;
}

export interface SessionKeyInfo {
  /** Unique session identifier */
  id: string;
  /** The session key public address */
  sessionKeyAddress: Address;
  /** Human-readable label */
  label: string;
  /** When the session becomes valid */
  validAfter: number;
  /** When the session expires */
  validUntil: number;
  /** Permission constraints */
  permissions: SessionKeyPermissions;
  /** Whether the session is currently active */
  isActive: boolean;
  /** Whether the session has been revoked */
  isRevoked: boolean;
  /** Creation timestamp */
  createdAt: number;
}

export interface SessionKeyData {
  /** Session info */
  info: SessionKeyInfo;
  /** Encrypted private key of the session key */
  encryptedPrivateKey: string;
}
