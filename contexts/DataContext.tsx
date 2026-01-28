import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember, Task, KanbanColumn, Client, AgendaEvent, AgendaCategory, Decision, ServiceCard, CourtLocation, FinancialTransaction } from '../types';

interface DataContextType {
    // Members
    teamMembers: TeamMember[];
    addMember: (member: TeamMember) => void;
    updateMember: (member: TeamMember) => void;
    deleteMember: (id: string) => void;

    // Tasks
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    columns: KanbanColumn[];
    fetchTasksData: () => Promise<void>;
    addTaskColumn: (column: KanbanColumn) => Promise<void>;
    updateTaskColumn: (column: KanbanColumn) => Promise<void>;
    deleteTaskColumn: (id: string) => Promise<void>;
    reorderTaskColumns: (columns: KanbanColumn[]) => Promise<void>;
    reorderTasks: (columnId: string, tasks: Task[]) => Promise<void>;
    updateColumns: (columns: KanbanColumn[]) => void;

    // Clients
    clients: Client[];
    totalClientsCount: number;
    currentPage: number;
    isLoadingClients: boolean;
    fetchClients: (page?: number, searchQuery?: string) => Promise<void>;
    addClient: (client: Client) => void;
    updateClient: (clientOrId: Client | string, partialData?: any) => void;
    deleteClient: (id: string) => void;
    calculateCompleteness: (client: Client) => { percent: number; missingCount: number };
    preloadAllData: () => Promise<void>;

    // Agenda
    events: AgendaEvent[];
    categories: AgendaCategory[];
    addEvent: (event: AgendaEvent) => Promise<void>;
    updateEvent: (event: AgendaEvent) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    addCategory: (category: AgendaCategory) => Promise<void>;
    updateCategory: (category: AgendaCategory) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    // Decisions
    decisions: Decision[];
    addDecision: (decision: Decision) => void;
    updateDecision: (decision: Decision) => void;
    deleteDecision: (id: string) => void;
    courtLocations: CourtLocation[];
    addCourtLocation: (location: string) => Promise<void>;
    updateCourtLocation: (id: string, name: string) => Promise<void>;
    deleteCourtLocation: (id: string) => Promise<void>;
    transactions: FinancialTransaction[];
    addTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => Promise<void>;
    updateTransaction: (transaction: FinancialTransaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    // CRM
    crmColumns: KanbanColumn[];
    crmLeads: ServiceCard[];
    fetchCRMData: () => Promise<void>;
    addCRMColumn: (column: KanbanColumn) => Promise<void>;
    updateCRMColumn: (column: KanbanColumn) => Promise<void>;
    deleteCRMColumn: (id: string) => Promise<void>;
    addCRMLead: (lead: ServiceCard) => Promise<void>;
    updateCRMLead: (lead: ServiceCard) => Promise<void>;
    deleteCRMLead: (id: string) => Promise<void>;
    reorderCRMColumns: (columns: KanbanColumn[]) => Promise<void>;
    reorderCRMLeads: (columnId: string, leads: ServiceCard[]) => Promise<void>;
    dashboardStats: { total: number; active: number; pending: number };
    fetchDashboardStats: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- INITIAL MOCK DATA (For defaults/fallbacks) ---
const initialTasks: Task[] = [
    {
        id: '1',
        title: 'Réplica à Contestação - João da Silva',
        description: 'Elaborar réplica focando no período rural de 1985 a 1990.',
        processNumber: '5001234-56.2023.4.04.7000',
        clientName: 'João da Silva',
        location: '1ª Vara Federal de Curitiba',
        fatalDeadline: '2023-12-25',
        internalDeadline: '2023-12-20',
        responsible: { name: 'Thalia Santos', avatar: 'https://i.pravatar.cc/150?img=32' },
        status: 'producao',
        dialogue: [{ author: 'Dr. Silva', text: 'Thalia, atenção aos documentos da folha 45.', date: '2023-12-10 14:00' }]
    }
];

const initialColumns: KanbanColumn[] = [
    { id: 'afazer', title: 'A Fazer', color: 'bg-slate-400', count: 0 },
    { id: 'producao', title: 'Em Produção', color: 'bg-blue-500', count: 0 },
    { id: 'revisao', title: 'Para Revisão', color: 'bg-amber-500', count: 0 },
    { id: 'finalizado', title: 'Finalizado', color: 'bg-emerald-500', count: 0 },
];

const initialEvents: AgendaEvent[] = [
    {
        id: 'e1',
        title: 'Perícia Médica - Sr. João',
        date: '2023-11-05',
        time: '09:00',
        type: 'Perícias',
        location: 'APS Centro - Sala 4',
        nb: '123.456.789-0'
    }
];

const initialCategories: AgendaCategory[] = [
    { id: '1', label: 'Perícias', color: 'amber' },
    { id: '2', label: 'Prazos', color: 'red' },
    { id: '3', label: 'Audiências', color: 'purple' },
    { id: '4', label: 'Dra Rosana', color: 'pink' },
    { id: '5', label: 'Outro', color: 'slate' },
];

// --- CACHE HELPERS ---
const CACHE_PREFIX = 'furtado_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const clearOldCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Cache] Cleared ${keysToRemove.length} old cache entries`);
};

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
        console.log(`[Cache] Saved ${key} to cache`);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            console.warn(`[Cache] Quota exceeded, clearing old cache and retrying...`);
            clearOldCache();
            try {
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
                console.log(`[Cache] Saved ${key} after clearing old cache`);
            } catch (e2) {
                console.warn(`[Cache] Still failed to save ${key}, skipping cache`);
            }
        } else {
            console.warn('Failed to save to cache:', e);
        }
    }
};

