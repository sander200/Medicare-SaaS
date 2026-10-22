export type Tipo = "Presencial" | "Telemedicina" | "Retorno";
export type ApptStatus = "Pendente" | "Confirmado" | "Realizado" | "Cancelado";

export type DocFile = {
  name: string;
  size: number;
  dataUrl?: string;
};

export type Patient = {
  id: string;
  nome: string;
  nascimento: string;
  telefone: string;
  email: string;
  status: "Ativo" | "Inativo";
  alergias: string;
  consentimentoTelemedicina: boolean;
};

export type Appointment = {
  id: string;
  patientId: string;
  data: string;
  hora: string;
  tipo: Tipo;
  status: ApptStatus;
  sintomas: string;
  medicamentos: string;
  alergias: string;
  notas: string;
  medicamentoRascunho: string;
  posologia: string;
  documentos: DocFile[];
};

export type TenantRecord = {
  tenant_id: string;
  nombre_comercio: string;
  pais: string;
  estado: "Activo" | "Suspendido";
  plan: string;
};

export type ClinicConfig = {
  email: string;
  whatsapp: string;
};

export const TENANTS: TenantRecord[] = [
  {
    tenant_id: "CL001",
    nombre_comercio: "Clínica Azul",
    pais: "Brasil",
    estado: "Activo",
    plan: "Professional",
  },
  {
    tenant_id: "CL002",
    nombre_comercio: "Consultorio Caribe",
    pais: "Venezuela",
    estado: "Suspendido",
    plan: "Basic",
  },
];

export function licenseLabel(estado: TenantRecord["estado"]) {
  return estado === "Activo" ? "Ativo" : "Suspenso";
}

export const CLINIC_WHATSAPP = "5519993680549";

export const DEFAULT_CONFIGS: Record<string, ClinicConfig> = {
  CL001: { email: "sanderolameda@gmail.com", whatsapp: CLINIC_WHATSAPP },
  CL002: { email: "medico@caribe.example", whatsapp: "5841299999999" },
};

export function makeAccessCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function accessMailLink(email: string, code: string) {
  const subject = "Chave de acesso — Clinic SaaS";
  const body = `Sua chave para a área profissional da Clínica Azul é: ${code}\n\nDigite essa chave na aba de usuário. Não compartilhe.`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function documentMailLink(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
}

export const MED_CATALOG = [
  { nome: "Paracetamol", principio: "paracetamol", forma: "comprimido" },
  { nome: "Dipirona", principio: "dipirona", forma: "comprimido" },
  { nome: "Ibuprofeno", principio: "ibuprofeno", forma: "comprimido" },
];

const RED_FLAGS = [
  "falta de ar",
  "dor no peito",
  "desmaio",
  "convulsão",
  "convulsao",
  "sangramento intenso",
  "confusão mental",
  "confusao mental",
];

export type IntakeBrief = {
  queixa: string;
  duracao: string;
  medicamentos: string;
  alergias: string;
  original: string;
  flags: string[];
  texto: string;
};

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + days);
  return todayISO(dt);
}

export function formatISODate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatLongDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function formatWa(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) {
    const dd = d.slice(2, 4);
    const rest = d.slice(4);
    return `+55 ${dd} ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
  }
  return d ? `+${d}` : "";
}

export function nid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function organizeIntake(sintomas: string, medicamentos: string, alergias: string): IntakeBrief {
  const original = sintomas.trim();
  const lower = original.toLowerCase();
  const flags = RED_FLAGS.filter((flag) => lower.includes(flag));
  const duracao = original.match(/há\s+\d+\s+[a-zà-ú]+/i)?.[0] ?? "não identificada no texto";
  const parts = original
    .split(/[\n.]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const queixa = parts[0] || "Não informado";
  const medicamentosTxt = medicamentos.trim() || "Não informado";
  const alergiasTxt = alergias.trim() || "Não informado";
  const texto = [
    `Queixa em linguagem organizada: ${queixa}`,
    parts.length > 1 ? `Detalhes: ${parts.slice(1).join(". ")}` : "",
    `Duração mencionada: ${duracao}`,
    `Medicamentos em uso (informados pelo paciente): ${medicamentosTxt}`,
    `Alergias informadas: ${alergiasTxt}`,
    `Relato original preservado: ${original || "Não informado"}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { queixa, duracao, medicamentos: medicamentosTxt, alergias: alergiasTxt, original, flags, texto };
}

export function evaluationText(input: {
  clinic: string;
  email: string;
  patient: Patient;
  appointment: Appointment;
}) {
  const brief = organizeIntake(input.appointment.sintomas, input.appointment.medicamentos, input.appointment.alergias);
  return [
    "RESUMO PARA REVISÃO MÉDICA",
    "",
    `Clínica: ${input.clinic}`,
    `Paciente: ${input.patient.nome}`,
    `Nascimento: ${formatISODate(input.patient.nascimento)}`,
    `Data: ${formatISODate(input.appointment.data)} ${input.appointment.hora}`,
    `Tipo: ${input.appointment.tipo}`,
    `Status: ${input.appointment.status}`,
    "",
    "Relato / pré-atendimento:",
    input.appointment.sintomas || "Não informado",
    "",
    "Organização administrativa do relato (não é diagnóstico):",
    brief.texto,
    brief.flags.length ? `\nTermos que merecem atenção clínica: ${brief.flags.join(", ")}` : "",
    "",
    "Medicamentos em uso:",
    input.appointment.medicamentos || "Não informado",
    "",
    "Alergias:",
    input.appointment.alergias || input.patient.alergias || "Não informado",
    "",
    "Avaliação / conduta registrada pelo médico:",
    input.appointment.notas || "[preencher pelo médico]",
    "",
    "Documento gerado pelo sistema para revisão e assinatura do profissional habilitado.",
    "Não substitui avaliação médica.",
    `E-mail para documentos: ${input.email}`,
  ].join("\n");
}

