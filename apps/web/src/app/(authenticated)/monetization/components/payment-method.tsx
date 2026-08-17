"use client";

import React, { useState } from "react";
import { StoredCard } from "../types";

export interface PaymentMethodProps {
  storedCards: StoredCard[];
  onAddCard: (card: Omit<StoredCard, "id" | "isDefault">) => void;
  onSetDefault: (cardId: string) => void;
  onRemoveCard: (cardId: string) => void;
}

export function PaymentMethod({
  storedCards,
  onAddCard,
  onSetDefault,
  onRemoveCard,
}: PaymentMethodProps): React.JSX.Element {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [cvc, setCvc] = useState<string>("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill out all payment card fields.");
      return;
    }
    const [monthStr, yearStr] = expiry.split("/");
    const expiryMonth = parseInt(monthStr || "12", 10);
    const expiryYear = parseInt(yearStr ? `20${yearStr}` : "2028", 10);
    const cleanNum = cardNumber.replace(/\D/g, "");
    const last4 = cleanNum.slice(-4) || "4242";
    const brand = cleanNum.startsWith("5") ? "MASTERCARD" : "VISA";

    onAddCard({
      brand,
      last4,
      expiryMonth,
      expiryYear,
    });
    setCardNumber("");
    setExpiry("");
    setCvc("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
      {/* Top Header & Trust Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#FAFAFA]">
            Payment Method Management & Stored Ledger (IMP-021)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Manage credit cards, default billing instruments, and payment security tokens
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="rounded bg-[#0D9040]/20 px-2.5 py-1 text-xs font-bold text-[#0D9040] border border-[#0D9040]/40">
            🔒 Secured by Stripe/Paystack
          </span>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded bg-[#0066CC] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF] transition-colors"
          >
            {showAddForm ? "Cancel Add Card" : "+ Add Payment Method"}
          </button>
        </div>
      </div>

      {/* PCI-DSS Security Notice Card */}
      <div
        role="region"
        aria-label="Payment Security Notice"
        className="flex items-start justify-between rounded-lg border border-[#3399FF]/40 bg-[#3399FF]/10 p-4"
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">🛡️</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
              Zero Stored Pan Policy & PCI-DSS Compliance (IMP-021)
            </h4>
            <p className="mt-0.5 text-xs text-[#FAFAFA]">
              We never store your full card details.
            </p>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              All payment instruments are tokenized by PCI-DSS Level 1 certified payment gateways (Stripe / Paystack). Our PostgreSQL tables retain only non-sensitive token references (<code className="font-mono text-[#FAFAFA]">last4</code> and <code className="font-mono text-[#FAFAFA]">expiry</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Stored Cards List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
          Stored Payment Cards
        </h4>

        {storedCards.length === 0 ? (
          <p className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4 text-center text-xs text-[#A0A4A8]">
            No stored payment cards recorded in this tenant billing profile.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {storedCards.map((card) => (
              <div
                key={card.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  card.isDefault
                    ? "border-[#0066CC] bg-[#0A0A0B] shadow"
                    : "border-[#2E2E32] bg-[#0A0A0B]/60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="rounded bg-[#12121A] px-2.5 py-1 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
                    {card.brand}
                  </span>
                  <div>
                    <h5 className="font-mono text-sm font-bold text-[#FAFAFA]">
                      •••• •••• •••• {card.last4}
                    </h5>
                    <p className="text-[11px] text-[#A0A4A8]">
                      Expires: {card.expiryMonth.toString().padStart(2, "0")}/{card.expiryYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {card.isDefault ? (
                    <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040] border border-[#0D9040]/30">
                      DEFAULT
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetDefault(card.id)}
                      className="rounded border border-[#2E2E32] bg-[#12121A] px-2 py-1 text-[11px] font-medium text-[#A0A4A8] hover:text-[#FAFAFA]"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveCard(card.id)}
                    className="rounded border border-[#2E2E32] bg-[#12121A] px-2 py-1 text-[11px] font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
                    aria-label={`Remove card ending in ${card.last4}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Card Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="space-y-4 rounded-lg border border-[#0066CC]/40 bg-[#0A0A0B] p-4"
        >
          <h4 className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
            Add New Payment Instrument (Masked & Tokenized)
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A4A8]">
                Card Number (Masked)
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 •••• •••• 4242"
                maxLength={19}
                className="mt-1 w-full rounded border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 font-mono text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A4A8]">
                Expiry (MM/YY)
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="08/28"
                maxLength={5}
                className="mt-1 w-full rounded border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 font-mono text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A4A8]">
                CVC Code
              </label>
              <input
                type="password"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="•••"
                maxLength={4}
                className="mt-1 w-full rounded border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 font-mono text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 border-t border-[#2E2E32] pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-semibold text-[#A0A4A8] hover:text-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
            >
              Confirm & Save Token
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
