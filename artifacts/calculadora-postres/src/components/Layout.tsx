import type { ComponentType, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutGrid,
  Package,
  PlusCircle,
  ChefHat,
  FileText,
  Calculator,
  HardDriveDownload,
  ShoppingCart,
  Wallet,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativeApp } from "@/lib/native";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Mis Recetas", icon: LayoutGrid, shortLabel: "Recetas" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText, shortLabel: "Cotiz." },
  { href: "/caja", label: "Cuadre de Caja", icon: Calculator, shortLabel: "Caja" },
  { href: "/cartera", label: "Cartera", icon: Wallet, shortLabel: "Cartera" },
  { href: "/lista-compras", label: "Lista de compras", icon: ShoppingCart, shortLabel: "Compras" },
  { href: "/ingredientes", label: "Ingredientes", icon: Package, shortLabel: "Insumos" },
  { href: "/nueva-receta", label: "Nueva Receta", icon: PlusCircle, shortLabel: "Nueva" },
];

const navBottom = [
  { href: "/respaldo", label: "Respaldo", icon: HardDriveDownload, shortLabel: "Respaldo" },
];

const mobileTabs = [
  navItems[0],
  navItems[2],
  navItems[1],
  navItems[4],
];

const mobileMoreItems = [
  navItems[3],
  navItems[5],
  navItems[6],
  ...navBottom,
];

function isActive(location: string, href: string) {
  return href === "/" ? location === "/" : location.startsWith(href);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
        compact ? "flex-col gap-1 px-2 py-2 text-[11px]" : "px-3 py-2.5",
        active
          ? compact
            ? "text-primary"
            : "bg-primary text-primary-foreground"
          : compact
          ? "text-muted-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className={cn(compact ? "w-5 h-5" : "w-4 h-4", active && compact && "text-primary")} />
      <span className={cn(compact && "leading-none")}>{label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const showMobileChrome = isMobile || isNativeApp;

  if (showMobileChrome) {
    const moreActive = mobileMoreItems.some((item) => isActive(location, item.href));

    return (
      <div className="min-h-screen flex flex-col bg-background native-shell">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <ChefHat className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="font-serif text-base font-bold text-foreground leading-tight">JALIA</h1>
                <p className="text-[11px] text-muted-foreground truncate">Calculadora de precios</p>
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0" aria-label="Abrir menú">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm">
                <SheetHeader>
                  <SheetTitle className="font-serif">Menú</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-1">
                  {[...navItems, ...navBottom].map((item) => (
                    <NavLink
                      key={item.href}
                      {...item}
                      active={isActive(location, item.href)}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 overflow-auto overscroll-contain">
          <div className="max-w-4xl mx-auto px-4 py-4 pb-24">{children}</div>
        </main>

        <nav
          className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 pb-[env(safe-area-inset-bottom)]"
          data-testid="mobile-tab-nav"
        >
          <div className="grid grid-cols-5">
            {mobileTabs.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.shortLabel}
                icon={item.icon}
                active={isActive(location, item.href)}
                compact
              />
            ))}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors",
                    moreActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Menu className="w-5 h-5" />
                  <span>Más</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
                <SheetHeader>
                  <SheetTitle className="font-serif">Más opciones</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {mobileMoreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium",
                        isActive(location, item.href)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="px-6 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-serif text-lg font-bold text-foreground leading-tight tracking-wide">
                JALIA
              </h1>
              <p className="text-xs text-muted-foreground">Calculadora de precios</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" data-testid="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(location, item.href)} />
          ))}
        </nav>

        <div className="px-3 pb-3 space-y-1">
          {navBottom.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(location, item.href)} />
          ))}
        </div>
        <div className="px-6 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Datos guardados en este dispositivo.</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