const getFromCache = <T,>(key: string): T | null => {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (!cached) {
            console.log(`[Cache] No cache found for ${key}`);
            return null;
        }
        const { data, timestamp } = JSON.parse(cached);
        console.log(`[Cache] Loaded ${key} from cache (${Array.isArray(data) ? data.length + ' items' : 'object'})`);
        return data as T;
    } catch (e) {
        console.warn(`[Cache] Error loading ${key}:`, e);
        return null;
    }
};

// --- MAIN PROVIDER COMPONENT ---
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- STATE DEFINITIONS ---
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => getFromCache('teamMembers') || []);
    const [tasks, setTasks] = useState<Task[]>(() => getFromCache('tasks') || []);
    const [columns, setColumns] = useState<KanbanColumn[]>(() => getFromCache('columns') || []);
    // Clients are NOT cached due to localStorage quota limits - too large
    const [clients, setClients] = useState<Client[]>([]);
    const [totalClientsCount, setTotalClientsCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [decisions, setDecisions] = useState<Decision[]>(() => getFromCache('decisions') || []);
    const [crmColumns, setCrmColumns] = useState<KanbanColumn[]>(() => getFromCache('crmColumns') || []);
    const [crmLeads, setCrmLeads] = useState<ServiceCard[]>(() => getFromCache('crmLeads') || []);
    const [courtLocations, setCourtLocations] = useState<CourtLocation[]>(() => getFromCache('courtLocations') || []);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => getFromCache('transactions') || []);
    const [dashboardStats, setDashboardStats] = useState(() => getFromCache('dashboardStats') || { total: 0, active: 0, pending: 0 });
    const [isPreloading, setIsPreloading] = useState(false);

    // Agenda still uses LocalStorage as per previous state
    const [events, setEvents] = useState<AgendaEvent[]>(() => getFromCache('events') || []);
    const [categories, setCategories] = useState<AgendaCategory[]>(() => getFromCache('categories') || []);

    // --- MAPPING HELPERS ---
    const mapClientRow = (row: any): Client => {
        const data = row.data || {};
        return {
            ...data,
            id: row.id,
            name: row.name,
            status: row.status,
            role: row.role,
            location: row.location,
            avatar: row.avatar_url,
            isFavorite: row.is_favorite,
            registrationDate: row.registration_date,
            cpf: row.cpf_cnpj,
            company: row.company_type,
            active: data.active ?? row.active ?? false
        };
    };

    const mapTaskRow = (row: any): Task => ({
        id: row.id,
        title: row.title,
        description: row.description,
        processNumber: row.process_number,
        clientName: row.client_name,
        location: row.location,
        fatalDeadline: row.fatal_deadline,
        internalDeadline: row.internal_deadline,
        responsible: {
            name: row.responsible_name,
            avatar: row.responsible_avatar
        },
        status: row.column_id,
        dialogue: row.dialogue || []
    });

    const mapTaskColumnRow = (row: any): KanbanColumn => ({
        id: row.id,
        title: row.title,
        color: row.color,
        count: 0
    });

    const mapTeamMemberRow = (row: any): TeamMember => ({
        id: row.id,
        name: row.name,
        role: row.role,
        department: row.department,
        email: row.email,
        phone: row.phone,
        avatar: row.avatar,
        status: row.status,
        oab: row.oab,
        admissionDate: row.admission_date,
        bio: row.bio
    });

    const mapDecisionRow = (row: any): Decision => ({
        id: row.id,
        processNumber: row.process_number,
        judgmentDate: row.judgment_date,
        location: row.location,
        decisionType: row.decision_type,
        opponent: row.opponent,
        fundamentals: row.fundamentals
    });

    const mapCourtLocationRow = (row: any): CourtLocation => ({
        id: row.id,
        name: row.name,
        created_at: row.created_at
    });

    const mapTransactionRow = (row: any): FinancialTransaction => ({
        id: row.id,
        type: row.type,
        title: row.title,
        value: Number(row.value),
        category: row.category,
        date: row.date,
        status: row.status,
        clientId: row.client_id,
        installmentNumber: row.installment_number,
        createdAt: row.created_at,
        createdBy: row.created_by
    });

    const mapAgendaCategoryRow = (row: any): AgendaCategory => ({
        id: row.id,
        label: row.label,
        color: row.color
    });

    const mapAgendaEventRow = (row: any): AgendaEvent => ({
        id: row.id,
        title: row.title,
        date: row.date,
        time: row.time,
        type: row.type,
        description: row.description,
        location: row.location,
        nb: row.nb,
        responsibleId: row.responsible_id,
        clientId: row.client_id
    });

    // --- FETCHING FUNCTIONS ---
    const pageSize = 20;

    const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
            try {
                const result = await fn();
                if (result.error) throw result.error;
                return result;
            } catch (err) {
                if (i === retries - 1) throw err;
                console.warn(`Retry ${i + 1}/${retries} failed. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    const fetchClients = async (page = 1, searchQuery = '') => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        setIsLoadingClients(true);
        try {
            const result = await fetchWithRetry(async () => {
                let query = supabase
                    .from('clients')
                    .select('*', { count: 'exact' });

                if (searchQuery) {
                    query = query.or(`name.ilike.%${searchQuery}%,cpf_cnpj.ilike.%${searchQuery}%`);
                }

                return await query
                    .order('registration_date', { ascending: false })
                    .range(from, to);
            });

            if (result && result.data) {
                const mappedClients = result.data.map(mapClientRow);
                setClients(mappedClients);
                if (result.count !== null) {
                    setTotalClientsCount(result.count);
                }
                setCurrentPage(page);
            }
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setIsLoadingClients(false);
        }
    };

    const preloadAllData = async () => {
        if (isPreloading) return;
        setIsPreloading(true);
        console.log('Preloading all data for faster interaction...');
        const functions = [
            { name: 'Clients', fn: () => fetchClients(1) },
            { name: 'Tasks', fn: fetchTasksData },
            { name: 'Team', fn: fetchTeamMembers },
            { name: 'Decisions', fn: fetchDecisions },
            { name: 'CRM', fn: fetchCRMData },
            { name: 'Agenda', fn: fetchAgendaData },
            { name: 'Court Locations', fn: fetchCourtLocations },
            { name: 'Transactions', fn: fetchTransactions },
            { name: 'Dashboard Stats', fn: fetchDashboardStats }
        ];

        try {
            await Promise.allSettled(functions.map(async ({ name, fn }) => {
                try {
                    await fn();
                } catch (err) {
                    console.error(`Failed to preload ${name}:`, err);
                }
            }));
            console.log('Data preloading process completed.');
        } catch (err) {
            console.error('Unexpected error during data preloading:', err);
        } finally {
            setIsPreloading(false);
        }
    };

    const fetchTasksData = async () => {
        try {
            const { data: cols, error: colsErr } = await supabase
                .from('task_columns')
                .select('*')
                .order('position', { ascending: true });
            if (colsErr) throw colsErr;

            const { data: taskRows, error: tasksErr } = await supabase
                .from('tasks')
                .select('*')
                .order('position', { ascending: true });
            if (tasksErr) throw tasksErr;

            if (cols) {
                if (cols.length === 0) {
                    const { data: seededCols, error: seedErr } = await supabase
                        .from('task_columns')
                        .insert(initialColumns.map((c, i) => ({ title: c.title, color: c.color, position: i })))
                        .select();
                    if (!seedErr && seededCols) setColumns(seededCols.map(mapTaskColumnRow));
                } else {
                    const mappedCols = cols.map(mapTaskColumnRow);
                    setColumns(mappedCols);
                    saveToCache('columns', mappedCols);
                }
            }
            if (taskRows) {
                const mappedTasks = taskRows.map(mapTaskRow);
                setTasks(mappedTasks);
                saveToCache('tasks', mappedTasks);
            }
        } catch (err) {
            console.error('Error fetching tasks data:', err);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            if (data) {
                const mapped = data.map(mapTeamMemberRow);
                setTeamMembers(mapped);
                saveToCache('teamMembers', mapped);
            }
        } catch (err) {
            console.error('Error fetching team members:', err);
        }
    };

    const fetchDecisions = async () => {
        try {
            const { data, error } = await supabase
                .from('decisions')
                .select('*')
                .order('judgment_date', { ascending: false });
            if (error) throw error;
            if (data) {
                const mapped = data.map(mapDecisionRow);
                setDecisions(mapped);
                saveToCache('decisions', mapped);
            }
        } catch (err) {
            console.error('Error fetching decisions:', err);
        }
    };

    const fetchCRMData = async () => {
        try {
            const { data: cols, error: colsErr } = await supabase.from('crm_columns').select('*').order('position', { ascending: true });
            if (colsErr) throw colsErr;
            const { data: leads, error: leadsErr } = await supabase.from('crm_leads').select('*').order('position', { ascending: true });
            if (leadsErr) throw leadsErr;

            if (cols) setCrmColumns(cols.map(c => ({ id: c.id, title: c.title, color: c.color, count: 0 })));
            if (leads) setCrmLeads(leads.map(l => ({
                id: l.id,
                clientId: l.client_id,
                leadName: l.lead_name,
                leadAvatar: l.lead_avatar,
                leadPhone: l.lead_phone,
                source: l.source,
                serviceType: l.service_type,
                status: l.column_id,
                temperature: l.temperature,
                lastInteraction: l.last_interaction,
                valueEst: l.value_est
            })));
        } catch (err) {
            console.error('Error fetching CRM data:', err);
        }
    };

    const fetchAgendaData = async () => {
        try {
            const { data: cats, error: catsErr } = await supabase.from('agenda_categories').select('*').order('label', { ascending: true });
            if (catsErr) throw catsErr;

            const { data: evts, error: evtsErr } = await supabase.from('agenda_events').select('*').order('date', { ascending: true });
            if (evtsErr) throw evtsErr;

            if (cats) {
                if (cats.length === 0) {
                    const { data: seededCats, error: seedErr } = await supabase
                        .from('agenda_categories')
                        .insert(initialCategories.map(c => ({ label: c.label, color: c.color })))
                        .select();
                    if (!seedErr && seededCats) setCategories(seededCats.map(mapAgendaCategoryRow));
                } else {
                    setCategories(cats.map(mapAgendaCategoryRow));
                }
            }
            if (evts) setEvents(evts.map(mapAgendaEventRow));
        } catch (err) {
            console.error('Error fetching agenda data:', err);
        }
    };

    const fetchCourtLocations = async () => {
        try {
            const { data, error } = await supabase
                .from('court_locations')
                .select('*')
                .order('name', { ascending: true });
            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('relation "court_locations" does not exist')) {
                    console.warn('Table court_locations does not exist yet.');
                    return;
                }
                throw error;
            }
            if (data) setCourtLocations(data.map(mapCourtLocationRow));
        } catch (err) {
            console.error('Error fetching court locations:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .order('date', { ascending: false });
            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('relation "financial_transactions" does not exist')) {
                    console.warn('Table financial_transactions does not exist yet.');
                    return;
                }
                throw error;
            }
            if (data) setTransactions(data.map(mapTransactionRow));
        } catch (err) {
            console.error('Error fetching transactions:', err);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            // Count Total
            const { count: total, error: errTotal } = await supabase.from('clients').select('*', { count: 'exact', head: true });

            // Count Active - Since 'active' is inside JSONB 'data', we use partial filtering if possible, 
            // but for safety and exactness we might need a RPC or just fetch all 'data' fields for counts.
            // However, Supabase allows filtering on JSONB: .filter('data->>active', 'eq', 'true')
            const { count: active, error: errActive } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .filter('data->>active', 'eq', 'true');

            // Count Pending (missing docs) - We look for any checklist items that are 'Faltando' or 'Pendente'
            // This is complex for a single head count query, so we'll use a specific condition if possible 
            // or just count those with 'Pendente' status for now, BUT for accuracy we'll fetch only the count of status 'Pendente'
            // and maybe later add a specialized RPC for document pendencies.
            // For now, let's keep status 'Pendente' but also check for a 'has_pendency' flag if we add it.
            // ACTUALLY, let's just count 'Pendente' status for now since that's a top level column.
            const { count: pending, error: errPending } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Pendente');

            if (errTotal || errActive || errPending) throw (errTotal || errActive || errPending);

            const stats = {
                total: total || 0,
                active: active || 0,
                pending: pending || 0
            };
            setDashboardStats(stats);
            saveToCache('dashboardStats', stats);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        }
    };

    const clearAllData = () => {
        setTeamMembers([]);
        setTasks([]);
        setColumns([]);
        setClients([]);
        setTotalClientsCount(0);
        setCurrentPage(1);
        setDecisions([]);
        setCrmColumns([]);
        setCrmLeads([]);
        setCourtLocations([]);
        setTransactions([]);
        setDashboardStats({ total: 0, active: 0, pending: 0 });
        setEvents([]);

        // Clear cache on logout
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    };

    // --- INITIALIZATION & AUTH LISTENER ---
    useEffect(() => {
        // Check for existing session on mount (handles page refresh)
        const checkInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('Found existing session on mount, preloading data...');
                preloadAllData();
            }
        };
        checkInitialSession();

        // Set up auth state change listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            if (event === 'SIGNED_IN') {
                if (session) {
                    preloadAllData();
                }
            } else if (event === 'SIGNED_OUT') {
                clearAllData();
            }
        });

        return () => subscription.unsubscribe();
    }, []);



    // --- CRUD ACTIONS ---

    // Team Actions
    const addMember = async (member: TeamMember) => {
        try {
            const { data, error } = await supabase.from('team_members').insert({
                name: member.name, role: member.role, department: member.department,
                email: member.email, phone: member.phone, avatar: member.avatar,
                status: member.status, oab: member.oab, admission_date: member.admissionDate, bio: member.bio
            }).select().single();
            if (error) throw error;
            if (data) setTeamMembers(prev => [...prev, mapTeamMemberRow(data)]);
        } catch (err) { console.error('Error adding team member:', err); }
    };
    const updateMember = async (member: TeamMember) => {
        try {
            const { data, error } = await supabase.from('team_members').update({
                name: member.name, role: member.role, department: member.department,
                email: member.email, phone: member.phone, avatar: member.avatar,
                status: member.status, oab: member.oab, admission_date: member.admissionDate, bio: member.bio
            }).eq('id', member.id).select().single();
            if (error) throw error;
            if (data) setTeamMembers(prev => prev.map(m => m.id === member.id ? mapTeamMemberRow(data) : m));
        } catch (err) { console.error('Error updating team member:', err); }
    };
    const deleteMember = async (id: string) => {
        try {
            const { error } = await supabase.from('team_members').delete().eq('id', id);
            if (error) throw error;
            setTeamMembers(prev => prev.filter(m => m.id !== id));
        } catch (err) { console.error('Error deleting team member:', err); }
    };

    // Task Actions
    const addTask = async (task: Task) => {
        try {
            const colTasks = tasks.filter(t => t.status === task.status);
            const { data, error } = await supabase.from('tasks').insert({
                column_id: task.status, title: task.title, description: task.description,
                process_number: task.processNumber, client_name: task.clientName,
                location: task.location, fatal_deadline: task.fatalDeadline,
                internal_deadline: task.internalDeadline, responsible_name: task.responsible.name,
                responsible_avatar: task.responsible.avatar, dialogue: task.dialogue, position: colTasks.length
            }).select().single();
            if (error) throw error;
            if (data) setTasks(prev => [...prev, mapTaskRow(data)]);
        } catch (err) { console.error('Error adding task:', err); }
    };
    const updateTask = async (task: Task) => {
        try {
            const { error } = await supabase.from('tasks').update({
                column_id: task.status, title: task.title, description: task.description,
                process_number: task.processNumber, client_name: task.clientName,
                location: task.location, fatal_deadline: task.fatalDeadline,
                internal_deadline: task.internalDeadline, responsible_name: task.responsible.name,
                responsible_avatar: task.responsible.avatar, dialogue: task.dialogue
            }).eq('id', task.id);
            if (error) throw error;
            setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        } catch (err) { console.error('Error updating task:', err); }
    };
    const deleteTask = async (id: string) => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err) { console.error('Error deleting task:', err); }
    };
    const addTaskColumn = async (column: KanbanColumn) => {
        try {
            const { data, error } = await supabase.from('task_columns').insert({ title: column.title, color: column.color, position: columns.length }).select().single();
            if (error) throw error;
            if (data) setColumns(prev => [...prev, mapTaskColumnRow(data)]);
        } catch (err) { console.error('Error adding task column:', err); }
    };
    const updateTaskColumn = async (column: KanbanColumn) => {
        try {
            const { error } = await supabase.from('task_columns').update({ title: column.title, color: column.color }).eq('id', column.id);
            if (error) throw error;
            setColumns(prev => prev.map(c => c.id === column.id ? column : c));
        } catch (err) { console.error('Error updating task column:', err); }
    };
    const deleteTaskColumn = async (id: string) => {
        try {
            const { error } = await supabase.from('task_columns').delete().eq('id', id);
            if (error) throw error;
            setColumns(prev => prev.filter(c => c.id !== id));
            setTasks(prev => prev.filter(t => t.status !== id));
        } catch (err) { console.error('Error deleting task column:', err); }
    };
    const reorderTaskColumns = async (cols: KanbanColumn[]) => {
        setColumns(cols);
        try {
            const updates = cols.map((col, idx) => supabase.from('task_columns').update({ position: idx }).eq('id', col.id));
            await Promise.all(updates);
        } catch (err) { console.error('Error reordering task columns:', err); }
    };
    const reorderTasks = async (columnId: string, taskList: Task[]) => {
        const otherTasks = tasks.filter(t => !taskList.some(nt => nt.id === t.id));
        const updatedTasks = [...otherTasks, ...taskList.map((t, idx) => ({ ...t, status: columnId }))];
        setTasks(updatedTasks);
        try {
            const updates = taskList.map((task, idx) => supabase.from('tasks').update({ column_id: columnId, position: idx }).eq('id', task.id));
            await Promise.all(updates);
        } catch (err) { console.error('Error reordering tasks:', err); }
    };
    const updateColumns = (cols: KanbanColumn[]) => setColumns(cols);

    // Client Actions
    const addClient = async (client: Client) => {
        const tempId = `temp-${Date.now()}`;
        setClients(prev => [{ ...client, id: tempId, registrationDate: new Date().toISOString() }, ...prev]);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.from('clients').insert({
                name: client.name, cpf_cnpj: client.cpf || client.cnpj, status: client.status,
                role: client.role, location: client.location, company_type: client.company,
                avatar_url: client.avatar, is_favorite: client.isFavorite, data: client, created_by: session?.user?.id
            }).select().single();
            if (error) throw error;
            if (data) {
                setClients(prev => prev.map(c => c.id === tempId ? mapClientRow(data) : c));
                fetchDashboardStats();
                fetchClients(1);
            }
        } catch (err) {
            console.error('Error adding client:', err);
            setClients(prev => prev.filter(c => c.id !== tempId));
        }
    };
    const updateClient = async (clientOrId: Client | string, partialData?: any) => {
        let clientToUpdate: Client;
        if (typeof clientOrId === 'string') {
            const existing = clients.find(c => c.id === clientOrId);
            if (!existing) return;
            clientToUpdate = { ...existing, ...partialData };
        } else { clientToUpdate = clientOrId; }
        const oldClients = [...clients];
        setClients(prev => prev.map(c => c.id === clientToUpdate.id ? clientToUpdate : c));
        try {
            const { data, error } = await supabase.from('clients').update({
                name: clientToUpdate.name, cpf_cnpj: clientToUpdate.cpf || clientToUpdate.cnpj,
                status: clientToUpdate.status, role: clientToUpdate.role, location: clientToUpdate.location,
                company_type: clientToUpdate.company, avatar_url: clientToUpdate.avatar,
                is_favorite: clientToUpdate.isFavorite, data: clientToUpdate
            }).eq('id', clientToUpdate.id).select().single();
            if (error) throw error;
            if (data) {
                setClients(prev => prev.map(c => c.id === data.id ? mapClientRow(data) : c));
                fetchDashboardStats();
                fetchClients(currentPage);
            }
        } catch (err) { console.error('Error updating client:', err); setClients(oldClients); }
    };
    const deleteClient = async (id: string) => {
        try {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
            setClients(prev => prev.filter(c => c.id !== id));
            fetchDashboardStats();
            fetchClients(currentPage);
        } catch (err) { console.error('Error deleting client:', err); }
    };

    const calculateCompleteness = (client: Client) => {
        const categories = {
            personal: { weight: 0.3, fields: ['name', 'cpf', 'rg', 'birthDate', 'motherName', 'nacionalidade', 'estadoCivil', 'profissao', 'escolaridade', 'origin'] },
            contact: { weight: 0.2, fields: ['phones.cell', 'email1', 'address.cep', 'address.street', 'address.neighborhood', 'address.city', 'address.uf'] },
            process: { weight: 0.3, fields: ['process.type', 'process.number', 'process.object', 'process.status', 'healthInfo.cid'] },
            financial: { weight: 0.2, fields: ['bankAccount.bank', 'bankAccount.agency', 'bankAccount.account', 'fees.monthly.value'] }
        };
        const getValue = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
        let totalPercent = 0;
        let missingCount = 0;
        Object.values(categories).forEach(cat => {
            const completedInCat = cat.fields.filter(f => {
                const val = getValue(client, f);
                const isPopulated = val && val !== '' && val !== 'N/A' && val !== 'Sem CPF' && val !== '00.000.000/0000-00' && val !== 'R$ 0,00' && val !== '0,00';
                if (!isPopulated) missingCount++;
                return isPopulated;
            });
            totalPercent += (completedInCat.length / cat.fields.length) * 100 * cat.weight;
        });
        return { percent: Math.round(totalPercent), missingCount };
    };

    // Agenda Actions
    const addEvent = async (event: AgendaEvent) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.from('agenda_events').insert({
                title: event.title, date: event.date, time: event.time, type: event.type,
                description: event.description, location: event.location, nb: event.nb,
                responsible_id: event.responsibleId, client_id: event.clientId, created_by: session?.user?.id
            }).select().single();
            if (error) throw error;
            if (data) setEvents(prev => [...prev, mapAgendaEventRow(data)]);
        } catch (err) { console.error('Error adding agenda event:', err); }
    };
    const updateEvent = async (event: AgendaEvent) => {
        try {
            const { data, error } = await supabase.from('agenda_events').update({
                title: event.title, date: event.date, time: event.time, type: event.type,
                description: event.description, location: event.location, nb: event.nb,
                responsible_id: event.responsibleId, client_id: event.clientId
            }).eq('id', event.id).select().single();
            if (error) throw error;
            if (data) setEvents(prev => prev.map(e => e.id === event.id ? mapAgendaEventRow(data) : e));
        } catch (err) { console.error('Error updating agenda event:', err); }
    };
    const deleteEvent = async (id: string) => {
        try {
            const { error } = await supabase.from('agenda_events').delete().eq('id', id);
            if (error) throw error;
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (err) { console.error('Error deleting agenda event:', err); }
    };
    const addCategory = async (category: AgendaCategory) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.from('agenda_categories').insert({
                label: category.label, color: category.color, created_by: session?.user?.id
            }).select().single();
            if (error) throw error;
            if (data) setCategories(prev => [...prev, mapAgendaCategoryRow(data)]);
        } catch (err) { console.error('Error adding agenda category:', err); }
    };
    const updateCategory = async (category: AgendaCategory) => {
        try {
            const { data, error } = await supabase.from('agenda_categories').update({
                label: category.label, color: category.color
            }).eq('id', category.id).select().single();
            if (error) throw error;
            if (data) setCategories(prev => prev.map(c => c.id === category.id ? mapAgendaCategoryRow(data) : c));
        } catch (err) { console.error('Error updating agenda category:', err); }
    };
    const deleteCategory = async (id: string) => {
        try {
            const { error } = await supabase.from('agenda_categories').delete().eq('id', id);
            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err) { console.error('Error deleting agenda category:', err); }
    };

    // Decision Actions
    const addDecision = async (decision: Decision) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.from('decisions').insert({
                process_number: decision.processNumber, judgment_date: decision.judgmentDate,
                location: decision.location, decision_type: decision.decisionType,
                opponent: decision.opponent, fundamentals: decision.fundamentals, created_by: session?.user?.id
            }).select().single();
            if (error) throw error;
            if (data) setDecisions(prev => [mapDecisionRow(data), ...prev]);
        } catch (err) { console.error('Error adding decision:', err); }
    };
    const updateDecision = async (decision: Decision) => {
        try {
            const { data, error } = await supabase.from('decisions').update({
                process_number: decision.processNumber, judgment_date: decision.judgmentDate,
                location: decision.location, decision_type: decision.decisionType,
                opponent: decision.opponent, fundamentals: decision.fundamentals
            }).eq('id', decision.id).select().single();
            if (error) throw error;
            if (data) setDecisions(prev => prev.map(d => d.id === decision.id ? mapDecisionRow(data) : d));
        } catch (err) { console.error('Error updating decision:', err); }
    };
    const deleteDecision = async (id: string) => {
        try {
            const { error } = await supabase.from('decisions').delete().eq('id', id);
            if (error) throw error;
            setDecisions(prev => prev.filter(d => d.id !== id));
        } catch (err) { console.error('Error deleting decision:', err); }
    };

    // CRM Actions
    const addCRMColumn = async (column: KanbanColumn) => {
        try {
            const { data, error } = await supabase.from('crm_columns').insert({ title: column.title, color: column.color, position: crmColumns.length }).select().single();
            if (error) throw error;
            if (data) setCrmColumns(prev => [...prev, { id: data.id, title: data.title, color: data.color, count: 0 }]);
        } catch (err) { console.error('Error adding CRM column:', err); }
    };
    const updateCRMColumn = async (column: KanbanColumn) => {
        try {
            const { error } = await supabase.from('crm_columns').update({ title: column.title, color: column.color }).eq('id', column.id);
            if (error) throw error;
            setCrmColumns(prev => prev.map(c => c.id === column.id ? column : c));
        } catch (err) { console.error('Error updating CRM column:', err); }
    };
    const deleteCRMColumn = async (id: string) => {
        try {
            const { error } = await supabase.from('crm_columns').delete().eq('id', id);
            if (error) throw error;
            setCrmColumns(prev => prev.filter(c => c.id !== id));
            setCrmLeads(prev => prev.filter(l => l.status !== id));
        } catch (err) { console.error('Error deleting CRM column:', err); }
    };
    const addCRMLead = async (lead: ServiceCard) => {
        try {
            const colLeads = crmLeads.filter(l => l.status === lead.status);
            const { data, error } = await supabase.from('crm_leads').insert({
                client_id: lead.clientId, column_id: lead.status, lead_name: lead.leadName,
                lead_avatar: lead.leadAvatar, lead_phone: lead.leadPhone, source: lead.source,
                service_type: lead.serviceType, temperature: lead.temperature, last_interaction: lead.lastInteraction,
                position: colLeads.length, value_est: lead.valueEst
            }).select().single();
            if (error) throw error;
            if (data) setCrmLeads(prev => [...prev, { ...lead, id: data.id }]);
        } catch (err) { console.error('Error adding CRM lead:', err); }
    };
    const updateCRMLead = async (lead: ServiceCard) => {
        try {
            const { error } = await supabase.from('crm_leads').update({
                column_id: lead.status, lead_name: lead.leadName, lead_avatar: lead.leadAvatar,
                lead_phone: lead.leadPhone, source: lead.source, service_type: lead.serviceType,
                temperature: lead.temperature, last_interaction: lead.lastInteraction, value_est: lead.valueEst
            }).eq('id', lead.id);
            if (error) throw error;
            setCrmLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
        } catch (err) { console.error('Error updating CRM lead:', err); }
    };
    const deleteCRMLead = async (id: string) => {
        try {
            const { error } = await supabase.from('crm_leads').delete().eq('id', id);
            if (error) throw error;
            setCrmLeads(prev => prev.filter(l => l.id !== id));
        } catch (err) { console.error('Error deleting CRM lead:', err); }
    };
    const reorderCRMColumns = async (cols: KanbanColumn[]) => {
        setCrmColumns(cols);
        try {
            const updates = cols.map((col, idx) => supabase.from('crm_columns').update({ position: idx }).eq('id', col.id));
            await Promise.all(updates);
        } catch (err) { console.error('Error reordering CRM columns:', err); }
    };
    const reorderCRMLeads = async (columnId: string, leads: ServiceCard[]) => {
        const otherLeads = crmLeads.filter(l => !leads.some(nl => nl.id === l.id));
        const updatedLeads = [...otherLeads, ...leads.map((l, idx) => ({ ...l, status: columnId }))];
        setCrmLeads(updatedLeads);
        try {
            const updates = leads.map((lead, idx) => supabase.from('crm_leads').update({ column_id: columnId, position: idx }).eq('id', lead.id));
            await Promise.all(updates);
        } catch (err) { console.error('Error reordering CRM leads:', err); }
    };

    const addCourtLocation = async (name: string) => {
        try {
            const { data, error } = await supabase
                .from('court_locations')
                .insert({ name })
                .select()
                .single();
            if (error) throw error;
            if (data) setCourtLocations(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            console.error('Error adding court location:', err);
            throw err;
        }
    };

    const updateCourtLocation = async (id: string, name: string) => {
        try {
            const { data, error } = await supabase
                .from('court_locations')
                .update({ name })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            if (data) setCourtLocations(prev => prev.map(loc => loc.id === id ? data : loc).sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            console.error('Error updating court location:', err);
            throw err;
        }
    };

    const deleteCourtLocation = async (id: string) => {
        try {
            const { error } = await supabase
                .from('court_locations')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setCourtLocations(prev => prev.filter(loc => loc.id !== id));
        } catch (err) {
            console.error('Error deleting court location:', err);
            throw err;
        }
    };

    const addTransaction = async (transaction: Omit<FinancialTransaction, 'id'>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase
                .from('financial_transactions')
                .insert({
                    type: transaction.type,
                    title: transaction.title,
                    value: transaction.value,
                    category: transaction.category,
                    date: transaction.date,
                    status: transaction.status,
                    client_id: transaction.clientId,
                    installment_number: transaction.installmentNumber,
                    created_by: session?.user?.id
                })
                .select()
                .single();
            if (error) throw error;
            if (data) setTransactions(prev => [mapTransactionRow(data), ...prev]);
        } catch (err) {
            console.error('Error adding transaction:', err);
            throw err;
        }
    };

    const updateTransaction = async (transaction: FinancialTransaction) => {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .update({
                    type: transaction.type,
                    title: transaction.title,
                    value: transaction.value,
                    category: transaction.category,
                    date: transaction.date,
                    status: transaction.status,
                    client_id: transaction.clientId,
                    installment_number: transaction.installmentNumber
                })
                .eq('id', transaction.id)
                .select()
                .single();
            if (error) throw error;
            if (data) setTransactions(prev => prev.map(t => t.id === transaction.id ? mapTransactionRow(data) : t));
        } catch (err) {
            console.error('Error updating transaction:', err);
            throw err;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            const { error } = await supabase
                .from('financial_transactions')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting transaction:', err);
            throw err;
        }
    };

    return (
        <DataContext.Provider value={{
            teamMembers, addMember, updateMember, deleteMember,
            tasks, setTasks, addTask, updateTask, deleteTask, columns, updateColumns,
            fetchTasksData, addTaskColumn, updateTaskColumn, deleteTaskColumn,
            reorderTaskColumns, reorderTasks,
            totalClientsCount, currentPage, fetchClients, preloadAllData, isLoadingClients,
            clients, addClient, updateClient, deleteClient, calculateCompleteness,
            events, addEvent, updateEvent, deleteEvent,
            categories, addCategory, updateCategory, deleteCategory,
            decisions, addDecision, updateDecision, deleteDecision,
            crmColumns, crmLeads, fetchCRMData, addCRMColumn, updateCRMColumn, deleteCRMColumn,
            addCRMLead, updateCRMLead, deleteCRMLead, reorderCRMColumns, reorderCRMLeads,
            dashboardStats,
            fetchDashboardStats,
            courtLocations, addCourtLocation, updateCourtLocation, deleteCourtLocation,
            transactions, addTransaction, updateTransaction, deleteTransaction
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
