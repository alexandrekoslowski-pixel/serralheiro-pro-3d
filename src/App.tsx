import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessaoProvider, ExigirLogin } from "@/lib/sessao";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppLayout from "./pages/AppLayout";
import Painel from "./pages/Painel";
import Financeiro from "./pages/Financeiro";
import ProjetosLista from "./pages/ProjetosLista";
import Configurador from "./pages/Configurador";
import Configuracoes from "./pages/Configuracoes";
import ModoOficina from "./pages/ModoOficina";
import ModoAtendimento from "./pages/ModoAtendimento";
import Calendario from "./pages/Calendario";
import KanbanOficina from "./pages/KanbanOficina";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessaoProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<ExigirLogin><AppLayout /></ExigirLogin>}>
              <Route index element={<Painel />} />
              <Route path="projetos" element={<ProjetosLista />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="calendario" element={<Calendario />} />
              <Route path="projeto/:id" element={<Configurador />} />
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>
            <Route path="/app/projeto/:id/atender" element={<ExigirLogin><ModoAtendimento /></ExigirLogin>} />
            <Route path="/oficina/:codigo" element={<KanbanOficina />} />
            <Route path="/op/:id" element={<ExigirLogin><ModoOficina /></ExigirLogin>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessaoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
