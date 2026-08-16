import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Ingredientes from "@/pages/Ingredientes";
import NuevaReceta from "@/pages/NuevaReceta";
import RecetaDetalle from "@/pages/RecetaDetalle";
import Cotizaciones from "@/pages/Cotizaciones";
import NuevaCotizacion from "@/pages/NuevaCotizacion";
import CotizacionDetalle from "@/pages/CotizacionDetalle";
import CuadreCaja from "@/pages/CuadreCaja";
import RegistrarVenta from "@/pages/RegistrarVenta";
import ListaCompras from "@/pages/ListaCompras";
import Cartera from "@/pages/Cartera";
import Respaldo from "@/pages/Respaldo";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/ingredientes" component={Ingredientes} />
        <Route path="/nueva-receta" component={NuevaReceta} />
        <Route path="/receta/:id" component={RecetaDetalle} />
        <Route path="/cotizaciones" component={Cotizaciones} />
        <Route path="/nueva-cotizacion" component={NuevaCotizacion} />
        <Route path="/cotizacion/:id" component={CotizacionDetalle} />
        <Route path="/caja" component={CuadreCaja} />
        <Route path="/caja/venta/:fecha" component={RegistrarVenta} />
        <Route path="/lista-compras" component={ListaCompras} />
        <Route path="/cartera" component={Cartera} />
        <Route path="/respaldo" component={Respaldo} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
