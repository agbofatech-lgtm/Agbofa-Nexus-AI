"use client";

import React, { useState } from "react";
import { TenantFormDto, TenantPlan } from "../types";

export interface TenantFormProps {
  initialData?: Partial<TenantFormDto>;
  onSubmit: (data: TenantFormDto) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const AVAILABLE_FEATURES = [
  { id: "Predictive AI (IMP-018)", label: "Predictive AI (IMP-018)" },
  { id: "Personalization (IMP-019)", label: "Advanced Personalization (IMP-019)" },
  { id: "Monetization (IMP-021)", label: "Monetization Engine (IMP-021)" },
  { id: "32-Agent Fleet (IMP-017)", label: "Full 32-Agent Fleet (IMP-017)" },
  { id: "Custom Domain Mapping", label: "Custom Domain Mapping" },
];

function validateDomain(domain: string): boolean {
  if (!domain.trim()) return false;
  // Simple validation allowing localhost or standard valid domain syntax
  const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$|^localhost$|^[a-zA-Z0-9.-]+$/;
  return domainRegex.test(domain.trim());
}

export function TenantForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}: TenantFormProps): React.JSX.Element {
  const [name, setName] = useState<string>(initialData?.name || "");
  const [domain, setDomain] = useState<string>(initialData?.domain || "");
  const [plan, setPlan] = useState<TenantPlan>(initialData?.plan || "PREMIUM");
  const [maxUsers, setMaxUsers] = useState<number>(initialData?.maxUsers || 50);
  const [features, setFeatures] = useState<string[]>(
    initialData?.features || [
      "Predictive AI (IMP-018)",
      "Personalization (IMP-019)",
      "32-Agent Fleet (IMP-017)",
    ],
  );

  const [errors, setErrors] = useState<{ name?: string; domain?: string }>({});

  const toggleFeature = (featId: string) => {
    if (features.includes(featId)) {
      setFeatures(features.filter((f) => f !== featId));
    } else {
      setFeatures([...features, featId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; domain?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Tenant organization name is required.";
    }
    if (!validateDomain(domain)) {
      newErrors.domain = "Please enter a valid domain name (e.g. acme-media.com).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      name: name.trim(),
      domain: domain.trim(),
      plan,
      maxUsers: Number(maxUsers) || 10,
      features,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-xl"
    >
      <div className="border-b border-[#2E2E32] pb-3">
        <h3 className="text-base font-bold text-[#FAFAFA]">
          {isEdit ? "Edit Organization Tenant" : "Create New Tenant Boundary"}
        </h3>
        <p className="text-xs text-[#A0A4A8]">
          Configure tenant RLS boundary, plan entitlements, and active feature modules
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="tenant-name"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Tenant Organization Name *
          </label>
          <input
            id="tenant-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="e.g. Acme Media Group"
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
          />
          {errors.name && (
            <p className="text-[11px] text-[#CF2020]" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Domain Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="tenant-domain"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Tenant Domain (RLS Key) *
          </label>
          <input
            id="tenant-domain"
            type="text"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              if (errors.domain) setErrors({ ...errors, domain: undefined });
            }}
            placeholder="e.g. acme-media.com"
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
          />
          {errors.domain && (
            <p className="text-[11px] text-[#CF2020]" role="alert">
              {errors.domain}
            </p>
          )}
        </div>

        {/* Plan Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="tenant-plan"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Subscription Plan Tier
          </label>
          <select
            id="tenant-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value as TenantPlan)}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          >
            <option value="FREE">FREE — Trialing / Non-Commercial</option>
            <option value="PREMIUM">PREMIUM — Newsroom Professional</option>
            <option value="ENTERPRISE">ENTERPRISE — Full Autonomous Scale</option>
          </select>
        </div>

        {/* Max Users */}
        <div className="space-y-1.5">
          <label
            htmlFor="tenant-max-users"
            className="block text-xs font-semibold text-[#FAFAFA]"
          >
            Maximum User Seats
          </label>
          <input
            id="tenant-max-users"
            type="number"
            min={1}
            max={10000}
            value={maxUsers}
            onChange={(e) => setMaxUsers(Number(e.target.value))}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          />
        </div>
      </div>

      {/* Feature modules checkboxes */}
      <div className="space-y-2 border-t border-[#2E2E32] pt-4">
        <label className="block text-xs font-semibold text-[#FAFAFA]">
          Authorized Feature Modules &amp; Engines:
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AVAILABLE_FEATURES.map((feat) => {
            const isChecked = features.includes(feat.id);
            return (
              <label
                key={feat.id}
                className="flex cursor-pointer items-center space-x-2 rounded border border-[#2E2E32] bg-[#0A0A0B] p-2.5 text-xs text-[#FAFAFA] hover:border-[#0066CC]"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFeature(feat.id)}
                  className="h-4 w-4 rounded border-[#2E2E32] bg-[#12121A] text-[#0066CC]"
                />
                <span>{feat.label}</span>
              </label>
            );
          })}
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
          {isEdit ? "Save Tenant Changes" : "Create Tenant"}
        </button>
      </div>
    </form>
  );
}

export default TenantForm;
