/**
 * Agbofa Nexus AI — Admin Center Authoritative TypeScript Definitions (P0 Batch 7)
 * Defines types for tenants, users, roles, system health, and activity ledgers.
 */

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "TRIALING";
export type TenantPlan = "FREE" | "PREMIUM" | "ENTERPRISE";

export interface TenantItem {
  id: string;
  name: string;
  domain: string;
  plan: TenantPlan;
  status: TenantStatus;
  usersCount: number;
  maxUsers: number;
  storiesCount: number;
  storageUsedMb: number;
  features: string[];
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export type UserRole = "ADMIN" | "EDITOR" | "ANALYST" | "READER";
export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: UserRole;
  status: UserStatus;
  lastActiveAt: string; // ISO 8601
  storiesEdited: number;
  reviewsCompleted: number;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialingTenants: number;
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  publishedToday: number;
  totalStories: number;
  systemHealth: "HEALTHY" | "DEGRADED";
  uptimePercentage: number;
}

export interface SystemActivityEvent {
  id: string;
  type: "TENANT_CREATED" | "USER_INVITED" | "SYSTEM_EVENT" | "ROLE_CHANGED";
  title: string;
  description: string;
  actor: string;
  occurredAt: string; // ISO 8601
}

export interface TenantFormDto {
  name: string;
  domain: string;
  plan: TenantPlan;
  maxUsers: number;
  features: string[];
}

export interface UserFormDto {
  name: string;
  email: string;
  tenantId: string;
  role: UserRole;
  status: UserStatus;
}
