import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Credential, AuditLog, Folder } from '../models/credential.model';
import { AuthService } from './auth.service';
import { db } from './firebase';

@Injectable({ providedIn: 'root' })
export class CredentialService {

  constructor(private auth: AuthService) {}

  private get uid(): string {
    const uid = this.auth.sessionUid;
    if (!uid) throw new Error('Not authenticated.');
    return uid;
  }

  // ── Credentials ──────────────────────────────────────────────────────────

  async getCredentials(): Promise<Credential[]> {
    const uid = this.uid;
    const snap = await getDocs(collection(db, 'users', uid, 'credentials'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Credential));
  }

  async storeCredential(cred: Omit<Credential, 'id'>): Promise<string> {
    const uid = this.uid;
    const ref = await addDoc(collection(db, 'users', uid, 'credentials'), {
      ...cred,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    await this.logAction('create', ref.id, cred.siteName);
    return ref.id;
  }

  async updateCredential(credentialId: string, updates: Partial<Credential>): Promise<void> {
    const uid = this.uid;
    const ref = doc(db, 'users', uid, 'credentials', credentialId);
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() });
    await this.logAction('update', credentialId, updates.siteName);
  }

  async deleteCredential(credentialId: string, siteName?: string): Promise<void> {
    const uid = this.uid;
    await deleteDoc(doc(db, 'users', uid, 'credentials', credentialId));
    await this.logAction('delete', credentialId, siteName);
  }

  searchCredentials(credentials: Credential[], query: string): Credential[] {
    if (!query.trim()) return credentials;
    const q = query.toLowerCase();
    return credentials.filter(c =>
      c.siteName.toLowerCase().includes(q) ||
      c.siteUsername.toLowerCase().includes(q) ||
      (c.tags ?? []).some(t => t.toLowerCase().includes(q))
    );
  }

  // ── Folders ───────────────────────────────────────────────────────────────

  async getFolders(): Promise<Folder[]> {
    const uid = this.uid;
    const snap = await getDocs(collection(db, 'users', uid, 'folders'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Folder));
  }

  async createFolder(name: string): Promise<string> {
    const uid = this.uid;
    const ref = await addDoc(collection(db, 'users', uid, 'folders'), {
      name, userId: uid, createdAt: Timestamp.now()
    });
    return ref.id;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const uid = this.uid;
    await deleteDoc(doc(db, 'users', uid, 'folders', folderId));
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────

  async getAuditLogs(): Promise<AuditLog[]> {
    const uid = this.uid;
    const snap = await getDocs(collection(db, 'users', uid, 'auditLogs'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as AuditLog))
      .sort((a, b) => {
        const aTime = (a.timestamp as any)?.toDate?.() ?? new Date(a.timestamp as any);
        const bTime = (b.timestamp as any)?.toDate?.() ?? new Date(b.timestamp as any);
        return bTime.getTime() - aTime.getTime();
      });
  }

  async logCopyAction(credentialId: string, siteName: string): Promise<void> {
    await this.logAction('copy', credentialId, siteName);
  }

  private async logAction(action: AuditLog['action'], targetId?: string, targetName?: string): Promise<void> {
    const uid = this.uid;
    await addDoc(collection(db, 'users', uid, 'auditLogs'), {
      userId: uid,
      action,
      targetId: targetId ?? '',
      targetName: targetName ?? '',
      timestamp: Timestamp.now()
    });
  }

  // ── Feedback ──────────────────────────────────────────────────────────────

  async submitFeedback(message: string): Promise<void> {
    const uid = this.uid;
    await addDoc(collection(db, 'feedback'), {
      userId: uid,
      message,
      createdAt: Timestamp.now()
    });
  }
}
