import { Link, useLocation } from "wouter";
import { LayoutGrid, Package, PlusCircle, ChefHat, FileText, Calculator, HardDriveDownload, ShoppingCart, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Mis Recetas", icon: LayoutGrid },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/caja", label: "Cuadre de Caja", icon: Calculator },
  { href: "/cartera", label: "Cartera", icon: Wallet },
  { href: "/lista-compras", label: "Lista de compras", icon: ShoppingCart },
  { href: "/ingredientes", label: "Ingredientes", icon: Package },
  { href: "/nueva-receta", label: "Nueva Receta", icon: PlusCircle },
];

const navBottom = [
  { href: "/respaldo", label: "Respaldo", icon: HardDriveDownload },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
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
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3 space-y-1">
          {navBottom.map(({ href, label, icon: Icon }) => {
            const active = location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="px-6 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Datos guardados en este dispositivo.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
