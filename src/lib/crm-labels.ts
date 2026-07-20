export const COMPANY_STATUS = {
  lead: "Lead",
  qualificado: "Qualificado",
  oportunidade_futura: "Oportunidade futura",
  cliente_ativo: "Cliente ativo",
  cliente_inativo: "Cliente inativo",
  desqualificado: "Desqualificado",
} as const;

export const COMPANY_ORIGIN = {
  indicacao: "Indicação",
  site: "Site",
  prospeccao_ativa: "Prospecção ativa",
  parceiro: "Parceiro",
  evento: "Evento",
  campanha: "Campanha",
  outro: "Outro",
} as const;

export const PRIORITY = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
} as const;

export const LEAD_STATUS = {
  novo: "Novo lead",
  em_contato: "Em contato",
  qualificado: "Qualificado",
  desqualificado: "Desqualificado",
  oportunidade_futura: "Oportunidade futura",
} as const;

export const PIPELINE_STAGES = [
  "novo_lead",
  "em_qualificacao",
  "oportunidade_futura",
  "reuniao_agendada",
  "diagnostico_ti",
  "proposta_a_desenvolver",
  "proposta_em_desenvolvimento",
  "proposta_apresentada",
  "negociacao",
  "contrato_aceito",
  "onboarding",
  "cliente_ativo",
  "desqualificado",
  "perdido",
] as const;

export const PIPELINE_STAGE_LABELS: Record<(typeof PIPELINE_STAGES)[number], string> = {
  novo_lead: "Novo lead",
  em_qualificacao: "Em qualificação",
  oportunidade_futura: "Oportunidade futura",
  reuniao_agendada: "Reunião agendada",
  diagnostico_ti: "Diagnóstico de TI",
  proposta_a_desenvolver: "Proposta a desenvolver",
  proposta_em_desenvolvimento: "Proposta em desenvolvimento",
  proposta_apresentada: "Proposta apresentada",
  negociacao: "Negociação",
  contrato_aceito: "Contrato aceito",
  onboarding: "Onboarding",
  cliente_ativo: "Cliente ativo",
  desqualificado: "Desqualificado",
  perdido: "Perdido",
};

export const ACTIVITY_TYPE = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
  reuniao: "Reunião",
  visita: "Visita",
  diagnostico: "Diagnóstico",
  desenvolver_proposta: "Desenvolver proposta",
  apresentar_proposta: "Apresentar proposta",
  follow_up: "Follow-up",
  notificar_equipe: "Notificar equipe da venda",
  solicitar_onboarding: "Solicitar onboarding",
  renovacao: "Renovação",
} as const;

export const ACTIVITY_STATUS = {
  pendente: "Pendente",
  concluida: "Concluída",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
} as const;

export const CONTACT_ROLE = {
  decisor: "Decisor",
  influenciador: "Influenciador",
  tecnico: "Técnico",
  financeiro: "Financeiro",
  operacional: "Operacional",
} as const;

export const INTERACTION_TYPE = {
  nota: "Nota",
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  reuniao: "Reunião",
  diagnostico: "Diagnóstico",
  mudanca_etapa: "Mudança de etapa",
  proposta_criada: "Proposta criada",
  proposta_apresentada: "Proposta apresentada",
  proposta_aceita: "Proposta aceita",
  cliente_ativado: "Cliente ativado",
} as const;

export const DISQUALIFICATION_REASONS = [
  "Falta de orçamento",
  "Ausência de autoridade para decisão",
  "Perfil inadequado, fora do público-alvo",
  "Falta de dor ou necessidade",
  "Dados de contato falsos",
];
