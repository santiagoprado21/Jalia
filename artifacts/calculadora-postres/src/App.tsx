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
