import React, { useState, useMemo, useEffect } from 'react';
import NewClientModal from '../components/NewClientModal';
import { Contact } from '../data/clientsData';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';

const Clients: React.FC = () => {
  const { isSidebarCollapsed } = useUI();
  const {
    clients,
    addClient: addClientCtx,
    updateClient,
    deleteClient,
    totalClientsCount,
    currentPage,
    fetchClients,
    isLoadingClients
  } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dados');
  const [showInssPassword, setShowInssPassword] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzingCNIS, setIsAnalyzingCNIS] = useState(false);
  const [isDraggingCNIS, setIsDraggingCNIS] = useState(false);

  // Efeito para busca com debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Efeito para carregar dados iniciais se necessário (caso o login falhe no pre-load)
  useEffect(() => {
    if (clients.length === 0 && totalClientsCount === 0) {
      fetchClients(1, searchTerm);
    }
  }, []);

  // Estados para dados estendidos do cliente selecionado
  const [currentCnisLinks, setCurrentCnisLinks] = useState<any[]>([]);
  const [currentDocsChecklist, setCurrentDocsChecklist] = useState<any[]>([]);

  const getMissingDocsCount = (client: any) => {
    if (!client.documentConferences) return 0;
    return client.documentConferences.reduce((acc: number, c: any) => acc + (c.documents || []).filter((d: any) => !d.isDelivered).length, 0);
  };

  const {
    calculateCompleteness
  } = useData();

  // Sincronizar dados estendidos quando um cliente é selecionado
  useEffect(() => {
    if (selectedClient) {
      setCurrentCnisLinks(selectedClient.cnisLinks || [
        { company: 'METALURGICA SAO JOSE LTDA', entryDate: '1995-02-10', exitDate: '2005-08-30', type: 'Empregado', status: 'Validado' },
        { company: 'CONSTRUTORA ALPHA UNIAO', entryDate: '2006-01-15', exitDate: '2015-12-20', type: 'Empregado', status: 'Validado' },
        { company: 'CONTRIBUINTE INDIVIDUAL', entryDate: '2016-03-01', exitDate: '2023-10-15', type: 'Contribuinte', status: 'Pendente' }
      ]);
      setCurrentDocsChecklist(selectedClient.docsChecklist || [
        { name: 'RG / CNH', status: 'Validado', mandatory: true, icon: 'badge' },
        { name: 'Comprovante de Residência', status: 'Validado', mandatory: true, icon: 'home_pin' },
        { name: 'CNIS Atualizado', status: 'Pendente', mandatory: true, icon: 'description' },
        { name: 'CTPS (Digitais)', status: 'Validado', mandatory: true, icon: 'menu_book' },
        { name: 'PPP (Perfil Profissiográfico)', status: 'Faltando', mandatory: false, icon: 'medical_information' },
        { name: 'Certidão de Casamento', status: 'Opcional', mandatory: false, icon: 'diversity_2' }
      ]);
    }
  }, [selectedClient]);

  // Sincronizar selectedClient se ele for atualizado na lista global
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated as any);
    }
  }, [clients]);

  // Search & Filter Sidebar States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as string,
    role: '',
    location: '',
    onlyFavorites: false,
  });

  const handleSaveClient = (newClientData: any) => {
    if (isEditMode) {
      updateClient(newClientData);
    } else {
      addClientCtx(newClientData);
    }
    setIsNewClientModalOpen(false);
    setIsEditMode(false);
  };

  const toggleFavorite = (e: React.MouseEvent, client: any) => {
    e.stopPropagation();
    updateClient({ ...client, isFavorite: !client.isFavorite });
  };

  const handleStatusChange = (newStatus: string) => {
    if (selectedClient) {
      updateClient({ ...selectedClient, status: newStatus } as any);
      setIsStatusMenuOpen(false);
    }
  };

  // Filtering Logic
  const filteredContacts = useMemo(() => {
    return clients.filter(contact => {
      // 1. Text Search (Name, CPF, Role)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (contact.name || '').toLowerCase().includes(searchLower) ||
        (contact.cpf || '').includes(searchLower) ||
        (contact.role || '').toLowerCase().includes(searchLower);

      // 2. Status Filter
      const matchesStatus = filters.status ? contact.status === filters.status : true;

      // 3. Location Filter
      const matchesLocation = filters.location ? (contact.location || '').toLowerCase().includes(filters.location.toLowerCase()) : true;

      // 4. Role Specific Filter (if used in advanced filters)
      const matchesRoleFilter = filters.role ? (contact.role || '').toLowerCase().includes(filters.role.toLowerCase()) : true;

      // 5. Favorites Filter
      const matchesFavorites = filters.onlyFavorites ? contact.isFavorite === true : true;

      return matchesSearch && matchesStatus && matchesLocation && matchesRoleFilter && matchesFavorites;
    });
  }, [clients, searchTerm, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.role) count++;
    if (filters.location) count++;
    if (filters.onlyFavorites) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({ status: '', role: '', location: '', onlyFavorites: false });
    setSearchTerm('');
    setShowFilters(false);
  };

  // Componente Auxiliar para Exibir Campos (Read-only)
  const DataField = ({ label, value, icon, fullWidth = false }: { label: string, value: string, icon?: string, fullWidth?: boolean }) => (
    <div className={`flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-white/10 transition-colors group ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-primary transition-colors">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-medium text-text-main truncate" title={value}>{value || '-'}</span>
    </div>
  );

  // Render Detail View
  if (selectedClient && !isNewClientModalOpen) {
    // Dados Mocados Estendidos (Simulando o banco de dados completo)
    const fullData = {
      ...selectedClient,
      nacionalidade: 'Brasileira',
      escolaridade: 'Ensino Médio Completo',
      estadoCivil: 'Casado',
      rg: '12.345.678-9 SSP/SP',
      motherName: selectedClient.motherName || 'Maria da Silva',
      pai: 'José da Silva',
      emails: { main: 'joao.silva@email.com', sec: 'joao.trabalho@metalurgica.com.br' },
      phones: selectedClient.phones || { cell: '(11) 99999-8888', res: '(11) 3333-2222', com: '(11) 3333-4444', fax: '-' },
      address: {
        cep: '01001-000',
        street: 'Rua das Flores, 123, Apto 45',
        neighborhood: 'Jardim das Rosas',
        city: 'São Paulo',
        uf: 'SP'
      },
      emergency: { name: 'Ana Silva (Esposa)', phone: '(11) 98888-7777' },
      pis: selectedClient.pis || '123.45678.90-0',
      nb: selectedClient.nb || '192.837.465-0',
      inssPassword: selectedClient.inssPassword || '*****',
      dependents: selectedClient.dependents || [
        { name: 'Bernardo Silva', relation: 'Filho', birthDate: '2015-05-12', cpf: '555.444.333-22' },
        { name: 'Ana Beatriz Silva', relation: 'Filha', birthDate: '2018-10-20', cpf: '111.999.888-77' }
      ],
      cnisLinks: currentCnisLinks,
      docsChecklist: currentDocsChecklist,
      isFavorite: selectedClient.isFavorite,
      obs: selectedClient.obs || 'Cliente prefere contato via WhatsApp no período da tarde. Possui dificuldade de locomoção e documentação de tempo especial completa.',
      bankInfo: selectedClient.bankInfo || { bank: 'Banco do Brasil', agency: '1234-5', account: '98765-4', type: 'Conta Corrente' },
      healthInfo: selectedClient.healthInfo || { deficiency: 'Física', cid: 'M54.5', chronic: 'Hérnia de Disco Lombar' },
      specialPeriods: selectedClient.specialPeriods || { rural: true, military: false, public: false },
      pjInfo: selectedClient.pjExtra || (selectedClient.company === 'Pessoa Jurídica' ? { responsible: 'Pedro Santos', fantasyName: 'Santos LTDA', activity: 'Serviços', stateReg: '123.456.789', muniReg: '987.654.321', site: 'www.santos.com.br' } : null),
      campoLivre1: 'Indicação Dr. Roberto',
      campoLivre2: 'Opção A'
    };

    // Função para simular importação de CNIS com IA
    const handleImportCNIS = () => {
      setIsAnalyzingCNIS(true);

      // Simula tempo de processamento da IA
      setTimeout(() => {
        const newLinks = [
          ...currentCnisLinks,
          {
            company: 'NOVO VÍNCULO IDENTIFICADO PELA IA',
            entryDate: '2024-01-01',
            exitDate: null,
            type: 'Especial',
            status: 'Validado'
          }
        ];
        setCurrentCnisLinks(newLinks);
        setIsAnalyzingCNIS(false);

        // Atualiza checklist se o CNIS for importado
        setCurrentDocsChecklist(prev =>
          prev.map(doc => doc.name === 'CNIS Atualizado' ? { ...doc, status: 'Validado' } : doc)
        );
      }, 2500);
    };

    // Função para simular upload de documento
    const handleUploadDoc = (docName: string) => {
      setCurrentDocsChecklist(prev =>
        prev.map(doc => doc.name === docName ? { ...doc, status: 'Validado' } : doc)
      );
    };

    // Cálculos para o Gráfico de Gantt Dinâmico
    const calculateGanttStyle = (entry: string, exit: string | null) => {
      const start = new Date(entry).getTime();
      const end = exit ? new Date(exit).getTime() : new Date().getTime();

      // Definimos uma janela de 30 anos para a visualização
      const minDate = new Date('1990-01-01').getTime();
      const maxDate = new Date().getTime();
      const totalRange = maxDate - minDate;

      const left = Math.max(0, ((start - minDate) / totalRange) * 100);
      const width = Math.min(100 - left, ((end - start) / totalRange) * 100);

      return { left: `${left}%`, width: `${width}%` };
    };

    return (
      <div className={`fixed top-0 transition-all duration-300 z-40 h-full flex flex-col bg-black border-l border-white/10 ${isSidebarCollapsed ? 'left-20 w-[calc(100%-80px)]' : 'left-20 lg:left-72 w-[calc(100%-80px)] lg:w-[calc(100%-288px)]'} animate-[slideInRight_0.3s_ease-out]`}>
        <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-hidden">
          {/* Navigation Header */}
          <div className="flex items-center gap-4 mb-6 shrink-0">
            <button
              onClick={() => setSelectedClient(null)}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:shadow-neon transition-all"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="text-sm font-bold">Voltar para Lista</span>
            </button>
            <div className="h-6 w-px bg-white/10"></div>
            <span className="text-sm text-slate-500 font-mono">Visualizando Perfil</span>
          </div>

          {/* Profile Content Container */}
          <div className="flex-1 glass-panel rounded-2xl overflow-y-auto overflow-x-hidden relative flex flex-col shadow-xl border border-white/60">
            {/* Profile Header Background */}
            <div className="h-48 w-full relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-[#f0f9ff] to-[#f5f8f8]"></div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

              <div className="absolute top-6 right-6 flex gap-3 z-20">
                <button
                  onClick={() => {
                    setIsEditMode(true);
                    setIsNewClientModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-primary hover:text-black transition-all text-xs text-white font-bold shadow-soft group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">edit</span> Editar Perfil
                </button>
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente excluir este cliente?')) {
                      deleteClient(selectedClient.id);
                      setSelectedClient(null);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-red-500/80 hover:border-red-500 hover:text-white transition-all text-xs text-white font-bold shadow-soft group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">delete</span>
                </button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="px-6 md:px-10 -mt-16 pb-10 flex flex-col gap-8 relative z-10 flex-1">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-end md:items-center flex-wrap">
                <div className="relative group cursor-pointer shrink-0">
                  {fullData.avatar ? (
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-3xl h-32 w-32 border-[6px] border-black/40 shadow-2xl relative z-10" style={{ backgroundImage: `url('${fullData.avatar}')` }}></div>
                  ) : (
                    <div className={`flex items-center justify-center aspect-square rounded-3xl h-32 w-32 border-[6px] border-black/40 shadow-2xl relative z-10 bg-primary/10 text-primary text-3xl font-bold`}>{fullData.initials}</div>
                  )}
                  <div className="absolute inset-0 rounded-3xl border-2 border-primary blur-[4px] opacity-40 z-0 animate-pulse"></div>
                  <div className="absolute bottom-2 right-2 z-20 size-4 bg-emerald-500 border-2 border-black rounded-full shadow-sm"></div>
                </div>

                <div className="flex-1 mb-2 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2 flex-wrap relative">
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-display">{fullData.name}</h1>

                    {/* Creative Status Picker */}
                    <div className="relative group/status flex items-center">
                      <button
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        className={`px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase font-bold border transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md ${fullData.status === 'Ativo' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : fullData.status === 'Pendente' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                      >
                        <div className={`size-1.5 rounded-full ${fullData.status === 'Ativo' ? 'bg-emerald-500' : fullData.status === 'Pendente' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                        {fullData.status}
                        <span className="material-symbols-outlined text-[14px]">expand_more</span>
                      </button>

                      {isStatusMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 bg-black/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 p-2 z-[60] flex flex-col gap-1 min-w-[140px] animate-[fadeIn_0.2s_ease-out]">
                          {['Ativo', 'Pendente', 'Arquivado'].map(st => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(st)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${fullData.status === st ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
                            >
                              <div className={`size-1.5 rounded-full ${st === 'Ativo' ? 'bg-emerald-500' : st === 'Pendente' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                              {st}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Creative Favorite Toggle */}
                    <button
                      onClick={(e) => toggleFavorite(e, selectedClient)}
                      className={`group/fav relative flex items-center justify-center transition-all ${fullData.isFavorite ? 'scale-110' : 'hover:scale-110'}`}
                      title={fullData.isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                    >
                      <span className={`material-symbols-outlined transition-all duration-300 ${fullData.isFavorite ? 'text-amber-400 filled drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] text-[24px]' : 'text-slate-300 text-[22px] group-hover/fav:text-amber-200'}`}>
                        {fullData.isFavorite ? 'star' : 'star'}
                      </span>
                      {fullData.isFavorite && (
                        <span className="absolute -inset-1 rounded-full bg-amber-400/20 blur-[10px] animate-pulse"></span>
                      )}
                      <span className="absolute -top-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-[8px] font-bold text-amber-600 opacity-0 group-hover/fav:opacity-100 transition-opacity whitespace-nowrap -translate-y-full">
                        Favoritar
                      </span>
                    </button>

                    <span className="px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase font-bold bg-primary/10 border border-primary/20 text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">bolt</span> {fullData.perfil || 'Normal'}
                    </span>
                  </div>
                  <p className="text-lg md:text-xl text-slate-400 font-light flex items-center gap-2 flex-wrap">
                    {fullData.company} <span className="text-slate-700">•</span> <span className="font-semibold text-white">{fullData.role}</span>
                  </p>
                </div>

                <div className="flex gap-3 mb-2 shrink-0">
                  <button className="h-12 px-6 rounded-full bg-primary text-black flex items-center gap-2 font-bold shadow-neon hover:-translate-y-1 transition-transform">
                    <span className="material-symbols-outlined">call</span> Ligar
                  </button>
                  <button className="size-12 rounded-full bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all shadow-sm">
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex flex-col gap-0">
                <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('dados')}
                    className={`px-8 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'dados' ? 'text-primary border-primary bg-primary/5 rounded-t-lg' : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'}`}
                  >
                    Dados Cadastrais
                  </button>
                  <button
                    onClick={() => setActiveTab('historico')}
                    className={`px-8 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'historico' ? 'text-primary border-primary bg-primary/5 rounded-t-lg' : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'}`}
                  >
                    Histórico & Linha do Tempo
                  </button>
                  <button
                    onClick={() => setActiveTab('cnis')}
                    className={`px-8 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'cnis' ? 'text-primary border-primary bg-primary/5 rounded-t-lg' : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'}`}
                  >
                    CNIS (Vínculos)
                  </button>
                  <button
                    onClick={() => setActiveTab('docs')}
                    className={`px-8 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'docs' ? 'text-primary border-primary bg-primary/5 rounded-t-lg' : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'}`}
                  >
                    Documentos
                  </button>
                </div>

                <div className="pt-6">
                  {/* TAB: DADOS CADASTRAIS */}
                  {activeTab === 'dados' && (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">

                      {/* Coluna Principal: Dados Pessoais e Docs */}
                      <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Section: Basic Info */}
                        <div className="md:col-span-full bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="material-symbols-outlined">person</span> Dados Pessoais
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            <DataField label="Nome Completo" value={fullData.name} fullWidth />
                            <DataField label="Grupo" value={fullData.grupo} icon="group" />
                            <DataField label="Nacionalidade" value={fullData.nacionalidade} icon="flag" />
                            <DataField label="Estado Civil" value={fullData.estadoCivil} icon="diversity_2" />
                            <DataField label="Nome da Mãe" value={fullData.motherName} icon="woman" fullWidth />
                            <DataField label="Profissão" value={fullData.company} icon="work" />
                            <DataField label="Escolaridade" value={fullData.escolaridade} icon="school" />
                            <DataField label="Data de Nascimento" value={`${fullData.nascimento} (${fullData.age})`} icon="cake" />
                          </div>
                        </div>

                        {/* Section: Documents */}
                        <div className="md:col-span-full bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="material-symbols-outlined">badge</span> Documentos
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <DataField label="CPF" value={fullData.cpf} />
                            <DataField label="RG" value={fullData.rg} />
                            <DataField label="PIS/PASEP" value={fullData.pis} />
                            <DataField label="Nº Benefício (NB)" value={fullData.nb} icon="payments" />
                            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-white/10 transition-colors group relative">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px] text-slate-500 group-hover:text-primary transition-colors">lock</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Senha MeuINSS</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-white truncate">
                                  {activeTab === 'dados' && !showInssPassword ? '••••••••' : fullData.inssPassword}
                                </span>
                                <button
                                  onClick={() => setShowInssPassword(!showInssPassword)}
                                  className="size-6 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-primary transition-all"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    {showInssPassword ? 'visibility_off' : 'visibility'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section: Dependents */}
                        <div className="md:col-span-full bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="material-symbols-outlined text-[20px]">family_restroom</span> Dependentes
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {fullData.dependents && fullData.dependents.map((dep: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{dep.relation}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{dep.cpf}</span>
                                </div>
                                <span className="text-sm font-bold text-white">{dep.name}</span>
                                <span className="text-[11px] text-slate-400">Nascimento: {dep.birthDate ? dep.birthDate : '-'}</span>
                              </div>
                            ))}
                            {(!fullData.dependents || fullData.dependents.length === 0) && (
                              <p className="text-xs text-slate-400 col-span-full italic">Nenhum dependente cadastrado.</p>
                            )}
                          </div>
                        </div>

                        {/* Section: Contact */}
                        <div className="md:col-span-1 bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="material-symbols-outlined">contact_phone</span> Contato
                          </h3>
                          <div className="flex flex-col gap-3">
                            <DataField label="Celular (WhatsApp)" value={fullData.phones.cell} icon="smartphone" />
                            <DataField label="E-mail Principal" value={fullData.emails.main} icon="mail" />
                            <DataField label="E-mail Secundário" value={fullData.emails.sec} icon="alternate_email" />
                            <DataField label="Tel. Residencial" value={fullData.phones.res || '-'} icon="call" />
                            <DataField label="Tel. Comercial" value={fullData.phones.com || '-'} icon="call" />
                          </div>
                        </div>

                        {/* Section: Address */}
                        <div className="md:col-span-2 bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="material-symbols-outlined">location_on</span> Endereço
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <DataField label="CEP" value={fullData.address.cep} />
                            <DataField label="Logradouro" value={fullData.address.street} fullWidth />
                            <DataField label="Bairro" value={fullData.address.neighborhood} />
                            <DataField label="Cidade" value={fullData.address.city} />
                            <DataField label="UF" value={fullData.address.uf} />
                          </div>
                        </div>

                        {/* Section: Bank Info */}
                        <div className="md:col-span-1 bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="material-symbols-outlined">account_balance</span> Dados Bancários
                          </h3>
                          <div className="flex flex-col gap-2">
                            <DataField label="Banco" value={fullData.bankInfo.bank} />
                            <DataField label="Agência" value={fullData.bankInfo.agency} />
                            <DataField label="Conta" value={fullData.bankInfo.account} />
                            <DataField label="Tipo" value={fullData.bankInfo.type} />
                          </div>
                        </div>

                        {/* Section: PJ Info (Only if applicable) */}
                        {fullData.pjInfo && (
                          <div className="md:col-span-full bg-primary/5 border border-primary/10 p-5 rounded-2xl shadow-sm">
                            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                              <span className="material-symbols-outlined">corporate_fare</span> Dados da Pessoa Jurídica
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              <DataField label="Nome Fantasia" value={fullData.pjInfo.fantasyName} fullWidth />
                              <DataField label="Responsável" value={fullData.pjInfo.responsible} />
                              <DataField label="Ramo de Atividade" value={fullData.pjInfo.activity} />
                              <DataField label="Insc. Estadual" value={fullData.pjInfo.stateReg} />
                              <DataField label="Insc. Municipal" value={fullData.pjInfo.muniReg} />
                              <DataField label="Website" value={fullData.pjInfo.site} fullWidth />
                            </div>
                          </div>
                        )}

                        {/* Section: Health & Special Conditions */}
                        <div className="md:col-span-full bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl shadow-sm">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                              <h3 className="text-sm font-bold text-rose-500 mb-4 flex items-center gap-2 border-b border-rose-500/10 pb-2">
                                <span className="material-symbols-outlined">medical_services</span> Saúde & PCD
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                <DataField label="Tipo de Deficiência" value={fullData.healthInfo.deficiency} icon="accessible" />
                                <DataField label="CID Principal" value={fullData.healthInfo.cid} icon="tag" />
                                <DataField label="Doença Crônica" value={fullData.healthInfo.chronic} icon="healing" />
                              </div>
                            </div>

                            <div className="lg:col-span-2">
                              <h3 className="text-sm font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                                <span className="material-symbols-outlined">history_edu</span> Períodos e Requisitos Especiais
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${fullData.specialPeriods.rural ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-glow-sm shadow-emerald-500/20' : 'bg-white/5 border-white/5 text-slate-500 opacity-50'}`}>
                                  <span className="material-symbols-outlined text-2xl">agriculture</span>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase tracking-tighter">Trabalho Rural</span>
                                    <span className="text-[10px] font-medium">{fullData.specialPeriods.rural ? 'Identificado' : 'Não possui'}</span>
                                  </div>
                                </div>
                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${fullData.specialPeriods.military ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-glow-sm shadow-emerald-500/20' : 'bg-white/5 border-white/5 text-slate-500 opacity-50'}`}>
                                  <span className="material-symbols-outlined text-2xl">military_tech</span>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase tracking-tighter">Serviço Militar</span>
                                    <span className="text-[10px] font-medium">{fullData.specialPeriods.military ? 'Identificado' : 'Não possui'}</span>
                                  </div>
                                </div>
                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${fullData.specialPeriods.public ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-glow-sm shadow-emerald-500/20' : 'bg-white/5 border-white/5 text-slate-500 opacity-50'}`}>
                                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase tracking-tighter">Serviço Público</span>
                                    <span className="text-[10px] font-medium">{fullData.specialPeriods.public ? 'Identificado' : 'Não possui'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section: Extra Observations */}
                        <div className="md:col-span-full bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-amber-500 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">description</span> Anotações Estratégicas do Caso
                          </h3>
                          <div className="p-4 bg-black/40 rounded-xl border border-amber-500/20 text-sm text-slate-400 italic leading-relaxed shadow-inner">
                            {fullData.obs}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: HISTÓRICO & LINHA DO TEMPO */}
                  {activeTab === 'historico' && (
                    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Left: Timeline */}
                        <div className="md:col-span-3 bg-white/5 border border-white/10 p-6 rounded-2xl shadow-sm">
                          <h3 className="text-sm font-bold text-primary uppercase mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">timeline</span> Linha do Tempo de Atendimentos
                          </h3>
                          <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                            <div className="relative">
                              <div className="absolute -left-[31px] top-1 size-4 rounded-full bg-primary border-4 border-black shadow-neon-sm z-10"></div>
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Atendimento Inicial</span>
                                  <span className="text-[10px] text-slate-500 font-medium">10/12/2023 14:30</span>
                                </div>
                                <p className="text-sm font-bold text-white mb-1">Entrevista de Qualificação Realizada</p>
                                <p className="text-xs text-slate-400 line-clamp-2">Cliente compareceu ao escritório para análise de aposentadoria especial. Documentação básica entregue.</p>
                              </div>
                            </div>

                            <div className="relative">
                              <div className="absolute -left-[31px] top-1 size-4 rounded-full bg-amber-500 border-4 border-black shadow-glow-sm shadow-amber-500/50 z-10"></div>
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm border-l-4 border-l-amber-500/50">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded">Pendência</span>
                                  <span className="text-[10px] text-slate-500 font-medium">12/12/2023 09:15</span>
                                </div>
                                <p className="text-sm font-bold text-white mb-1">Solicitação de PPP enviada à empresa</p>
                                <p className="text-xs text-slate-400">Enviado e-mail para o RH da Metalúrgica São José solicitando o Perfil Profissiográfico Previdenciário.</p>
                              </div>
                            </div>

                            <div className="relative">
                              <div className="absolute -left-[31px] top-1 size-4 rounded-full bg-emerald-500 border-4 border-black shadow-glow-sm shadow-emerald-500/50 z-10"></div>
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm border-l-4 border-l-emerald-500/50">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Ação Concluída</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Ontem 16:45</span>
                                </div>
                                <p className="text-sm font-bold text-white mb-1">Upload do RG e Comprovante realizado</p>
                                <p className="text-xs text-slate-400">Documentos validados pelo sistema de OCR.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Quick Actions / Notes */}
                        <div className="flex flex-col gap-6">
                          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Anotação Rápida</h4>
                            <textarea
                              className="w-full h-32 p-3 text-xs bg-black/40 border border-white/10 text-white rounded-xl outline-none focus:border-primary transition-all resize-none"
                              placeholder="Digite um lembrete rápido aqui..."
                            ></textarea>
                            <button className="w-full mt-3 py-2.5 bg-primary text-black text-xs font-bold rounded-xl hover:-translate-y-1 transition-all shadow-neon">
                              Salvar Nota
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: CNIS (VÍNCULOS) */}
                  {activeTab === 'cnis' && (
                    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <span className="material-symbols-outlined">account_tree</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">Vínculos Previdenciários (CNIS)</h3>
                              <p className="text-xs text-slate-500">Listagem extraída do Cadastro Nacional de Informações Sociais.</p>
                            </div>
                          </div>
                        </div>

                        {/* Dropzone de CNIS Inteligente */}
                        {!isAnalyzingCNIS && currentCnisLinks.length <= 3 && (
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingCNIS(true); }}
                            onDragLeave={() => setIsDraggingCNIS(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDraggingCNIS(false); handleImportCNIS(); }}
                            className={`mb-6 p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ${isDraggingCNIS
                              ? 'border-primary bg-primary/5 shadow-neon scale-[1.01]'
                              : 'border-white/10 bg-white/5 hover:border-primary/40 hover:bg-white/10'
                              }`}
                            onClick={handleImportCNIS}
                          >
                            <div className={`size-16 rounded-full flex items-center justify-center transition-all ${isDraggingCNIS ? 'bg-primary text-black scale-110' : 'bg-white/5 text-slate-500 group-hover:text-primary'
                              }`}>
                              <span className="material-symbols-outlined text-3xl font-light">
                                {isDraggingCNIS ? 'upload_file' : 'picture_as_pdf'}
                              </span>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-white">Arraste o PDF do CNIS aqui</p>
                              <p className="text-xs text-slate-500 mt-1">Ou clique para selecionar no computador</p>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> ANALISAR COM IA
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Botão compacto caso já existam muitos vínculos ou esteja analisando */}
                        {(isAnalyzingCNIS || currentCnisLinks.length > 3) && (
                          <div className="flex justify-end mb-4">
                            <button
                              onClick={handleImportCNIS}
                              disabled={isAnalyzingCNIS}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${isAnalyzingCNIS ? 'bg-white/5 text-slate-500' : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'}`}
                            >
                              {isAnalyzingCNIS ? (
                                <>
                                  <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  Extraindo Dados do PDF...
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                  Atualizar via CNIS (PDF)
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        <div className="overflow-hidden border border-white/10 rounded-xl bg-black/20">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/10">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Empregador / Organização</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Período</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {fullData.cnisLinks.map((link: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/5">
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white">{link.company}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">NIT: 123.45678.90-0</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-slate-400">{new Date(link.entryDate).toLocaleDateString('pt-BR')}</span>
                                      <span className="text-white/20">→</span>
                                      <span className="text-sm font-medium text-slate-400">{link.exitDate ? new Date(link.exitDate).toLocaleDateString('pt-BR') : 'Atual'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-[11px] font-bold text-slate-400 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">{link.type}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${link.status === 'Validado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                      <div className={`size-1.5 rounded-full ${link.status === 'Validado' ? 'bg-emerald-500 shadow-glow-sm shadow-emerald-500/50' : 'bg-amber-500 shadow-glow-sm shadow-amber-500/50'}`}></div>
                                      {link.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-primary transition-colors">
                                      <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Timeline Placeholder */}
                        <div className="mt-8">
                          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Linha do Tempo de Contribuição (Gantt Real)</h4>
                          <div className="bg-black/20 rounded-2xl border border-dashed border-white/10 p-6 relative overflow-hidden group">
                            <div className="space-y-4 relative z-10">
                              {currentCnisLinks.map((link, idx) => {
                                const style = calculateGanttStyle(link.entryDate, link.exitDate);
                                return (
                                  <div key={idx} className="flex items-center gap-4">
                                    <div className="w-24 text-[10px] font-bold text-slate-500 truncate uppercase">{link.company.split(' ')[0]}</div>
                                    <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden group/bar">
                                      <div
                                        className={`absolute h-full rounded-full transition-all duration-1000 ${link.status === 'Validado' ? 'bg-primary' : 'bg-amber-400'}`}
                                        style={{ ...style, transitionDelay: `${idx * 100}ms` }}
                                      >
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Grade de anos (opcional para estética) */}
                            <div className="absolute inset-0 flex justify-between px-32 pointer-events-none opacity-10">
                              {[...Array(6)].map((_, i) => <div key={i} className="w-px h-full bg-white/20"></div>)}
                            </div>

                            {isAnalyzingCNIS && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] animate-[fadeIn_0.5s_ease-out]">
                                <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-[11px] text-primary font-bold italic">IA identificando novos períodos...</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex justify-between text-[9px] text-slate-500 font-mono uppercase tracking-widest px-28">
                            <span>1990</span>
                            <span>2000</span>
                            <span>2010</span>
                            <span>2020</span>
                            <span>Hoje</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: DOCUMENTOS */}
                  {activeTab === 'docs' && (
                    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left: Document Checklist */}
                        <div className="md:col-span-2 bg-white/5 border border-white/10 p-6 rounded-2xl shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                              <span className="material-symbols-outlined text-[20px]">fact_check</span> Checklist de Documentos
                            </h3>
                            <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">add_circle</span> Adicionar Campo
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {fullData.docsChecklist.map((doc: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group hover:border-primary/20 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-4">
                                  <div className={`size-10 rounded-lg flex items-center justify-center ${doc.status === 'Validado' ? 'bg-emerald-500/10 text-emerald-500' :
                                    doc.status === 'Pendente' ? 'bg-amber-500/10 text-amber-500' :
                                      doc.status === 'Faltando' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-slate-500'
                                    }`}>
                                    <span className="material-symbols-outlined">{doc.icon}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                      {doc.name}
                                      {doc.mandatory && <span className="text-[10px] bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter shadow-glow-sm shadow-rose-500/20">Obrigatório</span>}
                                    </p>
                                    <p className="text-[11px] text-slate-500 uppercase font-medium">{doc.status}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="size-8 rounded-full bg-white/5 text-slate-500 hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center" title="Visualizar">
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                  </button>
                                  <button
                                    onClick={() => handleUploadDoc(doc.name)}
                                    className={`size-8 rounded-full transition-all flex items-center justify-center ${doc.status === 'Validado' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-slate-500 hover:bg-primary/20 hover:text-primary'}`}
                                    title="Fazer Upload"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">{doc.status === 'Validado' ? 'check_circle' : 'upload'}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Summary & Stats */}
                        <div className="flex flex-col gap-6">
                          <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl shadow-glow-sm shadow-primary/5">
                            <h4 className="text-xs font-bold text-primary uppercase mb-4 tracking-widest">Resumo do Dossiê</h4>
                            <div className="space-y-4">
                              <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-500 font-medium">Documentos Validados</span>
                                <span className="text-lg font-bold text-primary shadow-glow-sm shadow-primary/40">3 / 6</span>
                              </div>
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-primary shadow-glow shadow-primary/40" style={{ width: '50%' }}></div>
                              </div>
                              <p className="text-[11px] text-slate-500 italic">O sistema recomenda o upload imediato do CNIS para análise IA.</p>
                            </div>
                          </div>

                          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Arquivos Recentes</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                <span className="material-symbols-outlined text-rose-500 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white truncate">RG-Digitalizado.pdf</p>
                                  <p className="text-[9px] text-slate-500">Enviado em 12/12/2023</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                <span className="material-symbols-outlined text-blue-500 group-hover:scale-110 transition-transform">image</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white truncate">Comprovante-Res.jpg</p>
                                  <p className="text-[9px] text-slate-500">Enviado em 10/12/2023</p>
                                </div>
                              </div>
                            </div>
                            <button className="w-full mt-4 py-2 border border-white/10 rounded-lg text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                              Ver Todos os Arquivos
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render List/Grid View
  return (
    <div className="flex-1 h-full p-6 lg:p-10 flex flex-col gap-6 overflow-hidden">
      {/* Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => {
          setIsNewClientModalOpen(false);
          setIsEditMode(false);
          setSelectedClient(null);
        }}
        onSave={handleSaveClient}
        clientToEdit={isEditMode ? selectedClient : null}
        onDelete={(id) => {
          deleteClient(id);
          setIsNewClientModalOpen(false);
          setIsEditMode(false);
          setSelectedClient(null);
        }}
      />

      {/* Header Section - Increased z-index to z-40 to stay above table content */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 relative z-40">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-display">Clientes</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie segurados, documentos e histórico.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white/5 rounded-xl p-1 border border-white/10 flex shadow-inner">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black shadow-neon-sm' : 'text-slate-500 hover:text-white hover:bg-white/5 transition-colors'}`}
              title="Visualização em Lista"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-black shadow-neon-sm' : 'text-slate-500 hover:text-white hover:bg-white/5 transition-colors'}`}
              title="Visualização em Grade"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
          </div>

          <div className="relative flex-1 md:min-w-[320px] lg:min-w-[400px] flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm shadow-inner transition-all outline-none placeholder:text-slate-600"
              />
            </div>

            {/* Advanced Filter Button & Panel */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 whitespace-nowrap ${showFilters || activeFilterCount > 0 ? 'bg-primary text-black border-primary shadow-neon-sm' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20 hover:shadow-neon-sm focus:shadow-neon-sm focus:border-primary'}`}
                title="Filtros Avançados"
              >
                <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                <span className="font-bold text-sm hidden sm:inline">Pesquisar Cliente</span>
                {activeFilterCount > 0 && (
                  <span className={`size-5 rounded-full text-[10px] font-bold flex items-center justify-center -mr-1 ${showFilters || activeFilterCount > 0 ? 'bg-black text-primary' : 'bg-primary text-black'}`}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-black/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 p-4 z-[100] animate-[fadeIn_0.15s_ease-out]">
                  <div className="flex justify-between items-center mb-4 text-white">
                    <h4 className="text-sm font-bold">Filtros Avançados</h4>
                    <button onClick={clearFilters} className="text-xs text-primary font-bold hover:underline">Limpar</button>
                  </div>

                  <div className="space-y-4">
                    {/* Status Filter */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 block">Status do Cliente</label>
                      <div className="flex flex-wrap gap-2">
                        {['Ativo', 'Pendente', 'Arquivado'].map(st => (
                          <button
                            key={st}
                            onClick={() => setFilters(prev => ({ ...prev, status: prev.status === st ? '' : st }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.status === st ? 'bg-primary text-black border-primary shadow-neon-sm scale-105' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'}`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Localização (Cidade/UF)</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm">location_on</span>
                        <input
                          value={filters.location}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none placeholder:text-slate-700"
                          placeholder="Ex: São Paulo, SP"
                        />
                      </div>
                    </div>

                    {/* Benefit/Role Filter */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Benefício / Assunto</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm">receipt_long</span>
                        <input
                          value={filters.role}
                          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none placeholder:text-slate-700"
                          placeholder="Ex: Aposentadoria"
                        />
                      </div>
                    </div>

                    {/* Favorites Toggle */}
                    <div className="pt-2 border-t border-white/5">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filters.onlyFavorites ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-glow-sm shadow-amber-500/10' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-[20px] ${filters.onlyFavorites ? 'filled animate-pulse' : ''}`}>star</span>
                          <span className="text-xs font-bold uppercase tracking-wider">Apenas Favoritos</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${filters.onlyFavorites ? 'bg-amber-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 size-3 rounded-full bg-white transition-all ${filters.onlyFavorites ? 'left-6' : 'left-1'}`}></div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditMode(false);
              setIsNewClientModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:-translate-y-1 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-neon whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="hidden md:inline">Novo Cliente</span>
          </button>
        </div>
      </header >

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4">

        {/* Loading Indicator */}
        {isLoadingClients && clients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-slate-400 text-sm font-medium">Carregando clientes...</p>
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && !isLoadingClients && (
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-glow-sm shadow-primary/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome / Benefício</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">CPF</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Último Contato</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/20">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => {
                        setSelectedClient(contact as any);
                        setIsEditMode(true);
                        setIsNewClientModalOpen(true);
                      }}
                      className="group hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {contact.avatar ? (
                              <div className={`w-10 h-10 rounded-full bg-cover bg-center shadow-sm border border-black/40 ${!contact.active ? 'grayscale opacity-40' : contact.grayscale ? 'grayscale opacity-70' : ''}`} style={{ backgroundImage: `url('${contact.avatar}')` }}></div>
                            ) : (
                              <div className={`w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 ${!contact.active ? 'grayscale opacity-40' : ''}`}>{contact.initials}</div>
                            )}
                            {contact.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"></div>}
                          </div>
                          <div className={!contact.active ? 'opacity-40' : ''}>
                            <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                              {contact.name}
                              {!contact.active && <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-tighter font-black shadow-glow-sm shadow-rose-500/20 animate-pulse">Inativo</span>}
                            </h3>
                            <p className="text-xs text-slate-500">{contact.role}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              {contact.location && <p className="text-[10px] text-slate-500 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">location_on</span> {contact.location}</p>}

                              <div className="flex items-center gap-2 group/prog">
                                <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                  <div
                                    className={`h-full transition-all duration-500 ${calculateCompleteness(contact).percent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                    style={{ width: `${calculateCompleteness(contact).percent}%` }}
                                  ></div>
                                </div>
                                <span className={`text-[9px] font-bold ${calculateCompleteness(contact).percent === 100 ? 'text-emerald-500' : 'text-primary'}`}>
                                  {calculateCompleteness(contact).percent}%
                                </span>
                              </div>

                              {getMissingDocsCount(contact) > 0 && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse uppercase tracking-tighter shadow-glow-sm shadow-rose-500/20">
                                  <span className="material-symbols-outlined text-[12px] font-bold">warning</span>
                                  {getMissingDocsCount(contact)} Docs Pendentes
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded shadow-inner">{contact.cpf}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${contact.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-glow-sm shadow-emerald-500/20' :
                          contact.status === 'Pendente' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-glow-sm shadow-amber-500/20' :
                            contact.status === 'Arquivado' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-glow-sm shadow-purple-500/20' :
                              contact.status === 'Inativo' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-glow-sm shadow-rose-500/20' :
                                'bg-white/5 text-slate-500 border border-white/10'
                          }`}>
                          <div className={`size-1.5 rounded-full ${contact.status === 'Ativo' ? 'bg-emerald-500 shadow-glow shadow-emerald-500/50' :
                            contact.status === 'Pendente' ? 'bg-amber-500 shadow-glow shadow-amber-500/50' :
                              contact.status === 'Arquivado' ? 'bg-purple-500 shadow-glow shadow-purple-500/50' :
                                contact.status === 'Inativo' ? 'bg-rose-500 shadow-glow shadow-rose-500/50' :
                                  'bg-slate-500'
                            }`}></div>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-medium text-slate-400">{contact.time}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={(e) => toggleFavorite(e, contact)}
                            className={`p-1 transition-all ${contact.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-200'}`}
                          >
                            <span className={`material-symbols-outlined text-lg ${contact.isFavorite ? 'filled' : ''}`}>star</span>
                          </button>
                          <button className="text-slate-400 hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl opacity-50">search_off</span>
                        <p>Nenhum cliente encontrado com os filtros atuais.</p>
                        <button onClick={clearFilters} className="text-primary text-sm font-bold hover:underline">Limpar Filtros</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
        }

        {/* GRID VIEW (Compactado conforme solicitado) */}
        {
          viewMode === 'grid' && !isLoadingClients && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedClient(contact as any);
                      setIsEditMode(true);
                      setIsNewClientModalOpen(true);
                    }}
                    className="p-4 rounded-xl flex flex-col items-center text-center gap-3 hover:-translate-y-1 hover:border-primary/50 hover:shadow-neon-sm transition-all cursor-pointer group border border-white/10 bg-white/5 backdrop-blur-md"
                  >
                    <div className="relative shrink-0">
                      {contact.avatar ? (
                        <div className={`w-16 h-16 rounded-full bg-cover bg-center shadow-2xl ring-2 ring-black/40 ${!contact.active ? 'grayscale opacity-40' : contact.grayscale ? 'grayscale opacity-70' : ''}`} style={{ backgroundImage: `url('${contact.avatar}')` }}></div>
                      ) : (
                        <div className={`w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shadow-inner ${!contact.active ? 'grayscale opacity-40' : ''}`}>{contact.initials}</div>
                      )}
                      {contact.online && <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full shadow-glow shadow-emerald-500/50"></div>}
                      {getMissingDocsCount(contact) > 0 && (
                        <div className="absolute -top-1 -right-1 size-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-glow shadow-rose-500/50 border-2 border-black">
                          {getMissingDocsCount(contact)}
                        </div>
                      )}
                    </div>

                    <div className={`flex flex-col gap-0.5 w-full min-w-0 ${!contact.active ? 'opacity-40' : ''}`}>
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors flex items-center justify-center gap-1.5 pl-4">
                        {contact.name}
                        {!contact.active && <span className="text-[7px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-tighter shrink-0 font-black shadow-glow-sm shadow-rose-500/20 animate-pulse">Inativo</span>}
                      </h3>
                      <p className="text-[10px] text-slate-500 truncate px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md mx-auto mb-1 max-w-full">{contact.role}</p>
                      {contact.location && <p className="text-[9px] text-slate-500 flex items-center justify-center gap-0.5 truncate"><span className="material-symbols-outlined text-[10px]">location_on</span> {contact.location.split(',')[0]}</p>}

                      {/* Completeness Progress Bar */}
                      <div className="mt-2 px-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Cadastro</span>
                          <span className={`text-[9px] font-black ${calculateCompleteness(contact).percent === 100 ? 'text-emerald-500' : 'text-primary'}`}>
                            {calculateCompleteness(contact).percent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <div
                            className={`h-full transition-all duration-700 ease-out shadow-glow ${calculateCompleteness(contact).percent === 100 ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-primary shadow-primary/40'}`}
                            style={{ width: `${calculateCompleteness(contact).percent}%` }}
                          ></div>
                        </div>
                        {calculateCompleteness(contact).missingCount > 0 && (
                          <p className="text-[8px] text-slate-600 font-medium mt-1 leading-none">
                            Faltam {calculateCompleteness(contact).missingCount} campos
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-full h-px bg-white/10"></div>

                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${contact.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-sm shadow-emerald-500/20' :
                        contact.status === 'Pendente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-glow-sm shadow-amber-500/20' :
                          contact.status === 'Arquivado' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-glow-sm shadow-purple-500/20' :
                            contact.status === 'Inativo' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-glow-sm shadow-rose-500/20' :
                              'bg-white/5 text-slate-500 border-white/10'
                        }`}>
                        {contact.status}
                      </span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={(e) => toggleFavorite(e, contact)}
                          className={`size-6 flex items-center justify-center rounded-full transition-colors ${contact.isFavorite ? 'text-amber-400 shadow-glow-sm shadow-amber-400/20' : 'text-slate-600 hover:text-amber-400 hover:bg-white/5'}`}
                        >
                          <span className={`material-symbols-outlined text-[18px] ${contact.isFavorite ? 'filled' : ''}`}>star</span>
                        </button>
                        <button className="size-6 flex items-center justify-center rounded-full text-slate-500 hover:bg-primary/20 hover:text-primary transition-colors" title="Ligar">
                          <span className="material-symbols-outlined text-sm">call</span>
                        </button>
                        <button className="size-6 flex items-center justify-center rounded-full text-slate-500 hover:bg-primary/20 hover:text-primary transition-colors" title="Mensagem">
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-500 glass-panel border-white/5 rounded-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl opacity-20">search_off</span>
                    <p>Nenhum cliente encontrado com os filtros atuais.</p>
                    <button onClick={clearFilters} className="text-primary text-sm font-bold hover:underline">Limpar Filtros</button>
                  </div>
                </div>
              )}
            </div>
          )
        }

        {/* Pagination Controls */}
        <div className="mt-8 flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
          <div className="text-xs text-slate-500 font-mono">
            Mostrando {clients.length} de {totalClientsCount} clientes
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchClients(currentPage - 1, searchTerm)}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-white/5 text-slate-500' : 'bg-white/10 text-white hover:bg-primary hover:text-black shadow-neon-sm'}`}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span> Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(totalClientsCount / 20)) }).map((_, i) => {
                const totalPages = Math.ceil(totalClientsCount / 20);
                let pageNum = 1;

                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchClients(pageNum, searchTerm)}
                    className={`size-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-primary text-black shadow-neon-sm scale-110' : 'hover:bg-white/10 text-slate-400'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => fetchClients(currentPage + 1, searchTerm)}
              disabled={currentPage >= Math.ceil(totalClientsCount / 20)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentPage >= Math.ceil(totalClientsCount / 20) ? 'opacity-50 cursor-not-allowed bg-white/5 text-slate-500' : 'bg-white/10 text-white hover:bg-primary hover:text-black shadow-neon-sm'}`}
            >
              Próximo <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div >
    </div >
  );
};

export default Clients;