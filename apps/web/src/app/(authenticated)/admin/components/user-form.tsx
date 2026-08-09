"use client";

import React, { useState } from "react";
import { UserFormDto, UserRole, UserStatus } from "../types";

export interface UserFormProps {
  initialData?: Partial<UserFormDto>;
  availableTenants?: Array<{ id: string; name: string }>;
  onSubmit: (data: UserFormDto) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function validateEmail(email: string): boolean {
  if (!email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function UserForm({
  initialData,
  availableTenants = [
    { id: "tenant-default", name: "Default Tenant Organization" },
    { id: "tenant-reuters-01", name: "Reuters Wire Syndicate" },
    { id: "tenant-enterprise-02", name: "Global Enterprise Media" },
  ],
  onSubmit,
  onCancel,
  isEdit = false,
}: UserFormProps): React.JSX.Element {
  const [name, setName] = useState<string>(initialData?.name || "");
  const [email, setEmail] = useState<string>(initialData?.email || "");
  const [tenantId, setTenantId] = useState<string>(
    initialData?.tenantId || availableTenants[0]?.id || "tenant-default",
  );
  const [role, setRole] = useState<UserRole>(initialData?.role || "EDITOR");
  const [status, setStatus] = useState<UserStatus>(initialData?.status || "ACTIVE");

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Full user name is required.";
    }
    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address (e.g. user@agbofa.com).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      tenantId,
      role,
      status,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-xl"
    >
      <div className="border-b border-[#2E2E32] pb-3">
        <h3 className="text-base font-bold text-[#FAFAFA]">
          {isEdit ? "Edit User Account & Role" : "Invite & Provision New User"}
        </h3>
        <p className="text-xs text-[#A0A4A8]">
          Configure user identity claims, tenant RLS assignment, and RBAC role authorization
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-name"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Full Name *
          </label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="e.g. Kwame Mensah"
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
          />
          {errors.name && (
            <p className="text-[11px] text-[#CF2020]" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-email"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Email Address *
          </label>
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="e.g. kwame@agbofa.com"
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
          />
          {errors.email && (
            <p className="text-[11px] text-[#CF2020]" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Tenant Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-tenant"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Assigned Tenant Organization (RLS Boundary)
          </label>
          <select
            id="user-tenant"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          >
            {availableTenants.map((ten) => (
              <option key={ten.id} value={ten.id}>
                {ten.name} ({ten.id})
              </option>
            ))}
          </select>
        </div>

        {/* Role Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-role"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Assigned Role (RBAC Claim)
          </label>
          <select
            id="user-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          >
            <option value="ADMIN">ADMIN — Full organization &amp; user governance</option>
            <option value="EDITOR">EDITOR — Newsroom editorial sign-off &amp; verification</option>
            <option value="ANALYST">ANALYST — Predictive &amp; revenue analytics access</option>
            <option value="READER">READER — Consumer story feed &amp; paywall read-only</option>
          </select>
        </div>

        {/* Status Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-status"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Account Status
          </label>
          <select
            id="user-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          >
            <option value="ACTIVE">ACTIVE — Active session enabled</option>
            <option value="INVITED">INVITED — Pending invitation acceptance</option>
            <option value="SUSPENDED">SUSPENDED — Blocked from access</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 border-t border-[#2E2E32] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-4 py-2 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-[#0066CC] px-5 py-2 text-xs font-semibold text-white hover:bg-[#3399FF] transition-colors shadow"
        >
          {isEdit ? "Save User Account" : "Invite User"}
        </button>
      </div>
    </form>
  );
}

export default UserForm;
