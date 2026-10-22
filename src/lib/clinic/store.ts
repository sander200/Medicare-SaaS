import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  buildSeed,
  DEFAULT_CONFIGS,
  makeAccessCode,
  nid,
  type Appointment,
  type BookingTicket,
  type ClinicConfig,
  type DocFile,
  type Patient,
} from "@/lib/clinic/model";

type ClinicState = {
  tenantId: string | null;
  configs: Record<string, ClinicConfig>;
  patients: Patient[];
  appointments: Appointment[];
  proEmail: string;
  proCode: string;
  proOpen: boolean;
  enter: (tenantId: string) => void;
  leave: () => void;
  saveConfig: (patch: Partial<ClinicConfig>) => void;
  createProfessional: (email: string) => string;
  unlockProfessional: (code: string) => boolean;
  lockProfessional: () => void;
  addPatient: (input: Omit<Patient, "id" | "status">) => string;
  updatePatient: (id: string, patch: Partial<Omit<Patient, "id">>) => void;
  addAppointment: (input: Omit<Appointment, "id" | "documentos" | "notas" | "medicamentoRascunho" | "posologia"> & { documentos?: DocFile[]; id?: string }) => string;
  updateAppointment: (id: string, patch: Partial<Omit<Appointment, "id">>) => void;
  importBooking: (ticket: BookingTicket) => boolean;
  confirmByTicket: (id: string) => boolean;
  resetDemo: () => void;
};

const empty = buildSeed();

export const useClinic = create<ClinicState>()(
  persist(
    (set, get) => ({
      tenantId: "CL001",
      configs: DEFAULT_CONFIGS,
      patients: empty.patients,
      appointments: empty.appointments,
      proEmail: "",
      proCode: "",
      proOpen: false,
      enter: (tenantId) => set({ tenantId }),
      leave: () => set({ tenantId: null }),
      saveConfig: (patch) => {
        const id = get().tenantId ?? "CL001";
        const current = get().configs[id] ?? DEFAULT_CONFIGS[id] ?? { email: "", whatsapp: "" };
        set({ configs: { ...get().configs, [id]: { ...current, ...patch } } });
      },
      createProfessional: (email) => {
        const code = makeAccessCode();
        const clean = email.trim().toLowerCase();
        const id = get().tenantId ?? "CL001";
        const current = get().configs[id] ?? DEFAULT_CONFIGS[id] ?? { email: "", whatsapp: "" };
        set({
          tenantId: id,
          proEmail: clean,
          proCode: code,
          proOpen: false,
          configs: { ...get().configs, [id]: { ...current, email: clean } },
        });
        return code;
      },
      unlockProfessional: (code) => {
        const ok = Boolean(get().proCode) && get().proCode === code.trim();
        if (ok) set({ proOpen: true, tenantId: get().tenantId ?? "CL001" });
        return ok;
      },
      lockProfessional: () => set({ proOpen: false }),
      addPatient: (input) => {
        const id = nid("P");
        const patient: Patient = { ...input, id, status: "Ativo" };
        set({ patients: [...get().patients, patient] });
        return id;
      },
      updatePatient: (id, patch) =>
        set({
          patients: get().patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
      addAppointment: (input) => {
        const id = input.id ?? nid("A");
        const appointment: Appointment = {
          notas: "",
          medicamentoRascunho: "",
          posologia: "",
          documentos: input.documentos ?? [],
          ...input,
          id,
        };
        set({ appointments: [...get().appointments, appointment] });
        return id;
      },
      updateAppointment: (id, patch) =>
        set({
          appointments: get().appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }),
      importBooking: (ticket) => {
        if (get().appointments.some((a) => a.id === ticket.id)) return false;
        const phone = ticket.telefone.replace(/\D/g, "");
        const known = get().patients.find((p) => phone && p.telefone.replace(/\D/g, "") === phone);
        const patientId = known?.id ?? nid("P");
        const patients = known
          ? get().patients
          : [
              ...get().patients,
              {
                id: patientId,
                nome: ticket.nome,
                nascimento: "",
                telefone: phone,
                email: ticket.email,
                status: "Ativo" as const,
                alergias: "",
                consentimentoTelemedicina: true,
              },
            ];
        const appointment: Appointment = {
          id: ticket.id,
          patientId,
          data: ticket.data,
          hora: ticket.hora,
          tipo: ticket.tipo,
          status: "Pendente",
          sintomas: "",
          medicamentos: "",
          alergias: "",
          notas: "",
          medicamentoRascunho: "",
          posologia: "",
          documentos: [],
        };
        set({ patients, appointments: [...get().appointments, appointment] });
        return true;
      },
      confirmByTicket: (id) => {
        if (!get().appointments.some((a) => a.id === id)) return false;
        set({
          appointments: get().appointments.map((a) => (a.id === id ? { ...a, status: "Confirmado" } : a)),
        });
        return true;
      },
      resetDemo: () => {
        set({
          patients: [],
          appointments: [],
          configs: DEFAULT_CONFIGS,
          proEmail: "",
          proCode: "",
          proOpen: false,
          tenantId: "CL001",
        });
      },
    }),
    {
      name: "clinic-saas-mvp",
      version: 2,
      skipHydration: true,
      migrate: () => ({
        tenantId: "CL001",
        configs: DEFAULT_CONFIGS,
        patients: [],
        appointments: [],
        proEmail: "",
        proCode: "",
        proOpen: false,
      }),
      partialize: (s) => ({
        tenantId: s.tenantId,
        configs: s.configs,
        patients: s.patients,
        appointments: s.appointments,
        proEmail: s.proEmail,
        proCode: s.proCode,
        proOpen: s.proOpen,
      }),
    },
  ),
);