"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Plug2,
  RefreshCw,
  GitBranch,
  ScrollText,
  AlertTriangle,
  Settings,
  BookOpen,
  Zap,
} from "lucide-react";

// ─── Nav item definitions ─────────────────────────────────────────────────────

const primaryNav = [
  { href: "/",            label: "Overview",     icon: LayoutDashboard },
  { href: "/integrations", label: "Integrations", icon: Plug2           },
  { href: "/sync-jobs",  label: "Sync Jobs",    icon: RefreshCw        },
  { href: "/workflows",  label: "Workflows",    icon: GitBranch        },
  { href: "/logs",       label: "Logs",         icon: ScrollText       },
  { href: "/failures",   label: "Failures",     icon: AlertTriangle    },
];

const secondaryNav = [
  { href: "/settings",      label: "Settings",      icon: Settings  },
  { href: "/documentation", label: "Documentation", icon: BookOpen  },
];

// ─── Sidebar component ────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] bg-[#191b22] border-r border-[#2a2d3e] flex flex-col z-20"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[#2a2d3e] flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-[#6366f1] flex items-center justify-center flex-shrink-0">
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold text-[#e2e2eb] tracking-tight">
          FlowSync
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Primary">
        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon size={15} strokeWidth={2} />}
              active={
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </div>
      </nav>

      {/* Secondary nav */}
      <div className="py-3 px-2 border-t border-[#2a2d3e] space-y-0.5 flex-shrink-0">
        {secondaryNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon size={15} strokeWidth={2} />}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </div>
    </aside>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-2.5 h-8 px-2.5 rounded text-[13px] font-medium transition-colors",
        "relative",
        active
          ? "bg-[rgba(99,102,241,0.12)] text-[#c0c1ff]"
          : "text-[#c7c4d7] hover:bg-[#282a30] hover:text-[#e2e2eb]",
      )}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#6366f1] rounded-r"
          aria-hidden="true"
        />
      )}
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </Link>
  );
}
