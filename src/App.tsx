import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import AppLayout from "./pages/AppLayout";
import ProjetosLista from "./pages/ProjetosLista";
import Configurador from "./pages/Configurador";
import Configuracoes from "./pages/Configuracoes";
import ModoOficina from "./pages/ModoOficina";
import ModoAtendimento from "./pages/ModoAtendimento";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<ProjetosLista />} />
            <Route path="projeto/:id" element={<Configurador />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="/app/projeto/:id/atender" element={<ModoAtendimento />} />
          <Route path="/op/:id" element={<ModoOficina />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
