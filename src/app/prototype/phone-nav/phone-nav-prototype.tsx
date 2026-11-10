"use client";

// PROTOTYPE - wipe me. Stub content, no data, no navigation: tapping nav items only swaps local state.
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_NAVIGATION_MAP } from "@/components/layout/sidebar-nav";
import { Role } from "@/domain/requests/types";
import { cn } from "@/lib/utils";

type Variant = "A" | "B" | "C";
type R = "client" | "specialist";
const NAMES: Record<Variant, string> = {
  A: "Hamburger + drawer",
  B: "Bottom tab bar",
  C: "Hybrid: tabs + централно действие + Още",
};

function itemsFor(role: R) {
  return ROLE_NAVIGATION_MAP[role === "client" ? Role.Client : Role.Specialist];
}

function Brand() {
  return (
    <span className="flex items-center gap-2 text-[20px] font-extrabold tracking-[2px] text-primary">
      <span className="grid size-8 place-items-center rounded-[9px] bg-primary text-[24px] text-white">
        ⌂
      </span>
      DOMORA
    </span>
  );
}

function Avatar() {
  return (
    <span className="grid size-9 place-items-center rounded-full bg-tone-e9efdc font-semibold">
      И
    </span>
  );
}

function Content({ role, section }: { role: R; section: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-[1.4rem] font-bold">{section}</h1>
      {role === "client" ? (
        <>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-[0.7rem] font-extrabold tracking-[1.2px] text-muted-foreground">
              АКТИВНА ЗАЯВКА
            </p>
            <p className="mt-1 font-semibold">Почистване на климатик</p>
            <p className="text-sm text-muted-foreground">
              Специалист на път · днес 14:00
            </p>
            <div className="mt-3 h-2 rounded-full bg-tone-eaf2ec">
              <div className="h-2 w-2/3 rounded-full bg-primary" />
            </div>
          </div>
          <button className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white">
            + Нова заявка
          </button>
          {["Ремонт на течащ кран", "Смяна на ключалка"].map((t) => (
            <div key={t} className="rounded-lg border border-border bg-white p-4">
              <p className="font-semibold">{t}</p>
              <p className="text-sm text-muted-foreground">Завършена</p>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-[0.7rem] font-extrabold tracking-[1.2px] text-muted-foreground">
              ДНЕС
            </p>
            <p className="mt-1 font-semibold">3 посещения</p>
          </div>
          {["09:00 · Овчарски район", "12:30 · Лозенец", "16:00 · Младост 3"].map(
            (t) => (
              <div key={t} className="rounded-lg border border-border bg-white p-4">
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-muted-foreground">Потвърдено</p>
              </div>
            ),
          )}
        </>
      )}
    </div>
  );
}

function NavBtn({
  label,
  icon,
  active,
  onClick,
  className,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
        active ? "font-bold text-primary" : "text-muted-foreground",
        className,
      )}
    >
      <span className="text-[20px] leading-none" aria-hidden>
        {icon}
      </span>
      {label}
    </button>
  );
}

export function PhoneNavPrototype({
  variant,
  role,
}: {
  variant: Variant;
  role: R;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const items = itemsFor(role);
  const [active, setActive] = useState(items[0].href);
  const [drawer, setDrawer] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    setActive(items[0].href);
    setDrawer(false);
    setMore(false);
  }, [variant, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const section = items.find((i) => i.href === active)?.label ?? "";
  const set = (v: Variant, r: R) =>
    router.replace(`${pathname}?variant=${v}&role=${r}`);
  const order: Variant[] = ["A", "B", "C"];

  // C: first two items as tabs, centre action, then third + "Още" (rest)
  const primaryCentre =
    role === "client"
      ? { label: "Нова заявка", icon: "+" }
      : { label: "Възможности", icon: "⚡" };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      {/* top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        {variant === "A" ? (
          <button
            type="button"
            aria-label="Меню"
            onClick={() => setDrawer(true)}
            className="grid size-11 place-items-center rounded-lg text-[24px]"
          >
            ☰
          </button>
        ) : (
          <span className="size-0" />
        )}
        <Brand />
        <Avatar />
      </header>

      <main
        className={cn(
          "mx-auto max-w-[640px] px-4 py-5",
          variant !== "A" && "pb-28",
        )}
      >
        <Content role={role} section={section} />
      </main>

      {/* A: drawer */}
      {variant === "A" && drawer && (
        <div className="fixed inset-0 z-40">
          <button
            aria-label="Затвори"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-[320px] flex-col bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Brand />
              <button
                aria-label="Затвори"
                className="grid size-11 place-items-center text-[20px]"
                onClick={() => setDrawer(false)}
              >
                ✕
              </button>
            </div>
            <nav className="grid gap-1">
              {items.map((i) => (
                <button
                  key={i.href}
                  onClick={() => {
                    setActive(i.href);
                    setDrawer(false);
                  }}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-lg px-3.5 text-left text-[15px]",
                    i.href === active
                      ? "bg-tone-eaf2ec font-[650] text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <span aria-hidden>{i.icon}</span>
                  {i.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
              <Avatar />
              <div className="text-sm">
                <p className="font-semibold">Иван Петров</p>
                <p className="text-muted-foreground">Изход</p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* B: 4 tabs */}
      {variant === "B" && (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
          {items.map((i) => (
            <NavBtn
              key={i.href}
              label={i.label.split(" ")[0]}
              icon={i.icon}
              active={i.href === active}
              onClick={() => setActive(i.href)}
            />
          ))}
        </nav>
      )}

      {/* C: tabs + centre action + Още */}
      {variant === "C" && (
        <>
          {more && (
            <div className="fixed inset-0 z-40">
              <button
                aria-label="Затвори"
                className="absolute inset-0 bg-black/40"
                onClick={() => setMore(false)}
              />
              <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
                {items.slice(2).map((i) => (
                  <button
                    key={i.href}
                    onClick={() => {
                      setActive(i.href);
                      setMore(false);
                    }}
                    className="flex min-h-12 w-full items-center gap-3 px-2 text-left"
                  >
                    <span aria-hidden>{i.icon}</span>
                    {i.label}
                  </button>
                ))}
                <button className="flex min-h-12 w-full items-center gap-3 px-2 text-left text-muted-foreground">
                  Изход
                </button>
              </div>
            </div>
          )}
          <nav className="fixed inset-x-0 bottom-0 z-30 flex items-end border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
            {items.slice(0, 2).map((i) => (
              <NavBtn
                key={i.href}
                label={i.label.split(" ")[0]}
                icon={i.icon}
                active={i.href === active}
                onClick={() => setActive(i.href)}
              />
            ))}
            <button
              type="button"
              className="-mt-5 mb-1 flex size-14 flex-col items-center justify-center rounded-full bg-primary text-white shadow-lg"
              aria-label={primaryCentre.label}
            >
              <span className="text-[22px] leading-none">
                {primaryCentre.icon}
              </span>
            </button>
            {items.slice(2, 3).map((i) => (
              <NavBtn
                key={i.href}
                label={i.label.split(" ")[0]}
                icon={i.icon}
                active={i.href === active}
                onClick={() => setActive(i.href)}
              />
            ))}
            <NavBtn
              label="Още"
              icon="⋯"
              active={false}
              onClick={() => setMore(true)}
            />
          </nav>
        </>
      )}

      {/* switcher */}
      <div className="fixed bottom-[88px] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-2 py-1.5 text-[12px] text-white shadow-lg">
        <button
          className="px-2"
          onClick={() =>
            set(order[(order.indexOf(variant) + 2) % 3], role)
          }
        >
          ←
        </button>
        <span className="max-w-[44vw] truncate">
          {variant} ({NAMES[variant]})
        </span>
        <button
          className="px-2"
          onClick={() => set(order[(order.indexOf(variant) + 1) % 3], role)}
        >
          →
        </button>
        <button
          className="rounded-full bg-white/20 px-2 py-0.5"
          onClick={() =>
            set(variant, role === "client" ? "specialist" : "client")
          }
        >
          {role === "client" ? "клиент" : "специалист"}
        </button>
      </div>
    </div>
  );
}
