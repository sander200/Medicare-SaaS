import { useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardPlus,
  Download,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import { useClinic } from "@/lib/clinic/store";
import {
  CLINIC_WHATSAPP,
  MED_CATALOG,
  TENANTS,
  accessMailLink,
  agendaCsv,
  brWhatsapp,
  changeMessage,
  decodeTicket,
  doctorRequestMessage,
  documentMailLink,
  downloadText,
  evaluationText,
  formatISODate,
  formatLongDate,
  formatWa,
  organizeIntake,
  patientsCsv,
  patientConfirmMessage,
  prescriptionText,
  reminderMessage,
  sortBySchedule,
  teleMessage,
  todayISO,
  waLink,
  type Appointment,
  type Patient,
  type Tipo,
} from "@/lib/clinic/model";

type Tab = "agenda" | "patients" | "pre" | "tele" | "admin";
type Area = "patient" | "account" | "pro";

const PRO_TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "tele", label: "Telemedicina", icon: Video },
  { id: "admin", label: "Configurações", icon: Settings },
];

function statusClass(status: Appointment["status"]) {
  if (status === "Confirmado") return "bg-ok-soft text-ok";
  if (status === "Realizado") return "bg-teal-soft text-teal";
  if (status === "Cancelado") return "bg-alert-soft text-alert";
  return "bg-accent-soft text-accent";
}

function tipoClass(tipo: Tipo) {
  if (tipo === "Telemedicina") return "bg-teal-soft text-teal";
  if (tipo === "Retorno") return "bg-accent-soft text-accent";
  return "bg-brand-soft text-brand";
}

