export interface Project {
  id: string | number;
  titulo: string;
  tipo: string;
  proponente?: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  mentor?: string;
  origem_arquivo?: string;
  completude?: number;
  objetivo?: string;
  contexto_limitacoes?: string;
  requisitos_tecnicos?: string;
  restricoes?: string;
  entregaveis_sucesso?: string;
}

export interface SummaryItem {
  nome: string;
  quantidade: number;
}

export interface DashboardSummary {
  total: number;
  desafios: number;
  projetos: number;
  empresas: number;
  proponentes: number;
  completude_media: number;
  por_empresa: SummaryItem[];
  por_cargo: SummaryItem[];
  por_tipo: SummaryItem[];
}