export function prescriptionText(input: {
  patient: Patient;
  medication: string;
  posologia: string;
}) {
  return [
    "RASCUNHO DE PRESCRIÇÃO — REVISÃO OBRIGATÓRIA DO MÉDICO",
    "",
    `Paciente: ${input.patient.nome}`,
    `Nascimento: ${formatISODate(input.patient.nascimento)}`,
    `Medicamento informado pelo médico: ${input.medication.trim() || "[preencher]"}`,
    "",
    "Posologia, duração e demais orientações:",
    input.posologia.trim() || "[preencher pelo médico]",
    "",
    "Não é receita válida sem emissão, assinatura e requisitos legais aplicáveis pelo profissional habilitado.",
    "O catálogo do sistema é demonstrativo e não indica tratamento.",
  ].join("\n");
}

export function waLink(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type BookingTicket = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  data: string;
  hora: string;
  tipo: Tipo;
};

export function brWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

export function appHome() {
  if (typeof window === "undefined") return "";
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${window.location.origin}${base}/`;
}

function encodeTicket(ticket: BookingTicket) {
  const json = JSON.stringify(ticket);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeTicket(raw: string): BookingTicket | null {
  try {
    const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
    const binary = atob(raw.replaceAll("-", "+").replaceAll("_", "/") + pad);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Partial<BookingTicket>;
    if (!data.id || !data.nome || !data.data || !data.hora || !data.tipo) return null;
    if (data.tipo !== "Presencial" && data.tipo !== "Telemedicina" && data.tipo !== "Retorno") return null;
    return {
      id: data.id,
      nome: data.nome,
      telefone: data.telefone ?? "",
      email: data.email ?? "",
      data: data.data,
      hora: data.hora,
      tipo: data.tipo,
    };
  } catch {
    return null;
  }
}

export function doctorRequestLink(ticket: BookingTicket) {
  return `${appHome()}?pedido=${encodeTicket(ticket)}`;
}

export function patientConfirmLink(id: string) {
  return `${appHome()}?ok=${encodeURIComponent(id)}`;
}

export function doctorRequestMessage(ticket: BookingTicket) {
  return [
    "Pedido de horário — Clínica Azul",
    ticket.nome,
    `${formatISODate(ticket.data)} às ${ticket.hora}`,
    ticket.tipo,
    ticket.telefone ? `WhatsApp do paciente: ${formatWa(brWhatsapp(ticket.telefone))}` : "",
    `Abrir na agenda: ${doctorRequestLink(ticket)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function patientConfirmMessage(ticket: Pick<BookingTicket, "id" | "nome" | "data" | "hora" | "tipo">) {
  return [
    `Olá ${ticket.nome}, a Clínica Azul confirmou seu horário.`,
    `${formatISODate(ticket.data)} às ${ticket.hora} · ${ticket.tipo}`,
    `Marcar na sua agenda: ${patientConfirmLink(ticket.id)}`,
  ].join("\n");
}

export function reminderMessage(patient: Patient, date: string, time: string, clinic: string) {
  return `Olá ${patient.nome}, lembrete da sua consulta em ${formatISODate(date)} às ${time} — ${clinic}.`;
}

export function changeMessage(patient: Patient, date: string, time: string) {
  return `Olá ${patient.nome}, sua consulta foi alterada para ${formatISODate(date)} às ${time}.`;
}

export function teleMessage(patient: Patient) {
  return `Olá ${patient.nome}, acesse sua teleconsulta no horário agendado.`;
}

function csvCell(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function patientsCsv(patients: Patient[]) {
  const rows = [
    ["Paciente", "Nascimento", "Telefone", "E-mail", "Status", "Alergias", "Consentimento telemedicina"],
    ...patients.map((p) => [
      p.nome,
      formatISODate(p.nascimento),
      p.telefone,
      p.email,
      p.status,
      p.alergias,
      p.consentimentoTelemedicina ? "Sim" : "Não",
    ]),
  ];
  return `\uFEFF${rows.map((r) => r.map(csvCell).join(",")).join("\n")}`;
}

export function agendaCsv(appointments: Appointment[], patients: Patient[]) {
  const rows = [
    ["Paciente", "Data", "Hora", "Tipo", "Status", "Sintomas", "Medicamentos", "Alergias"],
    ...appointments.map((a) => {
      const p = patients.find((x) => x.id === a.patientId);
      return [p?.nome ?? "", formatISODate(a.data), a.hora, a.tipo, a.status, a.sintomas, a.medicamentos, a.alergias];
    }),
  ];
  return `\uFEFF${rows.map((r) => r.map(csvCell).join(",")).join("\n")}`;
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function buildSeed() {
  return { patients: [] as Patient[], appointments: [] as Appointment[] };
}

export function sortBySchedule(list: Appointment[]) {
  return [...list].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}