export function ClinicApp() {
  const [ready, setReady] = useState(false);
  const tenantId = useClinic((s) => s.tenantId);
  const proOpen = useClinic((s) => s.proOpen);
  const [area, setArea] = useState<Area>("patient");
  const [patientTab, setPatientTab] = useState<"book" | "pre">("book");
  const [tab, setTab] = useState<Tab>("agenda");
  const [agendaDate, setAgendaDate] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    const finish = () => {
      setAgendaDate((current) => current || todayISO());
      if (!useClinic.getState().tenantId) useClinic.getState().enter("CL001");
      const params = new URLSearchParams(window.location.search);
      const pedido = params.get("pedido");
      const ok = params.get("ok");
      if (pedido) {
        const ticket = decodeTicket(pedido);
        if (ticket) {
          const added = useClinic.getState().importBooking(ticket);
          setAgendaDate(ticket.data);
          setSelectedId(ticket.id);
          if (useClinic.getState().proOpen) {
            setArea("pro");
            setTab("agenda");
          } else setArea("account");
          setNotice(
            added
              ? "Pedido novo na agenda. Entre na área profissional e aprove o horário."
              : "Esse pedido já está na agenda do médico.",
          );
        }
      } else if (ok) {
        const found = useClinic.getState().confirmByTicket(ok);
        setArea("patient");
        setPatientTab("book");
        setNotice(
          found
            ? "Consulta confirmada e marcada na sua agenda."
            : "Abra este link no celular em que você pediu o horário.",
        );
      }
      if (pedido || ok) {
        const url = new URL(window.location.href);
        url.searchParams.delete("pedido");
        url.searchParams.delete("ok");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
      setReady(true);
    };
    const unsub = useClinic.persist.onFinishHydration(finish);
    if (useClinic.persist.hasHydrated()) finish();
    else void useClinic.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(t);
  }, [notice]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <p className="text-lg font-semibold text-ink">Clinic SaaS</p>
      </main>
    );
  }

  const tenant = TENANTS.find((t) => t.tenant_id === (tenantId ?? "CL001")) ?? TENANTS[0];
  const proEmail = useClinic.getState().proEmail;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-on-brand" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-6">
              <path fill="currentColor" d="M10 4h4v16h-4zM4 10h16v4H4z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Clinic SaaS</p>
            <h1 className="text-2xl text-ink">{tenant.nombre_comercio}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {area === "pro" ? (
            <button className="btn btn-ghost" type="button" onClick={() => setArea("patient")}>
              Área do paciente
            </button>
          ) : (
            <button className="btn btn-ghost" type="button" onClick={() => setArea("account")}>
              <Settings className="size-4" aria-hidden="true" />
              Área profissional
            </button>
          )}
          {area === "pro" ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                useClinic.getState().lockProfessional();
                setArea("patient");
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </button>
          ) : null}
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur" aria-label="Seções">
        <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-3 py-2">
          {area === "pro" && proOpen
            ? PRO_TABS.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`btn shrink-0 ${active ? "btn-primary" : "btn-ghost"}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setTab(item.id)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })
            : area === "patient"
              ? (["book", "pre"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`btn shrink-0 ${patientTab === id ? "btn-primary" : "btn-ghost"}`}
                    aria-current={patientTab === id ? "page" : undefined}
                    onClick={() => setPatientTab(id)}
                  >
                    {id === "book" ? <CalendarDays className="size-4" aria-hidden="true" /> : <ClipboardPlus className="size-4" aria-hidden="true" />}
                    {id === "book" ? "Agendamento" : "Pré-atendimento"}
                  </button>
                ))
              : null}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-16">
        <p className="mb-4 text-sm text-muted">
          Demonstração vazia para o comprador testar. A organização de texto não diagnostica, não prescreve e não substitui o médico.
        </p>
        {notice ? (
          <p role="status" className="mb-4 rounded-xl border border-teal bg-teal-soft px-4 py-3 text-sm text-ink">
            {notice}
          </p>
        ) : null}

        {area === "account" ? (
          <AccountGate
            onBack={() => setArea("patient")}
            onEnter={() => {
              setArea("pro");
              setTab("agenda");
            }}
          />
        ) : null}
        {area === "patient" && patientTab === "book" ? <Book setNotice={setNotice} /> : null}
        {area === "patient" && patientTab === "pre" ? <Intake setNotice={setNotice} initialPatientId="" /> : null}

        {area === "pro" && proOpen && tab === "agenda" ? (
          <Agenda
            date={agendaDate}
            setDate={setAgendaDate}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            setNotice={setNotice}
            setPreview={setPreview}
          />
        ) : null}
        {area === "pro" && proOpen && tab === "patients" ? (
          <Patients
            setNotice={setNotice}
            onOpen={(id, date) => {
              setSelectedId(id);
              setAgendaDate(date);
              setTab("agenda");
            }}
          />
        ) : null}
        {area === "pro" && proOpen && tab === "tele" ? (
          <Tele selectedId={selectedId} setSelectedId={setSelectedId} setNotice={setNotice} setPreview={setPreview} />
        ) : null}
        {area === "pro" && proOpen && tab === "admin" ? <Admin setNotice={setNotice} /> : null}

        {preview && area === "pro" ? (
          <article className="panel mt-4 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl">{preview.title}</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => downloadText(`${preview.title.toLowerCase().replaceAll(" ", "-")}.txt`, preview.body)}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Baixar .txt
                </button>
                {proEmail ? (
                  <a className="btn btn-accent" href={documentMailLink(proEmail, preview.title, preview.body)}>
                    Enviar ao e-mail
                  </a>
                ) : null}
              </div>
            </div>
            <pre className="max-h-96 overflow-auto rounded-xl bg-bg p-4 text-sm whitespace-pre-wrap text-ink">{preview.body}</pre>
          </article>
        ) : null}
      </main>
    </div>
  );
}

function AccountGate({ onBack, onEnter }: { onBack: () => void; onEnter: () => void }) {
  const proEmail = useClinic((s) => s.proEmail);
  const proOpen = useClinic((s) => s.proOpen);
  const createProfessional = useClinic((s) => s.createProfessional);
  const unlockProfessional = useClinic((s) => s.unlockProfessional);
  const [email, setEmail] = useState(proEmail || "sanderolameda@gmail.com");
  const [typed, setTyped] = useState("");
  const [issued, setIssued] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="panel mx-auto max-w-lg p-6">
      <p className="text-xs font-semibold tracking-widest text-accent uppercase">Usuário</p>
      <h2 className="text-2xl">Acesso profissional</h2>
      <p className="mt-2 text-sm text-muted">
        Crie o usuário com o e-mail que vai receber a chave, as receitas e os CSV. Depois digite a chave para abrir agenda, pacientes, telemedicina e configurações.
      </p>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = email.trim().toLowerCase();
          if (!clean.includes("@")) {
            setError("Informe um e-mail válido.");
            return;
          }
          const code = createProfessional(clean);
          setIssued(code);
          setError("");
          setTyped("");
          window.open(accessMailLink(clean, code), "_blank", "noopener,noreferrer");
        }}
      >
        <label className="block text-sm font-semibold" htmlFor="proEmail">
          E-mail do profissional
          <input id="proEmail" className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button className="btn btn-primary mt-3" type="submit">
          Criar usuário e enviar chave
        </button>
      </form>
      {issued ? (
        <div className="mt-4 rounded-xl border border-teal bg-teal-soft p-4 text-sm">
          <p>
            A mensagem com a chave foi aberta para <strong>{email}</strong>. Envie esse e-mail para recebê-la.
          </p>
          <p className="mt-2">
            Nesta demonstração, sem servidor de e-mail, a chave também aparece aqui: <strong>{issued}</strong>
          </p>
          <a className="mt-2 inline-block text-brand underline" href={accessMailLink(email, issued)}>
            Abrir o e-mail de novo
          </a>
        </div>
      ) : null}
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!unlockProfessional(typed)) {
            setError("Chave incorreta.");
            return;
          }
          setError("");
          onEnter();
        }}
      >
        <label className="block text-sm font-semibold" htmlFor="proCode">
          Chave recebida no e-mail
          <input id="proCode" className="field" inputMode="numeric" autoComplete="one-time-code" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </label>
        <button className="btn btn-ok mt-3" type="submit">
          Entrar na área profissional
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}
      {proOpen ? (
        <button className="btn btn-primary mt-3" type="button" onClick={onEnter}>
          Continuar
        </button>
      ) : null}
      <p className="mt-4 text-sm text-muted">
        Dois médicos em celulares diferentes não veem a mesma agenda: cada navegador guarda só o que foi criado nele. Para cada e-mail ter os seus pacientes, a chave chegar sozinha e os arquivos irem ao e-mail, é preciso ligar um banco (Firebase) à conta.
      </p>
      <button className="btn btn-ghost mt-3" type="button" onClick={onBack}>
        Voltar ao agendamento
      </button>
    </section>
  );
}

function Book({ setNotice }: { setNotice: (s: string) => void }) {
  const patients = useClinic((s) => s.patients);
  const appointments = useClinic((s) => s.appointments);
  const addPatient = useClinic((s) => s.addPatient);
  const addAppointment = useClinic((s) => s.addAppointment);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [data, setData] = useState(todayISO());
  const [hora, setHora] = useState("09:00");
  const [tipo, setTipo] = useState<Tipo>("Presencial");
  const [sent, setSent] = useState<{ href: string; label: string } | null>(null);

  const upcoming = sortBySchedule(appointments.filter((a) => a.status !== "Cancelado")).slice(0, 8);

  return (
    <section className="panel mx-auto max-w-3xl p-5">
      <p className="text-xs font-semibold tracking-widest text-accent uppercase">Paciente</p>
      <h2 className="text-2xl">Agendar consulta</h2>
      <p className="mt-1 text-sm text-muted">
        Peça o horário e avise o médico no WhatsApp. Quando ele aprovar, você recebe a confirmação para marcar aqui.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const phone = brWhatsapp(telefone);
          const existing = patients.find((p) => phone && p.telefone.replace(/\D/g, "") === phone);
          const patientId =
            existing?.id ??
            addPatient({
              nome: nome.trim(),
              nascimento: "",
              telefone: phone,
              email: email.trim(),
              alergias: "",
              consentimentoTelemedicina: true,
            });
          const id = addAppointment({
            patientId,
            data,
            hora,
            tipo,
            status: "Pendente",
            sintomas: "",
            medicamentos: "",
            alergias: existing?.alergias ?? "",
          });
          const ticket = {
            id,
            nome: nome.trim(),
            telefone: phone,
            email: email.trim(),
            data,
            hora,
            tipo,
          };
          setSent({
            href: waLink(CLINIC_WHATSAPP, doctorRequestMessage(ticket)),
            label: "Avisar o médico no WhatsApp",
          });
          setNotice("Horário guardado na sua agenda. Envie o WhatsApp para o médico aprovar.");
          setNome("");
          setTelefone("");
          setEmail("");
        }}
      >
        <label className="text-sm font-semibold sm:col-span-2">
          Nome
          <input className="field" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          WhatsApp
          <input className="field" required value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="11999999999" />
        </label>
        <label className="text-sm font-semibold">
          E-mail
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Data
          <input className="field" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Hora
          <input className="field" type="time" required value={hora} onChange={(e) => setHora(e.target.value)} />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Tipo
          <select className="field" value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
            <option>Presencial</option>
            <option>Retorno</option>
            <option>Telemedicina</option>
          </select>
        </label>
        <button className="btn btn-primary sm:col-span-2" type="submit">
          Pedir horário
        </button>
      </form>
      {sent ? (
        <a className="btn btn-ok mt-4" href={sent.href} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" aria-hidden="true" />
          {sent.label}
        </a>
      ) : null}
      <h3 className="mt-6 text-lg">Sua agenda</h3>
      {upcoming.length ? (
        <ul className="mt-3 space-y-2">
          {upcoming.map((a) => {
            const p = patients.find((x) => x.id === a.patientId);
            return (
              <li key={a.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                {formatISODate(a.data)} · {a.hora} · {p?.nome ?? "Paciente"} · {a.tipo} ·{" "}
                {a.status === "Confirmado" ? "Marcado" : a.status === "Pendente" ? "Aguardando o médico" : a.status}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Nenhum horário pedido ainda.</p>
      )}
    </section>
  );
}

function Agenda({
  date,
  setDate,
  selectedId,
  setSelectedId,
  setNotice,
  setPreview,
}: {
  date: string;
  setDate: (d: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  setNotice: (s: string) => void;
  setPreview: (p: { title: string; body: string } | null) => void;
}) {
  const appointments = useClinic((s) => s.appointments);
  const patients = useClinic((s) => s.patients);
  const updateAppointment = useClinic((s) => s.updateAppointment);
  const addAppointment = useClinic((s) => s.addAppointment);
  const [encaixe, setEncaixe] = useState(false);
  const [fitPatient, setFitPatient] = useState(patients[0]?.id ?? "");
  const [fitTime, setFitTime] = useState("16:00");
  const [fitTipo, setFitTipo] = useState<Tipo>("Presencial");

  const dayList = sortBySchedule(appointments.filter((a) => a.data === date));
  const selected = dayList.find((a) => a.id === selectedId) ?? dayList[0] ?? null;
  const activePatients = patients.filter((p) => p.status === "Ativo");
  const counts = {
    total: dayList.length,
    pendentes: dayList.filter((a) => a.status === "Pendente").length,
    tele: dayList.filter((a) => a.tipo === "Telemedicina").length,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="panel p-5 lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Médico</p>
            <h2 className="text-2xl">Agenda do dia</h2>
            <p className="text-sm text-muted capitalize">{formatLongDate(date)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-semibold">
              Data
              <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <button className="btn btn-ghost self-end" type="button" onClick={() => setDate(todayISO())}>
              Hoje
            </button>
            <button
              className="btn btn-accent self-end"
              type="button"
              onClick={() => {
                downloadText("agenda-clinica.csv", agendaCsv(sortBySchedule(appointments), patients));
                setNotice("Agenda exportada em CSV compatível com Excel.");
              }}
            >
              <Download className="size-4" aria-hidden="true" />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <Stat label="Consultas" value={counts.total} />
          <Stat label="Pendentes" value={counts.pendentes} />
          <Stat label="Telemedicina" value={counts.tele} />
        </div>

        {dayList.length === 0 ? (
          <p className="rounded-xl bg-bg px-4 py-6 text-sm text-muted">Nenhuma consulta nesta data. Use encaixe para incluir.</p>
        ) : (
          <ul className="space-y-2">
            {dayList.map((a) => {
              const patient = patients.find((p) => p.id === a.patientId);
              const open = selected?.id === a.id;
              return (
                <li key={a.id} className={`rounded-2xl border px-4 py-3 ${open ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {a.hora} · {patient?.nome ?? "Paciente"}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-1">
                        <span className={`chip ${tipoClass(a.tipo)}`}>{a.tipo}</span>
                        <span className={`chip ${statusClass(a.status)}`}>{a.status}</span>
                      </p>
                      {a.sintomas ? <p className="mt-2 text-sm text-muted">{a.sintomas}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-ghost" type="button" onClick={() => setSelectedId(a.id)}>
                        Abrir
                      </button>
                      {a.status === "Pendente" ? (
                        <button
                          className="btn btn-ok"
                          type="button"
                          onClick={() => {
                            updateAppointment(a.id, { status: "Confirmado" });
                            const phone = brWhatsapp(patient?.telefone ?? "");
                            if (phone) {
                              window.open(
                                waLink(
                                  phone,
                                  patientConfirmMessage({
                                    id: a.id,
                                    nome: patient?.nome ?? "paciente",
                                    data: a.data,
                                    hora: a.hora,
                                    tipo: a.tipo,
                                  }),
                                ),
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }
                            setNotice(
                              phone
                                ? "Horário aprovado. Envie o WhatsApp para marcar na agenda do paciente."
                                : "Horário aprovado neste celular.",
                            );
                          }}
                        >
                          Aprovar e avisar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4">
          <button className="btn btn-primary" type="button" onClick={() => setEncaixe((v) => !v)}>
            <Plus className="size-4" aria-hidden="true" />
            Encaixe
          </button>
          {encaixe ? (
            <form
              className="mt-3 grid gap-3 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                const patient = patients.find((p) => p.id === fitPatient);
                if (!patient) return;
                const id = addAppointment({
                  patientId: patient.id,
                  data: date,
                  hora: fitTime,
                  tipo: fitTipo,
                  status: "Pendente",
                  sintomas: "",
                  medicamentos: "",
                  alergias: patient.alergias,
                });
                setSelectedId(id);
                setEncaixe(false);
                setNotice("Encaixe adicionado à agenda.");
              }}
            >
              <label className="text-sm font-semibold sm:col-span-3">
                Paciente
                <select className="field" value={fitPatient} onChange={(e) => setFitPatient(e.target.value)}>
                  {activePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Hora
                <input className="field" type="time" required value={fitTime} onChange={(e) => setFitTime(e.target.value)} />
              </label>
              <label className="text-sm font-semibold">
                Tipo
                <select className="field" value={fitTipo} onChange={(e) => setFitTipo(e.target.value as Tipo)}>
                  <option>Presencial</option>
                  <option>Telemedicina</option>
                  <option>Retorno</option>
                </select>
              </label>
              <button className="btn btn-primary self-end" type="submit">
                Salvar encaixe
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <MedicalCard appointment={selected} setNotice={setNotice} setPreview={setPreview} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-bg px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

function MedicalCard({
  appointment,
  setNotice,
  setPreview,
  onIntake,
}: {
  appointment: Appointment | null;
  setNotice: (s: string) => void;
  setPreview: (p: { title: string; body: string } | null) => void;
  onIntake?: () => void;
}) {
  const patients = useClinic((s) => s.patients);
  const configs = useClinic((s) => s.configs);
  const tenantId = useClinic((s) => s.tenantId);
  const updateAppointment = useClinic((s) => s.updateAppointment);
  const tenant = TENANTS.find((t) => t.tenant_id === tenantId);
  const config = (tenantId && configs[tenantId]) || { email: "", whatsapp: "" };

  if (!appointment || !tenant) {
    return (
      <aside className="panel p-5">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">Área médica</p>
        <h2 className="text-2xl">Nenhum atendimento</h2>
        <p className="mt-2 text-sm text-muted">Selecione uma consulta ou crie um encaixe.</p>
      </aside>
    );
  }

  const patient = patients.find((p) => p.id === appointment.patientId);
  if (!patient) return null;
  const brief = organizeIntake(appointment.sintomas, appointment.medicamentos, appointment.alergias);
  const whatsapp = (config.whatsapp || CLINIC_WHATSAPP).replace(/\D/g, "") || CLINIC_WHATSAPP;

  return (
    <aside className="panel p-5">
      <p className="text-xs font-semibold tracking-widest text-accent uppercase">Área médica</p>
      <h2 className="text-2xl">
        {appointment.hora} — {patient.nome}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {formatISODate(appointment.data)} · {appointment.tipo}
      </p>
      <p className="mt-3 text-sm">{appointment.sintomas || "Sem relato de pré-atendimento."}</p>
      {appointment.sintomas ? (
        <p className="mt-2 text-sm text-muted">
          <span className="font-semibold text-ink">Queixa organizada: </span>
          {brief.queixa}
          {brief.duracao !== "não identificada no texto" ? ` (${brief.duracao})` : ""}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted">Medicamentos: {appointment.medicamentos || "não informado"}</p>
      <p className="text-sm text-muted">Alergias: {appointment.alergias || patient.alergias || "não informado"}</p>
      {brief.flags.length ? (
        <p className="mt-3 rounded-xl bg-alert-soft px-3 py-2 text-sm text-alert">
          Termos que merecem atenção clínica: {brief.flags.join(", ")}. Não é triagem automática.
        </p>
      ) : null}
      {appointment.documentos.length ? (
        <ul className="mt-3 text-sm">
          {appointment.documentos.map((d) => (
            <li key={d.name + d.size}>
              {d.dataUrl ? (
                <a className="text-brand underline" href={d.dataUrl} download={d.name}>
                  {d.name}
                </a>
              ) : (
                <span>{d.name} (nome registrado)</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <label className="mt-4 block text-sm font-semibold" htmlFor={`notes-${appointment.id}`}>
        Notas do médico
        <textarea
          id={`notes-${appointment.id}`}
          className="field min-h-28"
          value={appointment.notas}
          placeholder="Evolução e conduta registradas pelo médico"
          onChange={(e) => updateAppointment(appointment.id, { notas: e.target.value })}
        />
      </label>
      <label className="mt-3 block text-sm font-semibold" htmlFor={`rx-${appointment.id}`}>
        Medicamento informado pelo médico
        <input
          id={`rx-${appointment.id}`}
          className="field"
          value={appointment.medicamentoRascunho ?? ""}
          placeholder="Somente o que o médico escrever"
          onChange={(e) => updateAppointment(appointment.id, { medicamentoRascunho: e.target.value })}
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {MED_CATALOG.map((item) => (
          <button
            key={item.nome}
            className="btn btn-ghost"
            type="button"
            onClick={() => updateAppointment(appointment.id, { medicamentoRascunho: item.nome })}
          >
            {item.nome}
          </button>
        ))}
      </div>
      <p className="mt-1 text-sm text-muted">Catálogo demonstrativo. Clicar só copia o nome. Não indica dose nem tratamento.</p>
      <label className="mt-3 block text-sm font-semibold" htmlFor={`posologia-${appointment.id}`}>
        Posologia e orientações
        <textarea
          id={`posologia-${appointment.id}`}
          className="field min-h-20"
          value={appointment.posologia ?? ""}
          placeholder="Preencher pelo médico"
          onChange={(e) => updateAppointment(appointment.id, { posologia: e.target.value })}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {onIntake ? (
          <button className="btn btn-accent" type="button" onClick={onIntake}>
            Ver pré-atendimento
          </button>
        ) : null}
        {appointment.status !== "Realizado" && appointment.status !== "Cancelado" ? (
          <button
            className="btn btn-ok"
            type="button"
            onClick={() => {
              updateAppointment(appointment.id, { status: "Realizado" });
              setNotice("Atendimento marcado como realizado.");
            }}
          >
            Realizado
          </button>
        ) : null}
        {appointment.status !== "Cancelado" && appointment.status !== "Realizado" ? (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              updateAppointment(appointment.id, { status: "Cancelado" });
              setNotice("Consulta cancelada.");
            }}
          >
            Cancelar
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            const body = evaluationText({
              clinic: tenant.nombre_comercio,
              email: config.email,
              patient,
              appointment,
            });
            setPreview({ title: "Resumo pós-consulta", body });
            setNotice("Resumo gerado para revisão médica.");
          }}
        >
          <Stethoscope className="size-4" aria-hidden="true" />
          Gerar resumo
        </button>
        <button
          className="btn btn-accent"
          type="button"
          onClick={() => {
            const body = prescriptionText({
              patient,
              medication: appointment.medicamentoRascunho ?? "",
              posologia: appointment.posologia ?? "",
            });
            setPreview({ title: "Rascunho de prescrição", body });
            setNotice("Rascunho criado. Não é receita válida.");
          }}
        >
          Rascunho de receita
        </button>
      </div>
      <div className="mt-2">
        <a
          className="btn btn-ok"
          href={waLink(
            whatsapp,
            appointment.tipo === "Telemedicina"
              ? teleMessage(patient)
              : reminderMessage(patient, appointment.data, appointment.hora, tenant.nombre_comercio),
          )}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    </aside>
  );
}

function Patients({
  setNotice,
  onOpen,
}: {
  setNotice: (s: string) => void;
  onOpen: (appointmentId: string, date: string) => void;
}) {
  const patients = useClinic((s) => s.patients);
  const appointments = useClinic((s) => s.appointments);
  const addPatient = useClinic((s) => s.addPatient);
  const updatePatient = useClinic((s) => s.updatePatient);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    nascimento: "",
    telefone: "",
    email: "",
    alergias: "",
    consentimentoTelemedicina: false,
  });

  const filtered = patients.filter((p) => p.nome.toLowerCase().includes(q.trim().toLowerCase()));

  function load(p: Patient) {
    setEditing(p.id);
    setForm({
      nome: p.nome,
      nascimento: p.nascimento,
      telefone: p.telefone,
      email: p.email,
      alergias: p.alergias,
      consentimentoTelemedicina: p.consentimentoTelemedicina,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="panel p-5 lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Prontuário</p>
            <h2 className="text-2xl">Controle de pacientes</h2>
          </div>
          <button
            className="btn btn-accent"
            type="button"
            onClick={() => {
              downloadText("pacientes-clinica.csv", patientsCsv(patients));
              setNotice("Pacientes exportados em CSV compatível com Excel.");
            }}
          >
            <Download className="size-4" aria-hidden="true" />
            Exportar pacientes
          </button>
        </div>
        <label className="mb-3 block text-sm font-semibold" htmlFor="search">
          Buscar
          <span className="relative block">
            <Search className="pointer-events-none absolute top-4 left-3 size-4 text-muted" aria-hidden="true" />
            <input id="search" className="field pl-9" placeholder="Nome do paciente" value={q} onChange={(e) => setQ(e.target.value)} />
          </span>
        </label>
        {filtered.length === 0 ? <p className="text-sm text-muted">Nenhum paciente encontrado.</p> : null}
        <ul className="space-y-2">
          {filtered.map((p) => {
            const next = sortBySchedule(
              appointments.filter((a) => a.patientId === p.id && a.status !== "Cancelado" && a.status !== "Realizado"),
            )[0];
            return (
              <li key={p.id} className="rounded-2xl border border-line px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.nome}</p>
                    <p className="text-sm text-muted">
                      Nascimento: {formatISODate(p.nascimento)} · {p.telefone}
                    </p>
                    <p className="text-sm text-muted">
                      {p.status} · Telemedicina: {p.consentimentoTelemedicina ? "autorizada" : "sem consentimento"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-ghost" type="button" onClick={() => load(p)}>
                      Editar
                    </button>
                    {next ? (
                      <button className="btn btn-primary" type="button" onClick={() => onOpen(next.id, next.data)}>
                        Agenda
                      </button>
                    ) : null}
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => {
                        updatePatient(p.id, { status: p.status === "Ativo" ? "Inativo" : "Ativo" });
                        setNotice(p.status === "Ativo" ? "Paciente inativado." : "Paciente reativado.");
                      }}
                    >
                      {p.status === "Ativo" ? "Inativar" : "Reativar"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="panel p-5">
        <h2 className="text-2xl">{editing ? "Editar paciente" : "Novo paciente"}</h2>
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nome.trim()) return;
            if (editing) {
              updatePatient(editing, form);
              setNotice("Cadastro atualizado.");
            } else {
              addPatient(form);
              setNotice("Paciente cadastrado.");
              setForm({ nome: "", nascimento: "", telefone: "", email: "", alergias: "", consentimentoTelemedicina: false });
            }
          }}
        >
          <label className="block text-sm font-semibold">
            Nome
            <input className="field" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            Nascimento
            <input className="field" type="date" value={form.nascimento} onChange={(e) => setForm({ ...form, nascimento: e.target.value })} />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            Telefone
            <input className="field" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            E-mail
            <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            Alergias
            <textarea className="field min-h-20" value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} />
          </label>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.consentimentoTelemedicina}
              onChange={(e) => setForm({ ...form, consentimentoTelemedicina: e.target.checked })}
            />
            Consentimento para contato de telemedicina
          </label>
          <button className="btn btn-primary mt-4 w-full" type="submit">
            {editing ? "Salvar alterações" : "Cadastrar"}
          </button>
          {editing ? (
            <button
              className="btn btn-ghost mt-2 w-full"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ nome: "", nascimento: "", telefone: "", email: "", alergias: "", consentimentoTelemedicina: false });
              }}
            >
              Limpar formulário
            </button>
          ) : null}
        </form>
      </section>
    </div>
  );
}

function Intake({ setNotice, initialPatientId }: { setNotice: (s: string) => void; initialPatientId: string }) {
  const patients = useClinic((s) => s.patients);
  const appointments = useClinic((s) => s.appointments);
  const addAppointment = useClinic((s) => s.addAppointment);
  const updateAppointment = useClinic((s) => s.updateAppointment);
  const updatePatient = useClinic((s) => s.updatePatient);
  const active = patients.filter((p) => p.status === "Ativo");
  const [patientId, setPatientId] = useState(initialPatientId || active[0]?.id || "");
  const [sintomas, setSintomas] = useState("");
  const [meds, setMeds] = useState("");
  const [alergias, setAlergias] = useState("");
  const [consent, setConsent] = useState(false);
  const [brief, setBrief] = useState<ReturnType<typeof organizeIntake> | null>(null);
  const [fileNote, setFileNote] = useState("");

  useEffect(() => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;
    const today = todayISO();
    const existing = sortBySchedule(
      appointments.filter(
        (a) => a.patientId === patient.id && a.status !== "Cancelado" && a.status !== "Realizado" && a.data >= today,
      ),
    )[0];
    setAlergias(existing?.alergias || patient.alergias);
    setSintomas(existing?.sintomas ?? "");
    setMeds(existing?.medicamentos ?? "");
  }, [patientId]);

  return (
    <section className="panel mx-auto max-w-3xl p-5">
      <p className="text-xs font-semibold tracking-widest text-accent uppercase">Paciente</p>
      <h2 className="text-2xl">Pré-atendimento</h2>
      <p className="mt-1 text-sm text-muted">O texto é só organizado. Nada aqui é diagnóstico ou prescrição.</p>
      {active.length === 0 ? <p className="mt-4 text-sm text-muted">Ainda não há paciente. Comece pela aba Agendamento.</p> : null}
      {active.length > 0 ? (
        <>
      <form
        className="mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const patient = patients.find((p) => p.id === patientId);
          if (!patient) return;
          const input = e.currentTarget;
          const files = await readFiles(input.querySelector<HTMLInputElement>("#docs")?.files ?? null);
          const organized = organizeIntake(sintomas, meds, alergias);
          const today = todayISO();
          const existing = sortBySchedule(
            appointments.filter(
              (a) => a.patientId === patient.id && a.status !== "Cancelado" && a.status !== "Realizado" && a.data >= today,
            ),
          )[0];
          if (existing) {
            updateAppointment(existing.id, {
              sintomas,
              medicamentos: meds,
              alergias,
              documentos: [...existing.documentos, ...files],
            });
          } else {
            addAppointment({
              patientId: patient.id,
              data: today,
              hora: "18:00",
              tipo: "Presencial",
              status: "Pendente",
              sintomas,
              medicamentos: meds,
              alergias,
              documentos: files,
            });
          }
          updatePatient(patient.id, { alergias, consentimentoTelemedicina: consent || patient.consentimentoTelemedicina });
          setBrief(organized);
          setFileNote(
            files.length
              ? `${files.length} arquivo(s) anexado(s). Arquivos grandes guardam só o nome neste MVP.`
              : "",
          );
          setNotice("Pré-atendimento salvo na próxima consulta em aberto.");
        }}
      >
        <label className="block text-sm font-semibold" htmlFor="prePatient">
          Paciente
          <select id="prePatient" className="field" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold" htmlFor="symptoms">
          O que está sentindo?
          <textarea id="symptoms" className="field min-h-32" required value={sintomas} onChange={(e) => setSintomas(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold" htmlFor="meds">
          Medicamentos em uso
          <textarea id="meds" className="field min-h-20" value={meds} onChange={(e) => setMeds(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold" htmlFor="allergies">
          Alergias
          <textarea id="allergies" className="field min-h-16" value={alergias} onChange={(e) => setAlergias(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold" htmlFor="docs">
          Documentos / exames
          <input id="docs" className="field" type="file" multiple accept=".pdf,image/*" />
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Autorizo o tratamento destas informações para o atendimento.
        </label>
        <button className="btn btn-primary mt-4" type="submit">
          Salvar pré-atendimento
        </button>
      </form>
      {fileNote ? <p className="mt-3 text-sm text-muted">{fileNote}</p> : null}
      {brief ? (
        <div className="mt-4 rounded-xl border border-teal bg-teal-soft p-4" role="status">
          <p className="font-semibold">Organização do relato — apoio administrativo</p>
          <pre className="mt-2 text-sm whitespace-pre-wrap">{brief.texto}</pre>
          {brief.flags.length ? (
            <p className="mt-2 font-semibold text-alert">Termos que merecem atenção clínica: {brief.flags.join(", ")}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted">Não é diagnóstico nem triagem médica automática.</p>
        </div>
      ) : null}
        </>
      ) : null}
    </section>
  );
}

function Tele({
  selectedId,
  setSelectedId,
  setNotice,
  setPreview,
}: {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  setNotice: (s: string) => void;
  setPreview: (p: { title: string; body: string } | null) => void;
}) {
  const appointments = useClinic((s) => s.appointments);
  const patients = useClinic((s) => s.patients);
  const configs = useClinic((s) => s.configs);
  const tenantId = useClinic((s) => s.tenantId);
  const updateAppointment = useClinic((s) => s.updateAppointment);
  const config = (tenantId && configs[tenantId]) || { email: "", whatsapp: CLINIC_WHATSAPP };
  const whatsapp = (config.whatsapp || CLINIC_WHATSAPP).replace(/\D/g, "") || CLINIC_WHATSAPP;
  const remote = sortBySchedule(appointments.filter((a) => a.tipo === "Telemedicina" && a.status !== "Cancelado"));
  const selected = remote.find((a) => a.id === selectedId) ?? remote[0] ?? null;
  const patient = patients.find((p) => p.id === selected?.patientId);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="panel p-5 lg:col-span-2">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">Telemedicina</p>
        <h2 className="text-2xl">Atendimentos remotos</h2>
        <p className="mt-1 text-sm text-muted">O WhatsApp abre um link wa.me para {formatWa(whatsapp)}.</p>
        <a
          className="btn btn-ok mt-4"
          target="_blank"
          rel="noreferrer"
          href={waLink(whatsapp, "Olá, sou paciente da Clínica Azul e quero atendimento por telemedicina.")}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Abrir WhatsApp
        </a>
        {remote.length === 0 ? <p className="mt-4 text-sm text-muted">Nenhuma teleconsulta ativa.</p> : null}
        <ul className="mt-4 space-y-2">
          {remote.map((a) => {
            const p = patients.find((x) => x.id === a.patientId);
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                <div>
                  <p className="font-semibold">
                    {formatISODate(a.data)} · {a.hora} · {p?.nome}
                  </p>
                  <p className="text-sm text-muted">{a.status}</p>
                </div>
                <button className="btn btn-ghost" type="button" onClick={() => setSelectedId(a.id)}>
                  Abrir
                </button>
              </li>
            );
          })}
        </ul>
        {selected && patient ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Nova data
              <input
                className="field"
                type="date"
                value={selected.data}
                onChange={(e) => updateAppointment(selected.id, { data: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold">
              Novo horário
              <input
                className="field"
                type="time"
                value={selected.hora}
                onChange={(e) => updateAppointment(selected.id, { hora: e.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <a className="btn btn-ok" target="_blank" rel="noreferrer" href={waLink(whatsapp, teleMessage(patient))}>
                <MessageCircle className="size-4" aria-hidden="true" />
                Avisar teleconsulta
              </a>
              <a
                className="btn btn-ghost"
                target="_blank"
                rel="noreferrer"
                href={waLink(whatsapp, changeMessage(patient, selected.data, selected.hora))}
              >
                Avisar alteração
              </a>
            </div>
          </div>
        ) : null}
      </section>
      <MedicalCard appointment={selected} setNotice={setNotice} setPreview={setPreview} />
    </div>
  );
}

function Admin({ setNotice }: { setNotice: (s: string) => void }) {
  const tenantId = useClinic((s) => s.tenantId);
  const configs = useClinic((s) => s.configs);
  const saveConfig = useClinic((s) => s.saveConfig);
  const resetDemo = useClinic((s) => s.resetDemo);
  const tenant = TENANTS.find((t) => t.tenant_id === tenantId);
  const config = (tenantId && configs[tenantId]) || { email: "", whatsapp: "" };
  const [email, setEmail] = useState(config.email);
  const [whatsapp, setWhatsapp] = useState(config.whatsapp);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="panel p-5">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">Configuração</p>
        <h2 className="text-2xl">Comunicação</h2>
        <p className="mt-1 text-sm text-muted">
          {tenant?.nombre_comercio} · {tenant?.pais} · {tenant?.tenant_id}
        </p>
        <label className="mt-4 block text-sm font-semibold" htmlFor="adminEmail">
          E-mail para documentos
          <input id="adminEmail" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold" htmlFor="adminWa">
          WhatsApp telemedicina
          <input id="adminWa" className="field" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </label>
        <p className="mt-2 text-sm text-muted">Exibido como {formatWa(whatsapp)}</p>
        <button
          className="btn btn-primary mt-4"
          type="button"
          onClick={() => {
            saveConfig({ email: email.trim(), whatsapp: whatsapp.replace(/\D/g, "") });
            setNotice("Configuração salva neste navegador.");
          }}
        >
          Salvar configuração
        </button>
        <button
          className="btn btn-ghost mt-2"
          type="button"
          onClick={() => {
            resetDemo();
            setEmail("sanderolameda@gmail.com");
            setWhatsapp(CLINIC_WHATSAPP);
            setNotice("Pacientes e agenda limpos.");
          }}
        >
          Limpar pacientes e agenda
        </button>
        <p className="mt-3 text-sm text-muted">
          WhatsApp da clínica: {formatWa(CLINIC_WHATSAPP)}. Os dados ficam neste navegador até ligar o Firebase ao e-mail do profissional.
        </p>
      </section>
      <section className="panel p-5">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">Medicamentos</p>
        <h2 className="text-2xl">Catálogo demonstrativo</h2>
        <ul className="mt-4 space-y-2">
          {MED_CATALOG.map((m) => (
            <li key={m.nome} className="rounded-xl border border-line px-3 py-3">
              <p className="font-semibold">{m.nome}</p>
              <p className="text-sm text-muted">
                {m.principio} · {m.forma}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          A lista não prescreve. Em produção, vincular a fonte regulatória (bulário) e revisão do médico.
        </p>
      </section>
    </div>
  );
}

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function readFiles(list: FileList | null) {
  if (!list?.length) return [];
  const out: { name: string; size: number; dataUrl?: string }[] = [];
  for (const file of Array.from(list)) {
    const doc: { name: string; size: number; dataUrl?: string } = { name: file.name, size: file.size };
    if (file.size <= 180_000) {
      try {
        doc.dataUrl = await readAsDataURL(file);
      } catch {
        /* nome permanece */
      }
    }
    out.push(doc);
  }
  return out;
}
