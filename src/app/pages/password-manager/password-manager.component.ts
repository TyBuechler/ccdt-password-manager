import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CredentialService } from '../../services/credential.service';
import { PasswordGeneratorService } from '../../services/password-generator.service';
import { Credential, Folder } from '../../models/credential.model';

@Component({
  selector: 'app-password-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="toolbar">
        <h2>Password Vault</h2>
        <div class="toolbar-right">
          <div class="field search-field">
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="runSearch()" placeholder="Search sites, usernames, tags…" />
          </div>
          <button class="btn btn-primary" (click)="openAdd()">+ New Entry</button>
        </div>
      </div>

      <!-- Folder tabs -->
      <div class="folder-tabs">
        <button class="tab" [class.active]="!activeFolder" (click)="activeFolder = null; runSearch()">All</button>
        <button class="tab" *ngFor="let f of folders()" [class.active]="activeFolder === f.id" (click)="activeFolder = f.id ?? null; runSearch()">
          {{ f.name }}
        </button>
        <button class="tab add-folder" (click)="addFolderPrompt()">+ Folder</button>
      </div>

      <!-- Credentials list -->
      <div class="cred-list">
        <div *ngIf="filtered().length === 0" class="empty-state panel muted mono">No credentials found.</div>

        <div class="cred-card card" *ngFor="let c of filtered()">
          <div class="cred-top">
            <div class="cred-site">
              <div class="site-avatar">{{ c.siteName[0].toUpperCase() }}</div>
              <div>
                <div class="site-name">{{ c.siteName }}</div>
                <div class="site-user muted mono">{{ c.siteUsername }}</div>
              </div>
            </div>
            <div class="cred-strength">
              <span class="badge" [class]="strengthBadge(c.strength)">{{ c.strength ?? 'unknown' }}</span>
            </div>
          </div>

          <div class="cred-tags" *ngIf="c.tags?.length">
            <span class="tag" *ngFor="let t of c.tags">{{ t }}</span>
          </div>

          <div class="cred-actions">
            <button class="btn btn-icon" title="Copy username" (click)="copy(c.siteUsername, 'Username')">📋 User</button>
            <button class="btn btn-icon" title="Copy password" (click)="copyPassword(c)">🔑 Pass</button>
            <button class="btn btn-icon" title="Edit" (click)="openEdit(c)">✏️</button>
            <button class="btn btn-danger" title="Delete" (click)="deleteCred(c)">🗑</button>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div class="toast" *ngIf="toast" [class.show]="toast">{{ toast }}</div>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal panel" (click)="$event.stopPropagation()">
          <h3>{{ editId ? 'Edit Credential' : 'New Credential' }}</h3>

          <div class="modal-fields">
            <div class="field">
              <label>Site Name *</label>
              <input type="text" [(ngModel)]="form.siteName" placeholder="e.g. GitHub" />
            </div>
            <div class="field">
              <label>Site URL</label>
              <input type="text" [(ngModel)]="form.siteUrl" placeholder="https://github.com" />
            </div>
            <div class="field">
              <label>Username / Email *</label>
              <input type="text" [(ngModel)]="form.siteUsername" />
            </div>
            <div class="field">
              <label>Password *</label>
              <div class="pw-row">
                <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="form.sitePassword" (ngModelChange)="checkStrength()" />
                <button class="btn btn-icon" (click)="showPw = !showPw">{{ showPw ? '🙈' : '👁' }}</button>
                <button class="btn btn-icon" title="Generate" (click)="generatePw()">⚡</button>
              </div>
              <div class="strength-bar" *ngIf="form.sitePassword">
                <div class="bar-fill" [style.width.%]="(strength.score / 4)*100" [style.background]="strength.color"></div>
              </div>
            </div>
            <div class="field">
              <label>Tags (comma separated)</label>
              <input type="text" [(ngModel)]="tagsInput" placeholder="work, social, finance" />
            </div>
            <div class="field">
              <label>Folder</label>
              <select [(ngModel)]="form.folderId">
                <option value="">None</option>
                <option *ngFor="let f of folders()" [value]="f.id">{{ f.name }}</option>
              </select>
            </div>
          </div>

          <div class="alert alert-error" *ngIf="modalError">{{ modalError }}</div>

          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Saving…' : (editId ? 'Update' : 'Save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
    .toolbar { align-items: center; display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .toolbar-right { align-items: center; display: flex; gap: 12px; }
    .search-field { margin: 0; min-width: 240px; }
    .search-field input { margin: 0; }
    h2 { font-family: var(--font-mono); font-size: 20px; }
    .folder-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .tab { background: transparent; border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-secondary); cursor: pointer; font-family: var(--font-mono); font-size: 12px; padding: 6px 14px; text-transform: uppercase; transition: all var(--transition); }
    .tab:hover, .tab.active { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
    .add-folder { border-style: dashed; }
    .cred-list { display: flex; flex-direction: column; gap: 12px; }
    .cred-card { cursor: default; }
    .cred-top { align-items: center; display: flex; justify-content: space-between; margin-bottom: 10px; }
    .cred-site { align-items: center; display: flex; gap: 12px; }
    .site-avatar { align-items: center; background: var(--accent-glow); border: 1px solid var(--accent-dim); border-radius: 6px; color: var(--accent); display: flex; font-family: var(--font-mono); font-size: 16px; font-weight: 700; height: 36px; justify-content: center; width: 36px; }
    .site-name { font-size: 15px; font-weight: 600; }
    .site-user { font-size: 12px; margin-top: 2px; }
    .cred-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .tag { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 2px; color: var(--text-muted); font-family: var(--font-mono); font-size: 11px; padding: 2px 8px; }
    .cred-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .empty-state { font-size: 13px; padding: 32px; text-align: center; }
    .toast { background: var(--accent); border-radius: var(--radius); bottom: 32px; color: var(--bg-primary); font-family: var(--font-mono); font-size: 13px; opacity: 0; padding: 10px 20px; position: fixed; right: 32px; transition: opacity 0.3s; z-index: 200; }
    .toast.show { opacity: 1; }
    .modal-overlay { align-items: center; background: rgba(0,0,0,0.7); display: flex; inset: 0; justify-content: center; position: fixed; z-index: 150; }
    .modal { max-height: 90vh; max-width: 520px; overflow-y: auto; position: relative; width: 95%; }
    .modal h3 { font-family: var(--font-mono); font-size: 16px; margin-bottom: 20px; }
    .modal-fields { display: flex; flex-direction: column; gap: 16px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
    .pw-row { display: flex; gap: 8px; }
    .pw-row input { flex: 1; }
    .strength-bar { background: var(--border); border-radius: 2px; height: 4px; margin-top: 6px; overflow: hidden; }
    .bar-fill { height: 100%; transition: all 0.3s ease; border-radius: 2px; }
    .alert { margin-top: 12px; }
  `]
})
export class PasswordManagerComponent implements OnInit {
  credService = inject(CredentialService);
  gen = inject(PasswordGeneratorService);

  credentials = signal<Credential[]>([]);
  folders = signal<Folder[]>([]);
  filtered = signal<Credential[]>([]);

  searchQuery = '';
  activeFolder: string | null = null;
  showModal = false;
  showPw = false;
  saving = false;
  toast = '';
  modalError = '';
  editId: string | null = null;
  tagsInput = '';
  strength: any = { score: 0, color: '' };

  form: Partial<Credential> = this.emptyForm();

  emptyForm(): Partial<Credential> {
    return { siteName: '', siteUrl: '', siteUsername: '', sitePassword: '', folderId: '', tags: [] };
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    const [creds, folders] = await Promise.all([this.credService.getCredentials(), this.credService.getFolders()]);
    this.credentials.set(creds);
    this.folders.set(folders);
    this.runSearch();
  }

  runSearch() {
    let list = this.credentials();
    if (this.activeFolder) list = list.filter(c => c.folderId === this.activeFolder);
    this.filtered.set(this.credService.searchCredentials(list, this.searchQuery));
  }

  openAdd() { this.form = this.emptyForm(); this.editId = null; this.tagsInput = ''; this.modalError = ''; this.showModal = true; }

  openEdit(c: Credential) {
    this.form = { ...c };
    this.editId = c.id ?? null;
    this.tagsInput = (c.tags ?? []).join(', ');
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  checkStrength() { this.strength = this.gen.checkStrength(this.form.sitePassword ?? ''); }

  generatePw() {
    this.form.sitePassword = this.gen.generate({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true });
    this.checkStrength();
  }

  async save() {
    this.modalError = '';
    if (!this.form.siteName || !this.form.siteUsername || !this.form.sitePassword) {
      this.modalError = 'Site name, username, and password are required.'; return;
    }
    this.form.tags = this.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    this.form.strength = this.strength.label;
    this.saving = true;
    try {
      if (this.editId) {
        await this.credService.updateCredential(this.editId, this.form);
      } else {
        await this.credService.storeCredential(this.form as Omit<Credential, 'id'>);
      }
      await this.load();
      this.closeModal();
      this.showToast(this.editId ? 'Credential updated.' : 'Credential saved.');
    } catch (e: any) {
      this.modalError = e.message;
    } finally { this.saving = false; }
  }

  async deleteCred(c: Credential) {
    if (!confirm(`Delete "${c.siteName}"?`)) return;
    await this.credService.deleteCredential(c.id!, c.siteName);
    await this.load();
    this.showToast('Credential deleted.');
  }

  copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    this.showToast(`${label} copied!`);
  }

  copyPassword(c: Credential) { this.copy(c.sitePassword, 'Password'); }

  async addFolderPrompt() {
    const name = prompt('New folder name:');
    if (!name) return;
    await this.credService.createFolder(name.trim());
    await this.load();
  }

  strengthBadge(s?: string) {
    const map: Record<string, string> = { weak: 'badge-danger', fair: 'badge-warn', strong: 'badge-success', 'very-strong': 'badge-success' };
    return map[s ?? ''] ?? 'badge-warn';
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }
}
