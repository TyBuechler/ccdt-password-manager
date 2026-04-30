export interface Credential {
  id?: string;
  siteName: string;
  siteUrl?: string;
  siteUsername: string;
  sitePassword: string; // stored encrypted
  tags?: string[];
  folderIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  strength?: 'weak' | 'fair' | 'strong' | 'very-strong';
}

export interface PasswordStrengthResult {
  score: number;       // 0-4
  label: 'weak' | 'fair' | 'strong' | 'very-strong';
  color: string;
  feedback: string[];
}

export interface AuditLog {
  id?: string;
  userId: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'copy' | 'share';
  targetId?: string;
  targetName?: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface SharedCredential {
  id?: string;
  credentialId: string;
  ownerId: string;
  sharedWithEmail: string;
  sharedWithId?: string;
  permissions: 'view' | 'use';
  expiresAt?: Date;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt?: Date;
}
