// Catálogo padrão de perfis, acessórios e vidro.
export interface Perfil {
  codigo: string;
  descricao: string;
  precoPorMetro: number;   // R$/m
  pesoLinear: number;      // kg/m
}

export interface Acessorio {
  codigo: string;
  descricao: string;
  preco: number;
  unidade: string;
}

export interface Catalogo {
  perfis: Perfil[];
  acessorios: Acessorio[];
  vidroPorM2: number; // R$/m²
  multiplicadoresCor: Record<string, number>;
}

export const CATALOGO_PADRAO: Catalogo = {
  perfis: [
    { codigo: "TUB-50x30",  descricao: "Tubo metalon 50x30x1.5mm", precoPorMetro: 28.50, pesoLinear: 1.95 },
    { codigo: "TUB-40x40",  descricao: "Tubo metalon 40x40x1.5mm", precoPorMetro: 26.00, pesoLinear: 1.85 },
    { codigo: "TUB-30x30",  descricao: "Tubo metalon 30x30x1.2mm", precoPorMetro: 16.80, pesoLinear: 1.10 },
    { codigo: "TUB-20x20",  descricao: "Tubo metalon 20x20x1.2mm", precoPorMetro: 11.40, pesoLinear: 0.72 },
    { codigo: "CHATA-3/16", descricao: "Barra chata 1\" x 3/16\"",   precoPorMetro: 14.00, pesoLinear: 0.95 },
    { codigo: "LAM-25",     descricao: "Lâmina veneziana 25mm",     precoPorMetro: 9.50,  pesoLinear: 0.45 },
    { codigo: "LAM-ROLO",   descricao: "Lâmina aço para portão de rolo 80mm", precoPorMetro: 18.20, pesoLinear: 1.20 },
    { codigo: "TRILHO-U",   descricao: "Trilho U 50mm para portão de correr", precoPorMetro: 38.00, pesoLinear: 2.40 },
    { codigo: "TRILHO-LAT", descricao: "Trilho lateral guia rolo",  precoPorMetro: 22.00, pesoLinear: 1.15 },
    { codigo: "CHAPA-18",   descricao: "Chapa galvanizada 18 (R$/m²)", precoPorMetro: 145.00, pesoLinear: 7.85 },
  ],
  acessorios: [
    { codigo: "ROLDANA-DUPLA",  descricao: "Roldana dupla com rolamento",       preco: 65.00,  unidade: "un" },
    { codigo: "FECHADURA-PORTAO", descricao: "Fechadura para portão",           preco: 145.00, unidade: "un" },
    { codigo: "MOLA-AEREA",     descricao: "Mola aérea hidráulica",             preco: 320.00, unidade: "un" },
    { codigo: "EIXO-ROLO",      descricao: "Eixo aço com mola para portão de rolo", preco: 480.00, unidade: "un" },
    { codigo: "KIT-PIVOT",      descricao: "Kit pivô (rolamento + base)",       preco: 380.00, unidade: "kit" },
    { codigo: "KIT-PANTO",      descricao: "Kit pantográfico (rolete + dobradiça)", preco: 220.00, unidade: "kit" },
    { codigo: "PARAFUSO-AUTO",  descricao: "Parafuso autobrocante 4.2x16",      preco: 0.35,   unidade: "un" },
    { codigo: "TRINCO-JANELA",  descricao: "Trinco para janela de correr",      preco: 28.00,  unidade: "un" },
    { codigo: "BATENTE-BORR",   descricao: "Borracha de vedação (m)",           preco: 6.50,   unidade: "m" },
    { codigo: "GRAPA-CHUMBAR",  descricao: "Grapa chata para chumbar",          preco: 3.20,   unidade: "un" },
    { codigo: "PARAF-BUCHA",    descricao: "Parafuso 8x60 + bucha S8",          preco: 1.90,   unidade: "un" },
  ],
  vidroPorM2: 280.00,
  multiplicadoresCor: { branco: 1.0, preto: 1.05, natural: 1.0, bronze: 1.15 },
};

export const perfilPorCodigo = (cat: Catalogo, codigo: string): Perfil | undefined =>
  cat.perfis.find((p) => p.codigo === codigo);

export const acessorioPorCodigo = (cat: Catalogo, codigo: string): Acessorio | undefined =>
  cat.acessorios.find((a) => a.codigo === codigo);
