/**
 * Agbofa Nexus AI — Frontend State Management & PWA/Offline Storage (IMP-014, SVC-170, SVC-172)
 * Authoritative tenant-scoped caching and application state container.
 */

export interface CacheEntry<T> {
  tenantId: string;
  key: string;
  data: T;
  cachedAt: number;
}

export class TenantScopedOfflineCache<T> {
  private readonly storage = new Map<string, CacheEntry<T>>();

  private formatKey(tenantId: string, key: string): string {
    return `${tenantId}::${key}`;
  }

  set(tenantId: string, key: string, data: T): void {
    if (!tenantId) throw new Error("cross_tenant_violation: tenant_id required for cache storage");
    this.storage.set(this.formatKey(tenantId, key), {
      tenantId,
      key,
      data,
      cachedAt: Date.now(),
    });
  }

  get(tenantId: string, key: string): T | null {
    if (!tenantId) return null;
    const entry = this.storage.get(this.formatKey(tenantId, key));
    if (!entry || entry.tenantId !== tenantId) return null;
    return entry.data;
  }

  invalidateTenant(tenantId: string): number {
    let cleared = 0;
    for (const [k, entry] of this.storage.entries()) {
      if (entry.tenantId === tenantId) {
        this.storage.delete(k);
        cleared++;
      }
    }
    return cleared;
  }
}

export interface UIStateSnapshot {
  isLoading: boolean;
  isOffline: boolean;
  currentTenantId: string;
  lastErrorCode?: string;
}

export class AppStateManager {
  private state: UIStateSnapshot = {
    isLoading: false,
    isOffline: false,
    currentTenantId: "tenant-default",
  };

  getState(): UIStateSnapshot {
    return { ...this.state };
  }

  setTenant(newTenantId: string): void {
    if (!newTenantId) return;
    this.state.currentTenantId = newTenantId;
  }

  setOffline(offline: boolean): void {
    this.state.isOffline = offline;
  }

  setLoading(loading: boolean): void {
    this.state.isLoading = loading;
  }
}
