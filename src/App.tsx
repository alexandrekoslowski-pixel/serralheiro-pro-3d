import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessaoProvider, ExigirLogin, ExigirGestao } from "@/lib/sessao";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppLayout from "./pages/AppLayout";
import Painel from "./pages/Painel";
import Financeiro from "./pages/Financeiro";
import ProjetosLista from "./pages/ProjetosLista";
import Configurador from "./pages/Configurador";
import Configuracoes from "./pages/Configuracoes";
import Clientes from "./pages/Clientes";
import ClienteDetalhe from "./pages/ClienteDetalhe";
import Catalogo from "./pages/Catalogo";
import Materiais from "./pages/Materiais";
import Equipe from "./pages/Equipe";
import ModoOficina from "./pages/ModoOficina";
import ModoAtendimento from "./pages/ModoAtendimento";
import Calendario from "./pages/Calendario";
import KanbanOficina from "./pages/KanbanOficina";
import MinhasOrdens from "./pages/MinhasOrdens";

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
              <Route index element={<ExigirGestao><Painel /></ExigirGestao>} />
              <Route path="oficina" element={<MinhasOrdens />} />
              <Route path="projetos" element={<ExigirGestao><ProjetosLista /></ExigirGestao>} />
              <Route path="clientes" element={<ExigirGestao><Clientes /></ExigirGestao>} />
              <Route path="clientes/:id" element={<ExigirGestao><ClienteDetalhe /></ExigirGestao>} />
              <Route path="catalogo" element={<ExigirGestao><Catalogo /></ExigirGestao>} />
              <Route path="materiais" element={<ExigirGestao><Materiais /></ExigirGestao>} />
              <Route path="equipe" element={<ExigirGestao><Equipe /></ExigirGestao>} />
              <Route path="financeiro" element={<ExigirGestao><Financeiro /></ExigirGestao>} />

              <Route path="calendario" element={<ExigirGestao><Calendario /></ExigirGestao>} />
              <Route path="projeto/:id" element={<ExigirGestao><Configurador /></ExigirGestao>} />
              <Route path="configuracoes" element={<ExigirGestao><Configuracoes /></ExigirGestao>} />
            </Route>
            <Route path="/app/projeto/:id/atender" element={<ExigirLogin><ExigirGestao><ModoAtendimento /></ExigirGestao></ExigirLogin>} />
            <Route path="/oficina/:codigo" element={<KanbanOficina />} />
            <Route path="/oficina/:codigo/os/:id" element={<ModoOficina />} />
            <Route path="/op/:id" element={<ExigirLogin><ModoOficina /></ExigirLogin>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessaoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
