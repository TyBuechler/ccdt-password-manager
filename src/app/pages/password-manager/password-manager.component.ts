import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CredentialService } from '../../services/credential.service';
import { PasswordGeneratorService } from '../../services/password-generator.service';
import { Credential, Folder } from '../../models/credential.model';

function toMs(ts: any): number {
  return ts?.toDate ? ts.toDate().getTime() : new Date(ts ?? 0).getTime();
}

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
          <select class="sort-select" [(ngModel)]="sortOrder" (ngModelChange)="runSearch()">
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <button class="btn btn-primary" (click)="openAdd()">+ New Entry</button>
        </div>
      </div>

      <!-- Folder tabs -->
      <div class="folder-tabs">
        <div class="folder-row">
          <button class="tab" [class.active]="!activeFolder" (click)="activeFolder = null; runSearch()">All ({{ credentials().length }})</button>
          <button class="tab" *ngFor="let f of folders()" [class.active]="activeFolder === f.id" (click)="toggleFolder(f.id)">
            📁 {{ f.name }} ({{ countInFolder(f.id) }})
          </button>
          <button class="tab add-folder" (click)="addFolder()">+ Folder</button>
          <button class="btn btn-icon btn-sm" *ngIf="activeFolder" (click)="editFolder()" title="Rename folder">✎</button>
          <button class="btn btn-danger btn-sm" *ngIf="activeFolder" (click)="deleteFolder()" title="Delete folder">🗑</button>
        </div>
      </div>

      <!-- Tag cloud -->
      <div class="tag-cloud" *ngIf="allTags.length > 0">
        <button class="tag-chip" *ngFor="let t of allTags"
          [class.active]="activeTag === t"
          (click)="toggleTag(t)">{{ t }}</button>
        <button class="tag-chip tag-clear" *ngIf="activeTag" (click)="activeTag = null; runSearch()">✕ Clear</button>
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
                <div class="site-user">
                  <span class="muted mono">{{ shownUsernames.has(c.id!) ? c.siteUsername : '••••••••' }}</span>
                  <button class="btn-tiny" (click)="toggleUsername(c.id!)" title="Show/hide username">{{ shownUsernames.has(c.id!) ? '🙈' : '👁' }}</button>
                  <button class="btn-tiny" (click)="copy(c.siteUsername, 'Username')" title="Copy username">⎘</button>
                </div>
              </div>
            </div>
            <div class="cred-top-right">
              <span class="badge" [class]="strengthBadge(c.strength)" *ngIf="c.strength">{{ c.strength }}</span>
              <a class="btn btn-icon visit-btn" *ngIf="c.siteUrl" (click)="visitSite(c)" title="Copy password & open site">↗ Visit</a>
            </div>
          </div>

          <div class="cred-meta" *ngIf="c.folderIds?.length || c.tags?.length">
            <span class="folder-badge" *ngFor="let fid of (c.folderIds ?? [])">📁 {{ getFolderName(fid) }}</span>
            <span class="tag" *ngFor="let t of (c.tags ?? [])">{{ t }}</span>
          </div>

          <div class="cred-actions">
            <button class="btn btn-icon" title="Copy password" (click)="copyPassword(c)">Copy Password</button>
            <button class="btn btn-icon" title="Edit" (click)="openEdit(c)">Edit</button>
            <ng-container *ngIf="deletingId !== c.id">
              <button class="btn btn-danger" title="Delete" (click)="deletingId = c.id!">Delete</button>
            </ng-container>
            <ng-container *ngIf="deletingId === c.id">
              <span class="muted mono" style="font-size:11px;white-space:nowrap">Delete?</span>
              <button class="btn btn-danger btn-sm" (click)="confirmDelete(c)">Yes</button>
              <button class="btn btn-ghost btn-sm" (click)="deletingId = null">No</button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div class="toast" *ngIf="toast" [class.show]="toast">{{ toast }}</div>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="onOverlayClick($event)">
        <div class="modal panel" (click)="$event.stopPropagation()"(mousedown)="onModalMousedown()">
          <h3>{{ editId ? 'Edit Credential' : 'New Credential' }}</h3>

          <div class="modal-fields">
            <div class="field">
              <label>Site Name *</label>
              <input type="text" [(ngModel)]="form.siteName" placeholder="e.g. GitHub" maxlength="50"/>
            </div>
            <div class="field">
              <label>Site URL</label>
              <input type="text" [(ngModel)]="form.siteUrl" placeholder="https://github.com" />
            </div>
            <div class="field">
              <label>Username / Email *</label>
              <input type="text" [(ngModel)]="form.siteUsername" maxlength="100"/>
            </div>
            <div class="field">
              <label>Password *</label>
              <div class="pw-row">
                <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="form.sitePassword"
                  (ngModelChange)="checkStrength(); checkDuplicate()" />
                <button class="btn btn-icon" (click)="showPw = !showPw">👁</button>
              </div>
              <div class="pw-row" style="width: 100%">
                <button class="btn btn-icon" style="flex: 1" title="Generate" (click)="generatePw()">Generate</button>
                <button class="btn btn-icon" style="flex: 1" title="Strengthen" (click)="strengthenPw()">Strengthen</button>
              </div>
              <div class="strength-bar" *ngIf="form.sitePassword">
                <div class="bar-fill" [style.width.%]="(strength.score / 4)*100" [style.background]="strength.color"></div>
              </div>
              <span class="badge" [class]="strengthBadge(strength.label)">
                Password Strength: {{ strength.label | titlecase }}
              </span>
              <div class="dup-warning" *ngIf="duplicateWarning">{{ duplicateWarning }}</div>
            </div>
            <div class="field">
              <label>Tags (comma separated)</label>
              <input type="text" [(ngModel)]="tagsInput" placeholder="work, social, finance" maxlength="200"/>
            </div>
            <div class="field">
              <div class="folders-header">
                <label>Folders</label>
                <button class="btn btn-ghost btn-sm" type="button" (click)="showAddFolderInput = !showAddFolderInput">+ New Folder</button>
              </div>
              <div class="folder-checkboxes" *ngIf="folders().length > 0">
                <label class="check-item" *ngFor="let f of folders()">
                  <input type="checkbox" [checked]="isChecked(f.id)" (change)="toggleFormFolder(f.id)" />
                  {{ f.name }}
                </label>
              </div>
              <p class="muted mono" style="font-size:11px;margin-top:4px" *ngIf="folders().length === 0 && !showAddFolderInput">No folders yet. Create one below.</p>
              <div class="new-folder-row" *ngIf="showAddFolderInput">
                <input [(ngModel)]="newFolderName" placeholder="Folder name" (keyup.enter)="createFolderInModal()" maxlength="50"/>
                <button class="btn btn-primary btn-sm" (click)="createFolderInModal()">Add</button>
                <button class="btn btn-ghost btn-sm" (click)="showAddFolderInput = false; newFolderName = ''">✕</button>
              </div>
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
    .toolbar-right { align-items: center; display: flex; gap: 10px; flex-wrap: wrap; }
    .search-field { margin: 0; min-width: 240px; }
    .search-field input { margin: 0; }
    h2 { font-family: var(--font-mono); font-size: 20px; }
    .sort-select { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary); cursor: pointer; font-family: var(--font-mono); font-size: 12px; outline: none; padding: 8px 12px; }
    .folder-tabs { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; }
    .tab { background: transparent; border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-secondary); cursor: pointer; font-family: var(--font-mono); font-size: 12px; padding: 6px 14px; text-transform: uppercase; transition: all var(--transition); }
    .tab:hover, .tab.active { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
    .add-folder { border-style: dashed; }
    .btn-sm { font-size: 11px; padding: 4px 10px; }
    .tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .tag-chip { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 2px; color: var(--text-muted); cursor: pointer; font-family: var(--font-mono); font-size: 11px; padding: 3px 10px; transition: all var(--transition); }
    .tag-chip:hover, .tag-chip.active { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
    .tag-clear { border-color: var(--accent-danger); color: var(--accent-danger); }
    .tag-clear:hover { background: rgba(255,0,0,0.08); }
    .cred-list { display: flex; flex-direction: column; gap: 12px; }
    .cred-card { cursor: default; }
    .cred-top { align-items: flex-start; display: flex; justify-content: space-between; margin-bottom: 8px; gap: 8px; }
    .cred-site { align-items: center; display: flex; gap: 12px; min-width: 0; }
    .site-avatar { align-items: center; background: var(--accent-glow); border: 1px solid var(--accent-dim); border-radius: 6px; color: var(--accent); display: flex; flex-shrink: 0; font-family: var(--font-mono); font-size: 16px; font-weight: 700; height: 36px; justify-content: center; width: 36px; }
    .site-name { font-size: 15px; font-weight: 600; }
    .site-user { align-items: center; display: flex; font-size: 12px; gap: 4px; margin-top: 2px; }
    .site-user .muted { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn-tiny { background: transparent; border: 1px solid var(--border); border-radius: 2px; color: var(--text-muted); cursor: pointer; font-size: 11px; line-height: 1; padding: 2px 5px; transition: all var(--transition); }
    .btn-tiny:hover { border-color: var(--accent); color: var(--accent); }
    .cred-top-right { align-items: center; display: flex; flex-shrink: 0; gap: 6px; flex-wrap: wrap; }
    .visit-btn { cursor: pointer; font-size: 11px; padding: 4px 10px; }
    .cred-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .folder-badge { background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.2); border-radius: 2px; color: var(--accent); font-family: var(--font-mono); font-size: 11px; padding: 2px 8px; }
    .tag { background: rgba(255,180,0,0.08); border: 1px solid rgba(255,180,0,0.2); border-radius: 2px; color: var(--accent-warn); font-family: var(--font-mono); font-size: 11px; padding: 2px 8px; }
    .cred-actions { align-items: center; display: flex; gap: 8px; flex-wrap: wrap; }
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
    .dup-warning { color: var(--accent-warn); font-size: 12px; margin-top: 6px; }
    .alert { margin-top: 12px; }
    .folders-header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 8px; }
    .folders-header label { color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
    .folder-checkboxes { display: flex; flex-wrap: wrap; gap: 10px; }
    .check-item { align-items: center; cursor: pointer; display: flex; font-family: var(--font-mono); font-size: 12px; gap: 6px; }
    .check-item input { accent-color: var(--accent); cursor: pointer; }
    .new-folder-row { align-items: center; display: flex; gap: 6px; margin-top: 8px; }
    .new-folder-row input { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary); flex: 1; font-family: var(--font-mono); font-size: 12px; outline: none; padding: 6px 10px; }
    .new-folder-row input:focus { border-color: var(--accent); }
  `]
})
export class PasswordManagerComponent implements OnInit {
  credService = inject(CredentialService);
  gen = inject(PasswordGeneratorService);
  cdr = inject(ChangeDetectorRef);

  credentials = signal<Credential[]>([]);
  folders = signal<Folder[]>([]);
  filtered = signal<Credential[]>([]);

  searchQuery = '';
  sortOrder: 'az' | 'za' | 'newest' | 'oldest' = 'az';
  activeFolder: string | null = null;
  activeTag: string | null = null;
  showModal = false;
  showPw = false;
  saving = false;
  toast = '';
  modalError = '';
  editId: string | null = null;
  tagsInput = '';
  strength: any = { score: 0, color: '' };
  duplicateWarning = '';
  dragStartedInModal = false;

  // Inline delete confirmation
  deletingId: string | null = null;

  // Username visibility per card
  shownUsernames = new Set<string>();

  // Inline folder creation inside modal
  showAddFolderInput = false;
  newFolderName = '';

  form: Partial<Credential> = this.emptyForm();

  emptyForm(): Partial<Credential> {
    return { siteName: '', siteUrl: '', siteUsername: '', sitePassword: '', folderIds: [], tags: [] };
  }

  get allTags(): string[] {
    const tags = new Set<string>();
    this.credentials().forEach(c => (c.tags ?? []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {
    const [creds, folders] = await Promise.all([this.credService.getCredentials(), this.credService.getFolders()]);
    // Backward compat: migrate old folderId → folderIds
    const normalized = creds.map(c => {
      if (!c.folderIds && (c as any).folderId) {
        return { ...c, folderIds: [(c as any).folderId] };
      }
      return c;
    });
    this.credentials.set(normalized);
    this.folders.set(folders);
    this.runSearch();
    this.cdr.detectChanges();
  }

  runSearch() {
    let list = this.credentials();
    if (this.activeFolder) list = list.filter(c => (c.folderIds ?? []).includes(this.activeFolder!));
    if (this.activeTag) list = list.filter(c => (c.tags ?? []).includes(this.activeTag!));
    list = this.credService.searchCredentials(list, this.searchQuery);
    list = [...list];
    if (this.sortOrder === 'az') list.sort((a, b) => a.siteName.localeCompare(b.siteName));
    else if (this.sortOrder === 'za') list.sort((a, b) => b.siteName.localeCompare(a.siteName));
    else if (this.sortOrder === 'newest') list.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
    else list.sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));
    this.filtered.set(list);
  }

  countInFolder(folderId: string): number {
    return this.credentials().filter(c => (c.folderIds ?? []).includes(folderId)).length;
  }

  getFolderName(folderId: string): string {
    return this.folders().find(f => f.id === folderId)?.name ?? '';
  }

  toggleUsername(id: string) {
    this.shownUsernames.has(id) ? this.shownUsernames.delete(id) : this.shownUsernames.add(id);
    this.cdr.detectChanges();
  }

  async visitSite(c: Credential) {
    try { await navigator.clipboard.writeText(c.sitePassword); } catch {}
    window.open(c.siteUrl!, '_blank', 'noopener,noreferrer');
    if (c.id) await this.credService.logCopyAction(c.id, c.siteName);
    this.showToast('Password copied — opening site');
  }

  openAdd() {
    this.form = this.emptyForm();
    this.editId = null;
    this.tagsInput = '';
    this.modalError = '';
    this.duplicateWarning = '';
    this.strength = { score: 0, color: '' };
    this.showModal = true;
    this.showPw = false;
    this.showAddFolderInput = false;
    this.newFolderName = '';
  }

  openEdit(c: Credential) {
    this.form = { ...c, folderIds: [...(c.folderIds ?? [])] };
    this.editId = c.id ?? null;
    this.tagsInput = (c.tags ?? []).join(', ');
    this.modalError = '';
    this.duplicateWarning = '';
    this.showModal = true;
    this.showPw = false;
    this.showAddFolderInput = false;
    this.newFolderName = '';
    if (this.form.sitePassword) {
      this.checkStrength();
      this.checkDuplicate();
    }
  }

  closeModal() { this.showModal = false; }

  onOverlayClick(e: MouseEvent) {
    if (!this.dragStartedInModal) this.closeModal();
    this.dragStartedInModal = false;
  }

  onModalMousedown() { this.dragStartedInModal = true; }

  isChecked(folderId: string): boolean {
    return (this.form.folderIds ?? []).includes(folderId);
  }

  toggleFormFolder(folderId: string) {
    const current = [...(this.form.folderIds ?? [])];
    const idx = current.indexOf(folderId);
    if (idx >= 0) current.splice(idx, 1); else current.push(folderId);
    this.form = { ...this.form, folderIds: current };
  }

  async createFolderInModal() {
    const name = this.newFolderName.trim();
    if (!name) return;
    const id = await this.credService.createFolder(name);
    this.folders.update(list => [...list, { id, name, userId: '', createdAt: new Date() } as Folder]);
    this.form = { ...this.form, folderIds: [...(this.form.folderIds ?? []), id] };
    this.newFolderName = '';
    this.showAddFolderInput = false;
    this.showToast(`Folder "${name}" created`);
  }

  checkStrength() { this.strength = this.gen.checkStrength(this.form.sitePassword ?? ''); }

  checkDuplicate() {
    const pw = this.form.sitePassword ?? '';
    if (!pw) { this.duplicateWarning = ''; return; }
    const match = this.credentials().filter(c => c.sitePassword === pw && c.id !== this.editId);
    if (match.length === 0) this.duplicateWarning = '';
    else if (match.length === 1) this.duplicateWarning = `!! Already used for: ${match[0].siteName}. Use a unique password.`;
    else this.duplicateWarning = `!! Already used ${match.length} times: ${match.map(c => c.siteName).join(', ')}. Use a unique password.`;
  }

  generatePw() {
    this.form.sitePassword = this.gen.generate({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true });
    this.checkStrength();
    this.checkDuplicate();
    this.showToast('Password generated!');
  }

  strengthenPw() {
    const current = this.form.sitePassword ?? '';
    const arr = new Uint32Array(3);
    crypto.getRandomValues(arr);
    this.form.sitePassword = current
      + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[arr[0] % 26]
      + '0123456789'[arr[1] % 10]
      + '!@#$%^&*'[arr[2] % 8];
    this.checkStrength();
    this.checkDuplicate();
    this.showToast('Password strengthened!');
  }

  async save() {
    this.modalError = '';
    if (!this.form.siteName || !this.form.siteUsername || !this.form.sitePassword) {
      this.modalError = 'Site name, username, and password are required.'; return;
    }
    this.form.tags = this.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    this.form.strength = this.strength.label;
    this.saving = true;
    this.cdr.detectChanges();
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
    } finally { this.saving = false; this.cdr.detectChanges(); }
  }

  async confirmDelete(c: Credential) {
    this.deletingId = null;
    await this.credService.deleteCredential(c.id!, c.siteName);
    await this.load();
    this.showToast('Credential deleted.');
  }

  copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    this.showToast(`${label} copied!`);
  }

  async copyPassword(c: Credential) {
    navigator.clipboard.writeText(c.sitePassword);
    await this.credService.logCopyAction(c.id!, c.siteName);
    this.showToast('Password copied!');
  }

  async addFolder() {
    const name = prompt('New folder name:');
    if (!name?.trim()) return;
    await this.credService.createFolder(name.trim());
    await this.load();
    this.showToast('Folder created.');
  }

  async editFolder() {
    const folder = this.folders().find(f => f.id === this.activeFolder);
    if (!folder) return;
    const name = prompt('Rename folder:', folder.name);
    if (!name?.trim()) return;
    await this.credService.updateFolder(folder.id, name.trim());
    await this.load();
    this.showToast('Folder renamed.');
  }

  async deleteFolder() {
    const folder = this.folders().find(f => f.id === this.activeFolder);
    if (!folder) return;
    if (!confirm(`Delete folder "${folder.name}"? Credentials will not be deleted.`)) return;
    await this.credService.deleteFolder(folder.id);
    this.activeFolder = null;
    await this.load();
    this.showToast('Folder deleted.');
  }

  toggleFolder(id: string) {
    this.activeFolder = this.activeFolder === id ? null : id;
    this.runSearch();
  }

  toggleTag(tag: string) {
    this.activeTag = this.activeTag === tag ? null : tag;
    this.runSearch();
  }

  strengthBadge(s?: string) {
    const map: Record<string, string> = { weak: 'badge-danger', fair: 'badge-warn', strong: 'badge-success', 'very-strong': 'badge-success' };
    return map[s ?? ''] ?? 'badge-warn';
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3000);
  }
}
