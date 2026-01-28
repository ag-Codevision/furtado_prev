
export interface NavItem {
  icon: string;
  label: string;
  path: string;
}

export interface Case {
  id: string;
  client: string;
  subject: string;
  status: string; // Changed to string to support flexible Kanban columns
  deadline: string;
  responsible: string;
  responsibleAvatar: string;
  value?: string; // Valor da causa
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface Client {
  id: string;
  name: string;
  role: string;
  company: string;
  status: string; // Permite flexibilidade de status
  avatar?: string;
  initials?: string;
  color?: string;
  email?: string;
  phone?: string;
  location?: string;
  cpf?: string;
  cnpj?: string;
  age?: string;
  phones?: { cell: string; res?: string; com?: string };
  // Campos Previdenciários
  pis?: string;
  nb?: string;
  motherName?: string;
  inssPassword?: string;
  dependents?: { name: string; relation: string; birthDate?: string; cpf?: string }[];
  cnisLinks?: { company: string; entryDate: string; exitDate?: string; type: string; status: 'Validado' | 'Pendente' }[];
  docsChecklist?: { name: string; status: 'Validado' | 'Pendente' | 'Faltando' | 'Opcional'; mandatory: boolean; icon: string }[];
  // Campos de Controle
  time?: string;
  active?: boolean;
  online?: boolean;
  grayscale?: boolean;
  lastContact?: string;
  isFavorite?: boolean;

  // Novos campos para relatórios
  process?: { number: string; type: string };
  acquisitionChannel?: string; // Forma de fechamento / Tráfego
  registrationDate?: string; // Data de cadastro (ISO)

  // Financeiro
  fees?: ClientFees;
  payments?: Payment[];

  documentConferences?: {
    processType: string;
    documents: {
      id: string;
      name: string;
      isDelivered: boolean;
    }[];
  }[];
}

export interface Payment {
  id: string;
  clientId: string;
  installmentNumber: number;
  dueDate: string;
  paidDate?: string;
  value: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  method: string;
}

export interface ClientFees {
  monthly?: {
    value: string; // "R$ 1.000,00"
    installments: string; // "12"
    dueDate: string; // "10" (Day of month)
    startDate?: string; // "2024-01-01"
    paymentMethod: string;
    description?: string;
  };
  initial?: {
    value: string;
    installments: string;
    dueDate: string;
    paymentMethod: string;
  };
  success?: {
    percentage: string;
    calculationBase: string;
    minValue: string;
  };
}

export interface ServiceCard {
  id: string;
  clientId?: string; // Vínculo com o cliente na base
  leadName: string;
  leadAvatar?: string;
  leadPhone: string;
  source: 'Instagram' | 'Google' | 'Indicação' | 'Site' | 'Passante';
  serviceType: string; // Ex: Aposentadoria, Revisão
  status: string; // ID da coluna
  lastInteraction: string;
  valueEst?: string; // Valor estimado de honorários
  temperature: 'hot' | 'warm' | 'cold'; // Para indicar probabilidade de fechamento
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'Audiência' | 'Prazo Fatal' | 'Reunião' | 'Outro';
  description: string;
  isUrgent?: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  count: number;
}

export interface AgendaEvent {
  id: string;
  title: string;
  date: string; // ISO date format YYYY-MM-DD
  time?: string;
  type: string;
  description?: string;
  responsibleId?: string; // Vínculo com membro da equipe
  clientId?: string; // Vínculo com cliente
  location?: string;
  nb?: string; // Para perícias
}

export interface AgendaCategory {
  id: string;
  label: string;
  color: string;
}

export interface Task {
  id: string;
  title: string; // Trello-style Task Name
  description: string; // Trello-style Description
  processNumber?: string;
  clientName?: string;
  location?: string;
  fatalDeadline?: string;
  internalDeadline?: string;
  instructions?: string;
  responsible: {
    name: string;
    avatar: string;
  };
  status: string;
  dialogue: Array<{
    author: string;
    text: string;
    date: string;
  }>;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: 'Jurídico' | 'RH' | 'Financeiro' | 'Marketing' | 'Administrativo' | 'Outro';
  email: string;
  phone: string;
  avatar: string;
  status: 'Ativo' | 'Férias' | 'Inativo';
  oab?: string; // Opcional para advogados
  admissionDate: string;
  bio?: string;
}

export interface Decision {
  id: string;
  processNumber: string;
  judgmentDate: string;
  location: string;
  decisionType: 'procedente' | 'improcedente' | 'provido' | 'desprovido' | 'parcialmente provido' | 'parcialmente procedente' | 'nao reconhecido' | 'outro';
  opponent?: string; // Parte contrária (SUS ou Plano de Saúde)
  fundamentals: string;
}

export interface CourtLocation {
  id: string;
  name: string;
  created_at?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'in' | 'out';
  title: string;
  value: number;
  category: string;
  date: string; // ISO format YYYY-MM-DD
  status: 'confirmado' | 'pendente';
  clientId?: string;
  installmentNumber?: number;
  createdAt?: string;
  createdBy?: string;
}
