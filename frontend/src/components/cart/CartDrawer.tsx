"use client";

import Link from "next/link";
import { X, Minus, Plus, Bag } from "@phosphor-icons/react";
import { useCartStore, cartTotalCents } from "@/store/cart";
import ProductImage from "@/components/ui/ProductImage";
import EmptyState from "@/components/ui/EmptyState";
import { usePrice } from "@/lib/money";
import { useTranslation } from "react-i18next";

export default function CartDrawer() {
  const { t } = useTranslation();
  const price = usePrice();
  const { items, isOpen, close, removeItem, updateQty } = useCartStore();
  const total = cartTotalCents(items);

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/70 z-[2000] transition-opacity duration-[400ms] ease-[var(--ease-out)] ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        aria-hidden={!isOpen}
        aria-labelledby="cart-drawer-title"
        inert={!isOpen}
        className={`fixed top-0 right-0 w-[420px] max-w-[90vw] h-full bg-[var(--bg-surface)] border-l border-[var(--border-gold)] z-[2000] flex flex-col p-6 transition-transform duration-[400ms] ease-[var(--ease-drawer)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-4 mb-4">
          <h2 id="cart-drawer-title" className="font-[family-name:var(--font-display)] text-2xl text-white">
            {t("cart.title")}
          </h2>
          <button
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--gold)]"
            onClick={close}
            aria-label="Close cart"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {items.length === 0 ? (
            <EmptyState
              icon={<Bag size={32} />}
              title={t("cart.empty")}
              body={t("cart.emptyBody")}
              action={
                <button className="btn btn-outline" onClick={close}>
                  {t("cart.browseStore")}
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {items.map((item) => (
                <div key={item.productId} className="grid grid-cols-[48px_1fr] items-center gap-3 py-4">
                  <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                    <ProductImage
                      name={item.name}
                      emoji={item.emoji}
                      width={96}
                      height={96}
                      sizes="48px"
                      frame={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-white truncate">{item.name}</h4>
                    <div className="text-sm text-[var(--gold)]">
                      {t("cart.each", { price: price(item.priceCents) })}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-3">
                    <button
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      onClick={() => updateQty(item.productId, -1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-semibold min-w-[20px] text-center">{item.qty}</span>
                    <button
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      onClick={() => updateQty(item.productId, 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--danger)]"
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] pt-4 mt-2">
            <div className="flex justify-between text-lg font-semibold text-white mb-4">
              <span>Total</span>
              <span className="text-[var(--gold)]">{price(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="btn btn-primary block w-full text-center"
              onClick={() => {
                close();
              }}
            >
              {t("cart.checkout")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
