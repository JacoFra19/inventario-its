"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type IconName =
  | "activity"
  | "asset"
  | "box"
  | "calendar"
  | "dashboard"
  | "download"
  | "map"
  | "package"
  | "qr"
  | "scan"
  | "stock"
  | "users";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  match?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type AppShellProps = {
  children: React.ReactNode;
};

const navGroups: NavGroup[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Dashboard", href: "/", icon: "dashboard" },
    ],
  },
  {
    title: "Inventario",
    items: [
      { label: "Asset", href: "/assets", icon: "asset", match: "/assets" },
      { label: "Catalogo item", href: "/items", icon: "box", match: "/items" },
      { label: "Stock e consumabili", href: "/stocks", icon: "stock", match: "/stocks" },
    ],
  },
  {
    title: "Operatività",
    items: [
      { label: "Eventi", href: "/events", icon: "calendar", match: "/events" },
      { label: "Assegnatari", href: "/assignees", icon: "users", match: "/assignees" },
      { label: "Scanner QR", href: "/scan", icon: "scan", match: "/scan" },
      { label: "Stampa QR", href: "/labels", icon: "qr", match: "/labels" },
    ],
  },
  {
    title: "Controllo",
    items: [
      { label: "Registro attività", href: "/activity", icon: "activity", match: "/activity" },
      { label: "Mappa sedi", href: "/#mappa-sedi", icon: "map" },
    ],
  },
  {
    title: "Strumenti",
    items: [
      { label: "Import Excel", href: "/imports", icon: "download", match: "/imports" },
    ],
  },
];

function iconPath(name: IconName) {
  if (name === "asset") {
    return (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    );
  }

  if (name === "box") {
    return (
      <>
        <path d="M5 8h14" />
        <path d="M5 8l2-4h10l2 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z" />
        <path d="M9 13h6" />
      </>
    );
  }

  if (name === "stock") {
    return (
      <>
        <path d="M4 7.5 12 3l8 4.5-8 4.5L4 7.5Z" />
        <path d="m4 12 8 4.5L20 12" />
        <path d="m4 16.5 8 4.5 8-4.5" />
      </>
    );
  }

  if (name === "calendar") {
    return (
      <>
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M4 9h16" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
      </>
    );
  }

  if (name === "users") {
    return (
      <>
        <path d="M16 11a3 3 0 1 0-3-3" />
        <path d="M8 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        <path d="M2 21a6 6 0 0 1 12 0" />
        <path d="M15 18a5 5 0 0 1 7 3" />
      </>
    );
  }

  if (name === "scan") {
    return (
      <>
        <path d="M4 7V5a1 1 0 0 1 1-1h2" />
        <path d="M17 4h2a1 1 0 0 1 1 1v2" />
        <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
        <path d="M7 20H5a1 1 0 0 1-1-1v-2" />
        <path d="M7 12h10" />
      </>
    );
  }

  if (name === "qr") {
    return (
      <>
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h2v2h-2z" />
        <path d="M18 14h2v6h-4v-2h2z" />
      </>
    );
  }

  if (name === "activity") {
    return (
      <>
        <path d="M4 19V5" />
        <path d="M8 19v-7" />
        <path d="M12 19V9" />
        <path d="M16 19v-4" />
        <path d="M20 19V7" />
      </>
    );
  }

  if (name === "map") {
    return (
      <>
        <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
        <path d="M9 4v14" />
        <path d="M15 6v14" />
      </>
    );
  }

  if (name === "download") {
    return (
      <>
        <path d="M12 3v11" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
      </>
    );
  }

  if (name === "package") {
    return (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h3" />
      </>
    );
  }

  return (
    <>
      <path d="M4 13.5 12 5l8 8.5" />
      <path d="M6 12v8h12v-8" />
      <path d="M10 20v-5h4v5" />
    </>
  );
}

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {iconPath(name)}
    </svg>
  );
}

function isActiveItem(item: NavItem, pathname: string, hash: string) {
  if (item.href === "/#mappa-sedi") {
    return pathname === "/" && hash === "#mappa-sedi";
  }

  if (item.href === "/") {
    return pathname === "/" && hash !== "#mappa-sedi";
  }

  return item.match ? pathname.startsWith(item.match) : pathname === item.href;
}

function findCurrentItem(pathname: string, hash: string) {
  for (const group of navGroups) {
    const item = group.items.find((navItem) => isActiveItem(navItem, pathname, hash));
    if (item) return item;
  }

  return navGroups[0].items[0];
}

function SidebarContent({
  collapsed,
  onNavigate,
  onToggleCollapse,
  showCollapse,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  showCollapse?: boolean;
}) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    function updateHash() {
      setHash(window.location.hash);
    }

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          title="Inventario ITS"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-sm font-black text-white">
            ITS
          </span>
          {!collapsed && (
            <span>
              <span className="block text-sm font-black text-gray-950">Inventario ITS</span>
              <span className="block text-xs font-semibold text-gray-400">Gestionale</span>
            </span>
          )}
        </Link>

        {showCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 lg:inline-flex"
            title={collapsed ? "Espandi sidebar" : "Collassa sidebar"}
          >
            <span className="sr-only">
              {collapsed ? "Espandi sidebar" : "Collassa sidebar"}
            </span>
            <svg
              aria-hidden="true"
              className={`h-5 w-5 transition ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActiveItem(item, pathname, hash);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                      collapsed ? "justify-center" : "",
                      active
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
                    ].join(" ")}
                  >
                    <NavIcon name={item.icon} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem("inventario-sidebar-collapsed");
    if (storedValue === "true") {
      const frame = window.requestAnimationFrame(() => {
        setSidebarCollapsed(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  useEffect(() => {
    function updateHash() {
      setHash(window.location.hash);
    }

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const currentItem = useMemo(
    () => findCurrentItem(pathname, hash),
    [hash, pathname]
  );

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const nextValue = !current;
      window.localStorage.setItem("inventario-sidebar-collapsed", String(nextValue));
      return nextValue;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 print:block">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 hidden border-r border-gray-100 bg-white shadow-sm transition-all duration-200 print:hidden lg:block",
          sidebarCollapsed ? "w-20" : "w-72",
        ].join(" ")}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          showCollapse
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            type="button"
            aria-label="Chiudi menu"
            className="absolute inset-0 bg-gray-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-80 max-w-[86vw] bg-white shadow-2xl">
            <SidebarContent
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div
        className={[
          "min-h-screen transition-all duration-200 print:block lg:pl-72",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-72",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur print:hidden">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 lg:hidden"
                aria-label="Apri menu"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </svg>
              </button>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Inventario ITS
                </p>
                <p className="truncate text-sm font-bold text-gray-950 md:text-base">
                  {currentItem.label}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 sm:flex">
              Area operativa
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] print:min-h-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
