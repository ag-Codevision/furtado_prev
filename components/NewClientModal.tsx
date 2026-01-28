import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { supabase } from '../lib/supabase';
import { validateCPF, validateCNPJ } from '../utils/validation';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (clientData: any) => void;
  clientToEdit?: any; // Adicionado para edição
  onDelete?: (id: string) => void;
}

// Helper components refined for a more premium look
const InputGroup = ({ label, placeholder = '', type = 'text', width = 'col-span-1', required = false, value, onChange, icon, rightElement, disabled = false, error = '' }: any) => (
  <div className={`flex flex-col gap-1.5 ${width} group/field`}>
    <div className="flex justify-between items-center pl-1">
      <label className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${error ? 'text-rose-500' : 'text-slate-500 group-focus-within/field:text-primary'}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {error && <span className="text-[10px] font-bold text-rose-500 animate-pulse">{error}</span>}
    </div>
    <div className="relative group/input">
      {icon && (
        <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] transition-all ${error ? 'text-rose-500' : 'text-slate-500 group-focus-within/input:text-primary group-focus-within/input:scale-110'}`}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-11 ${icon ? 'pl-11' : 'px-4'} ${rightElement ? 'pr-11' : 'px-4'} rounded-xl bg-white/5 border shadow-inner transition-all outline-none text-sm text-white placeholder-slate-600 ${error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10' : 'border-white/10 group-hover/field:border-white/20 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10'} ${disabled ? 'opacity-50 cursor-not-allowed bg-white/5' : ''}`}
        placeholder={placeholder}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

const SelectGroup = ({ label, options = [], width = 'col-span-1', value, onChange, icon, selectClassName = '' }: any) => (
  <div className={`flex flex-col gap-1.5 ${width} group/field`}>
    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 pl-1 group-focus-within/field:text-primary transition-colors">{label}</label>
    <div className="relative">
      {icon && (
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] pointer-events-none transition-all group-focus-within/field:text-primary group-focus-within/field:scale-110">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full h-11 ${icon ? 'pl-11' : 'px-4'} pr-11 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover/field:border-white/20 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm text-white appearance-none cursor-pointer !bg-none ${selectClassName}`}
      >
        <option value="" className="bg-slate-900">Selecione...</option>
        {options.map((opt: string) => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
      </select>
      <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xl transition-transform group-focus-within/field:rotate-180">expand_more</span>
    </div>
  </div>
);

const TextareaGroup = ({ label, placeholder = '', width = 'col-span-1', value, onChange, rows = 3 }: any) => (
  <div className={`flex flex-col gap-1.5 ${width} group/field`}>
    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 pl-1 group-focus-within/field:text-primary transition-colors">{label}</label>
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover/field:border-white/20 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm text-white resize-none placeholder:text-slate-600"
      placeholder={placeholder}
    />
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div className="w-full col-span-full mb-4 mt-6 first:mt-2">
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/10"></div>
      <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] whitespace-nowrap bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-glow-sm shadow-primary/5">
        {title}
      </h3>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/10"></div>
    </div>
  </div>
);

const CheckboxItem = ({ label, checked, onChange, icon }: any) => (
  <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group shadow-glow-sm ${checked ? 'bg-primary/10 border-primary text-primary shadow-primary/5' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/10'}`}>
    <div className={`size-6 rounded-lg flex items-center justify-center border-2 transition-all ${checked ? 'bg-primary border-primary scale-110 shadow-glow shadow-primary/50' : 'bg-black/20 border-white/10 group-hover:border-white/20'}`}>
      {checked && <span className="material-symbols-outlined text-black text-[18px] font-bold">check</span>}
    </div>
    {icon && <span className={`material-symbols-outlined text-[24px] transition-transform ${checked ? 'scale-110 shadow-glow shadow-primary/20' : 'group-hover:scale-110'}`}>{icon}</span>}
    <span className={`text-sm font-bold tracking-tight ${checked ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
  </label>
);

const RadioGroup = ({ label, options, value, onChange, width = "col-span-2" }: any) => (
  <div className={`flex flex-col gap-2 ${width}`}>
    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 pl-1">{label}</label>
    <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner group/radio">
      {options.map((opt: string) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 py-2 rounded-lg text-[11px] font-black tracking-widest uppercase transition-all ${value === opt ? 'bg-primary text-black shadow-neon-sm scale-[1.02] z-10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const ObservationTimeline = ({ observations, onAdd, onRemove, newText, onTextChange, placeholder }: any) => (
  <div className="md:col-span-4 space-y-4">
    <div className="flex flex-col gap-1.5 group/field">
      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 pl-1 group-focus-within/field:text-primary transition-colors">Nova Observação</label>
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={newText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover/field:border-white/20 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm text-white resize-none placeholder:text-slate-600"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!newText.trim()}
          className="size-12 rounded-xl bg-primary text-black font-bold flex items-center justify-center shadow-neon-sm shadow-primary/20 hover:scale-105 active:scale-95 transition-all self-end disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="material-symbols-outlined text-2xl font-bold">add_box</span>
        </button>
      </div>
    </div>

    {observations.length > 0 && (
      <div className="space-y-3 pt-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 pl-1">Histórico de Observações</label>
        <div className="flex flex-col gap-3">
          {[...observations].reverse().map((obs: any) => (
            <div key={obs.id} className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
              <div className="absolute left-[-4px] top-2.5 size-2 rounded-full bg-primary shadow-glow shadow-primary/50 border border-black"></div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm group/obs hover:border-white/20 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden shadow-sm">
                        {obs.userAvatar ? (
                          <img src={obs.userAvatar} className="w-full h-full object-cover" alt={obs.userName} />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-lg">person</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase tracking-wider opacity-90">{obs.date}</span>
                      {obs.userName && (
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">por {obs.userName}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(obs.id)}
                    className="size-6 rounded-lg hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover/obs:opacity-100"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed selection:bg-primary selection:text-black">{obs.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSave, clientToEdit, onDelete }) => {
  const { isSidebarCollapsed } = useUI();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ full_name: string; avatar_url?: string } | null>(null);
  const [processType, setProcessType] = useState<'judicial' | 'adm'>('judicial');
  const [clientType, setClientType] = useState<'pf' | 'pj'>('pf');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('');
  const [perfil, setPerfil] = useState('');
  const [inssPassword, setInssPassword] = useState('');
  const [showInssPassword, setShowInssPassword] = useState(false);
  const [pis, setPis] = useState('');
  const [nb, setNb] = useState('');
  const [rg, setRg] = useState('');
  const [nacionalidade, setNacionalidade] = useState('Brasileira');
  const [escolaridade, setEscolaridade] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [profissao, setProfissao] = useState('');
  const [clientOrigin, setClientOrigin] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [guardianCpf, setGuardianCpf] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [isActive, setIsActive] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados específicos de PJ e Campos Comuns
  const [responsible, setResponsible] = useState('');
  const [fantasyName, setFantasyName] = useState('');
  const [activityBranch, setActivityBranch] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [municipalRegistration, setMunicipalRegistration] = useState('');
  const [site, setSite] = useState('');

  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  const [phoneCell, setPhoneCell] = useState('');
  const [phoneRes, setPhoneRes] = useState('');
  const [phoneCom, setPhoneCom] = useState('');
  const [phoneFax, setPhoneFax] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [obsTimeline, setObsTimeline] = useState<{ id: string; text: string; date: string }[]>([]);
  const [newObsText, setNewObsText] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [idError, setIdError] = useState('');

  // Estados do Processo (Passo 1)
  const [procGroup, setProcGroup] = useState('');
  const [procFolder, setProcFolder] = useState('0');
  const [procCnj, setProcCnj] = useState('');
  const [procTag, setProcTag] = useState('');
  const [processNumber, setProcessNumber] = useState('');
  const [procWaitingNumber, setProcWaitingNumber] = useState(false);
  const [procCourt, setProcCourt] = useState('');
  const [procStatus, setProcStatus] = useState('');
  const [comarca, setComarca] = useState('');
  const [comarcaUf, setComarcaUf] = useState('');
  const [areaAtuacao, setAreaAtuacao] = useState('');
  const [procPhase, setProcPhase] = useState('');
  const [objetoAcao, setObjetoAcao] = useState('');
  const [procResponsible, setProcResponsible] = useState('');
  const [procSubject, setProcSubject] = useState('');
  const [procLocator, setProcLocator] = useState('');
  const [procDetails, setProcDetails] = useState('');
  const [procPartner, setProcPartner] = useState('');
  const [procPrognosis, setProcPrognosis] = useState('');
  const [procOrigin, setProcOrigin] = useState('');
  const [procFree1, setProcFree1] = useState('');
  const [procFree2, setProcFree2] = useState('');
  const [procFree3, setProcFree3] = useState('');
  const [procFree4, setProcFree4] = useState('');
  const [procFree5, setProcFree5] = useState('');
  const [procFree6, setProcFree6] = useState('');

  const [procContractDate, setProcContractDate] = useState('');
  const [procFinalDate, setProcFinalDate] = useState('');
  const [procValue, setProcValue] = useState('0,00');
  const [procEndDate, setProcEndDate] = useState('');
  const [procSentenceDate, setProcSentenceDate] = useState('');
  const [procOtherValue, setProcOtherValue] = useState('0,00');
  const [procDistributionDate, setProcDistributionDate] = useState('');
  const [procExecutionDate, setProcExecutionDate] = useState('');
  const [procContingency, setProcContingency] = useState('0,00');
  const [procRequest, setProcRequest] = useState('');
  const [procObservation, setProcObservation] = useState('');
  const [procSecret, setProcSecret] = useState('Não');
  const [procCapture, setProcCapture] = useState('Sim');

  // Mantendo o estado legível para o administrativo por enquanto
  const [adverseParty, setAdverseParty] = useState('');
  const [vara, setVara] = useState('');
  const [juiz, setJuiz] = useState('');
  const [tipoProcesso, setTipoProcesso] = useState('');

  // Estados de Andamentos Processuais (Passo 2)
  const [medicalPericiaDate, setMedicalPericiaDate] = useState('');
  const [medicalPericiaNotified, setMedicalPericiaNotified] = useState(false);
  const [socialPericiaDate, setSocialPericiaDate] = useState('');
  const [socialPericiaNotified, setSocialPericiaNotified] = useState(false);
  const [inssExigenciaDate, setInssExigenciaDate] = useState('');
  const [inssOrientation, setInssOrientation] = useState('');
  const [waitingInssDecision, setWaitingInssDecision] = useState('');
  const [distributedDate, setDistributedDate] = useState('');
  const [liminarDecision, setLiminarDecision] = useState('');
  const [isBlocked, setIsBlocked] = useState('');
  const [inAgravo, setInAgravo] = useState('');
  const [treatmentStartDate, setTreatmentStartDate] = useState('');
  const [responsibleClinic, setResponsibleClinic] = useState('');
  const [agravoDecision, setAgravoDecision] = useState('');
  const [conclusoDecisaoDate, setConclusoDecisaoDate] = useState('');
  const [conclusoJulgamentoDate, setConclusoJulgamentoDate] = useState('');

  // Estados de Dados Adicionais (Passo 3)
  const [bank, setBank] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [accountType, setAccountType] = useState('');
  const [deficiencyType, setDeficiencyType] = useState('');
  const [cid, setCid] = useState('');
  const [chronicIllness, setChronicIllness] = useState('');
  const [hasRuralWork, setHasRuralWork] = useState(false);
  const [hasMilitaryService, setHasMilitaryService] = useState(false);
  const [hasPublicService, setHasPublicService] = useState(false);
  const [observations, setObservations] = useState('');
  const [dependents, setDependents] = useState<{ name: string; relation: string; birthDate: string; cpf: string }[]>([]);
  const [newDepName, setNewDepName] = useState('');
  const [newDepRelation, setNewDepRelation] = useState('');
  const [newDepBirth, setNewDepBirth] = useState('');
  const [newDepCpf, setNewDepCpf] = useState('');

  // Estados de Honorários Mensais
  const [monthlyValue, setMonthlyValue] = useState('R$ 0,00');
  const [monthlyInstallments, setMonthlyInstallments] = useState('');
  const [monthlyDueDate, setMonthlyDueDate] = useState('');
  const [monthlyStartDate, setMonthlyStartDate] = useState('');
  const [monthlyPaymentMethod, setMonthlyPaymentMethod] = useState('');
  const [monthlyDescription, setMonthlyDescription] = useState('');

  // Honorários Iniciais
  const [initialValue, setInitialValue] = useState('R$ 0,00');
  const [initialInstallments, setInitialInstallments] = useState('');
  const [initialDueDate, setInitialDueDate] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('');

  // Honorários Finais (Ad Exitum)
  const [successPercentage, setSuccessPercentage] = useState('');
  const [successBase, setSuccessBase] = useState('');
  const [successMin, setSuccessMin] = useState('R$ 0,00');

  // Estados de Conferência de Documentos
  const [docConferences, setDocConferences] = useState<{
    processType: string;
    documents: { id: string; name: string; isDelivered: boolean }[];
  }[]>([]);

  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setProcessType('judicial');
    setClientType('pf');
    setBirthDate('');
    setAvatarUrl('');
    setName('');
    setCpf('');
    setRole('');
    setPerfil('');
    setInssPassword('');
    setShowInssPassword(false);
    setPis('');
    setNb('');
    setRg('');
    setNacionalidade('Brasileira');
    setEscolaridade('');
    setEstadoCivil('');
    setProfissao('');
    setClientOrigin('');
    setGuardianCpf('');
    setGuardianName('');
    setGuardianRelationship('');
    setResponsible('');
    setFantasyName('');
    setActivityBranch('');
    setStateRegistration('');
    setMunicipalRegistration('');
    setSite('');
    setEmail1('');
    setEmail2('');
    setPhoneCell('');
    setPhoneRes('');
    setPhoneCom('');
    setPhoneFax('');
    setStateUf('');
    setNeighborhood('');
    setCity('');
    setAddress('');
    setCep('');
    setContactPerson('');
    setContactPhone('');
    setFatherName('');
    setMotherName('');
    setObsTimeline([]);
    setNewObsText('');
    setProcGroup('');
    setProcFolder('0');
    setProcCnj('');
    setProcTag('');
    setProcessNumber('');
    setProcWaitingNumber(false);
    setProcCourt('');
    setProcStatus('');
    setComarca('');
    setComarcaUf('');
    setAreaAtuacao('');
    setProcPhase('');
    setObjetoAcao('');
    setProcResponsible('');
    setProcSubject('');
    setProcLocator('');
    setProcDetails('');
    setProcPartner('');
    setProcPrognosis('');
    setProcOrigin('');
    setProcFree1('');
    setProcFree2('');
    setProcFree3('');
    setProcFree4('');
    setProcFree5('');
    setProcFree6('');
    setProcContractDate('');
    setProcFinalDate('');
    setProcValue('0,00');
    setProcEndDate('');
    setProcSentenceDate('');
    setProcOtherValue('0,00');
    setProcDistributionDate('');
    setProcExecutionDate('');
    setProcContingency('0,00');
    setProcRequest('');
    setProcObservation('');
    setProcSecret('Não');
    setProcCapture('Sim');
    setAdverseParty('');
    setVara('');
    setJuiz('');
    setTipoProcesso('');
    setMedicalPericiaDate('');
    setMedicalPericiaNotified(false);
    setSocialPericiaDate('');
    setSocialPericiaNotified(false);
    setInssExigenciaDate('');
    setInssOrientation('');
    setWaitingInssDecision('');
    setDistributedDate('');
    setLiminarDecision('');
    setIsBlocked('');
    setInAgravo('');
    setTreatmentStartDate('');
    setResponsibleClinic('');
    setAgravoDecision('');
    setConclusoDecisaoDate('');
    setConclusoJulgamentoDate('');
    setBank('');
    setAgency('');
    setAccount('');
    setAccountType('');
    setDeficiencyType('');
    setCid('');
    setChronicIllness('');
    setHasRuralWork(false);
    setHasMilitaryService(false);
    setHasPublicService(false);
    setObservations('');
    setDependents([]);
    setNewDepName('');
    setNewDepRelation('');
    setNewDepBirth('');
    setNewDepCpf('');
    setMonthlyDescription('');
    setInitialValue('R$ 0,00');
    setInitialInstallments('');
    setInitialDueDate('');
    setInitialPaymentMethod('');
    setSuccessPercentage('');
    setSuccessBase('');
    setSuccessMin('R$ 0,00');
    setStatus('Ativo');
    setIsActive(true);
    setDocConferences([]);
    setShowDeleteConfirm(false);
  }, []);

  // Helper para verificar se é menor de idade
  const isMinor = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  };

  // Efeito para carregar dados se for edição
  React.useEffect(() => {
    if (isOpen && clientToEdit) {
      setName(clientToEdit.name || '');
      setCpf(clientToEdit.cpf || '');
      setRole(clientToEdit.role || '');
      setPerfil(clientToEdit.perfil || '');
      setAvatarUrl(clientToEdit.avatar || '');
      setClientType(clientToEdit.company === 'Pessoa Jurídica' ? 'pj' : 'pf');
      setPhoneCell(clientToEdit.phones?.cell || '');
      setPhoneRes(clientToEdit.phones?.res || '');
      setPhoneCom(clientToEdit.phones?.com || '');
      setPhoneFax(clientToEdit.phones?.fax || '');
      setEmail1(clientToEdit.email1 || clientToEdit.email || '');
      setEmail2(clientToEdit.email2 || '');
      setCep(clientToEdit.address?.cep || '');
      setAddress(clientToEdit.address?.street || '');
      setNeighborhood(clientToEdit.address?.neighborhood || '');
      setCity(clientToEdit.address?.city || '');
      setStateUf(clientToEdit.address?.uf || '');
      setMotherName(clientToEdit.motherName || '');
      setFatherName(clientToEdit.family?.father || '');
      setPis(clientToEdit.pis || '');
      setNb(clientToEdit.nb || '');
      setRg(clientToEdit.rg || '');
      setInssPassword(clientToEdit.inssPassword || '');
      setDependents(clientToEdit.dependents || []);
      setObservations(clientToEdit.obs || '');
      setObsTimeline(clientToEdit.extra?.obsTimeline || []);
      setClientOrigin(clientToEdit.origin || '');
      setBirthDate(clientToEdit.birthDate || '');
      setGuardianName(clientToEdit.guardianName || '');
      setGuardianCpf(clientToEdit.guardianCpf || '');
      setGuardianRelationship(clientToEdit.guardianRelationship || '');
      setBank(clientToEdit.bankAccount?.bank || '');
      setAgency(clientToEdit.bankAccount?.agency || '');
      setAccount(clientToEdit.bankAccount?.account || '');
      setAccountType(clientToEdit.bankAccount?.type || '');
      setMonthlyValue(clientToEdit.fees?.monthly?.value || 'R$ 0,00');
      setMonthlyInstallments(clientToEdit.fees?.monthly?.installments || '');
      setMonthlyDueDate(clientToEdit.fees?.monthly?.dueDate || '');
      setMonthlyStartDate(clientToEdit.fees?.monthly?.startDate || '');
      setMonthlyPaymentMethod(clientToEdit.fees?.monthly?.paymentMethod || '');
      setMonthlyDescription(clientToEdit.fees?.monthly?.description || '');

      setInitialValue(clientToEdit.fees?.initial?.value || 'R$ 0,00');
      setInitialInstallments(clientToEdit.fees?.initial?.installments || '');
      setInitialDueDate(clientToEdit.fees?.initial?.dueDate || '');
      setInitialPaymentMethod(clientToEdit.fees?.initial?.paymentMethod || '');

      setSuccessPercentage(clientToEdit.fees?.success?.percentage || '');
      setSuccessBase(clientToEdit.fees?.success?.calculationBase || '');
      setSuccessMin(clientToEdit.fees?.success?.minValue || 'R$ 0,00');
      setStatus(clientToEdit.status || 'Ativo');
      setIsActive(clientToEdit.active !== undefined ? clientToEdit.active : true);
      setDocConferences(clientToEdit.documentConferences || []);
      // ... outros campos podem ser adicionados conforme necessário
    } else if (isOpen && !clientToEdit) {
      resetForm();
    }
  }, [isOpen, clientToEdit, resetForm]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            return;
          }

          if (data) {
            setCurrentUserProfile(data);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching user:', err);
      }
    };

    if (isOpen) {
      fetchCurrentUser();
    }
  }, [isOpen]);



  // Handlers para Foto (Drag & Drop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }

  };

  const handleTypeChange = (type: 'pf' | 'pj') => {
    if (type === clientType) return;

    // Reset all form fields to ensure isolation
    setName('');
    setCpf('');
    setBirthDate('');
    setAvatarUrl('');
    setRole('');
    setPerfil('');
    setInssPassword('');
    setShowInssPassword(false);
    setPis('');
    setNb('');
    setRg('');
    setNacionalidade('Brasileira');
    setEscolaridade('');
    setEstadoCivil('');
    setProfissao('');
    setClientOrigin('');
    setGuardianCpf('');
    setGuardianName('');
    setGuardianRelationship('');
    setResponsible('');
    setFantasyName('');
    setActivityBranch('');
    setStateRegistration('');
    setMunicipalRegistration('');
    setSite('');
    setEmail1('');
    setEmail2('');
    setPhoneCell('');
    setPhoneRes('');
    setPhoneCom('');
    setPhoneFax('');
    setStateUf('');
    setNeighborhood('');
    setCity('');
    setAddress('');
    setCep('');
    setContactPerson('');
    setContactPhone('');
    setFatherName('');
    setMotherName('');
    setObsTimeline([]);
    setNewObsText('');
    setIdError('');

    setClientType(type);
  };

  // CEP Auto-fill Logic
  useEffect(() => {
    const fetchAddress = async () => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        setIsFetchingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();

          if (!data.erro) {
            setAddress(data.logradouro || '');
            setNeighborhood(data.bairro || '');
            setCity(data.localidade || '');
            setStateUf(data.uf || '');
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        } finally {
          setIsFetchingCep(false);
        }
      }
    };

    fetchAddress();
  }, [cep]);

  // Document Validation Logic (CPF/CNPJ)
  useEffect(() => {
    if (!cpf) {
      setIdError('');
      return;
    }

    const cleanId = cpf.replace(/\D/g, '');
    if (clientType === 'pf') {
      if (cleanId.length > 0 && cleanId.length < 11) {
        setIdError('CPF deve ter 11 dígitos');
      } else if (cleanId.length === 11 && !validateCPF(cleanId)) {
        setIdError('CPF Inválido');
      } else {
        setIdError('');
      }
    } else {
      if (cleanId.length > 0 && cleanId.length < 14) {
        setIdError('CNPJ deve ter 14 dígitos');
      } else if (cleanId.length === 14 && !validateCNPJ(cleanId)) {
        setIdError('CNPJ Inválido');
      } else {
        setIdError('');
      }
    }
  }, [cpf, clientType]);

  // CNPJ Auto-fill Logic
  useEffect(() => {
    const fetchCnpjData = async () => {
      if (clientType !== 'pj' || idError) return;

      const cleanId = cpf.replace(/\D/g, '');
      if (cleanId.length === 14) {
        setIsFetchingCnpj(true);
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanId}`);
          if (!response.ok) throw new Error('API Error');
          const data = await response.json();

          if (data) {
            setName(data.razao_social || '');
            setFantasyName(data.nome_fantasia || data.razao_social || '');
            if (data.cnae_fiscal_descricao) {
              setActivityBranch(data.cnae_fiscal_descricao);
            }

            // Endereço
            if (data.cep) setCep(data.cep);
            if (data.logradouro) {
              const fullAddress = `${data.logradouro}${data.numero ? ', ' + data.numero : ''}${data.complemento ? ' - ' : ''}${data.complemento || ''}`;
              setAddress(fullAddress);
            }
            if (data.bairro) setNeighborhood(data.bairro);
            if (data.municipio) setCity(data.municipio);
            if (data.uf) setStateUf(data.uf);
          }
        } catch (error) {
          console.error("Erro ao buscar CNPJ:", error);
        } finally {
          setIsFetchingCnpj(false);
        }
      }
    };

    fetchCnpjData();
  }, [cpf, clientType, idError]);

  if (!isOpen) return null;

  const steps = [
    { id: 0, label: 'Cliente', icon: 'person' },
    { id: 1, label: 'Processo', icon: 'gavel' },
    { id: 2, label: 'Andamentos', icon: 'trending_up' },
    { id: 3, label: 'Dados Adicionais', icon: 'description' },
    { id: 4, label: 'Parte Adversa', icon: 'group' },
    { id: 5, label: 'Honorários', icon: 'attach_money' },
    { id: 6, label: 'Conferência de Documentos', icon: 'fact_check' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSave = () => {
    if (idError) {
      alert(`Por favor, corrija o ${clientType === 'pf' ? 'CPF' : 'CNPJ'} antes de salvar.`);
      return;
    }

    const newClientData = {
      id: clientToEdit?.id || Date.now().toString(),
      name: name || 'Novo Cliente',
      role: objetoAcao || role || 'Interesse Geral',
      perfil: perfil,
      company: clientType === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica',
      time: 'Agora',
      avatar: avatarUrl,
      active: status === 'Ativo' || status === 'Pendente',
      cpf: cpf || '00.000.000/0000-00',
      status: status,
      origin: clientOrigin,
      location: city ? `${city}, ${stateUf}` : 'N/A',
      initials: name ? name.substring(0, 2).toUpperCase() : 'NC',
      color: 'blue',
      birthDate: birthDate,
      guardianName: guardianName,
      guardianCpf: guardianCpf,
      guardianRelationship: guardianRelationship,
      inssPassword: inssPassword,
      email1, email2,
      phones: { cell: phoneCell, res: phoneRes, com: phoneCom, fax: phoneFax },
      address: { cep, street: address, neighborhood, city, uf: stateUf },
      pjExtra: clientType === 'pj' ? { responsible, fantasyName, activityBranch, stateRegistration, municipalRegistration, site } : null,
      family: clientType === 'pf' ? { father: fatherName, mother: motherName } : null,
      pis: pis,
      nb: nb,
      motherName: motherName,
      dependents: dependents,
      emergencyContact: { name: contactPerson, phone: contactPhone },
      bankAccount: { bank, agency, account, type: accountType },
      fees: {
        monthly: {
          value: monthlyValue,
          installments: monthlyInstallments,
          dueDate: monthlyDueDate,
          startDate: monthlyStartDate,
          paymentMethod: monthlyPaymentMethod,
          description: monthlyDescription
        },
        initial: {
          value: initialValue,
          installments: initialInstallments,
          dueDate: initialDueDate,
          paymentMethod: initialPaymentMethod
        },
        success: {
          percentage: successPercentage,
          calculationBase: successBase,
          minValue: successMin
        }
      },
      extra: { obsTimeline },
      process: {
        number: processNumber,
        type: processType,
        judicialData: processType === 'judicial' ? {
          group: procGroup,
          folder: procFolder,
          cnj: procCnj,
          tag: procTag,
          waitingNumber: procWaitingNumber,
          court: procCourt,
          status: procStatus,
          comarca,
          comarcaUf,
          area: areaAtuacao,
          phase: procPhase,
          object: objetoAcao,
          responsible: procResponsible,
          subject: procSubject,
          locator: procLocator,
          details: procDetails,
          partner: procPartner,
          prognosis: procPrognosis,
          origin: procOrigin,
          free1: procFree1,
          free2: procFree2,
          free3: procFree3,
          free4: procFree4,
          free5: procFree5,
          free6: procFree6,
          contractDate: procContractDate,
          finalDate: procFinalDate,
          value: procValue,
          endDate: procEndDate,
          sentenceDate: procSentenceDate,
          otherValue: procOtherValue,
          distributionDate: procDistributionDate,
          executionDate: procExecutionDate,
          contingency: procContingency,
          request: procRequest,
          observation: procObservation,
          secret: procSecret,
          capture: procCapture
        } : null,
        adverse: adverseParty,
        vara,
        juiz,
        tipo: tipoProcesso
      },
      documentConferences: docConferences
    };

    if (onSave) {
      onSave(newClientData);
    }
    onClose();
  };

  const handleAddObservation = () => {
    if (!newObsText.trim()) return;
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const newObs = {
      id: Date.now().toString(),
      text: newObsText.trim(),
      date: formattedDate,
      userName: currentUserProfile?.full_name || 'Usuário',
      userAvatar: currentUserProfile?.avatar_url
    };
    setObsTimeline([...obsTimeline, newObs]);
    setNewObsText('');
  };

  const handleRemoveObservation = (id: string) => {
    setObsTimeline(obsTimeline.filter(obs => obs.id !== id));
  };

  return (
    <div className={`fixed top-0 transition-all duration-300 z-[60] h-full flex flex-col ${isSidebarCollapsed ? 'left-20 w-[calc(100%-80px)]' : 'left-20 lg:left-72 w-[calc(100%-80px)] lg:w-[calc(100%-288px)]'}`}>
      {/* Backdrop - Only covers modal area */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full h-full bg-black shadow-2xl flex flex-col md:flex-row overflow-hidden border-l border-white/10 animate-[fadeIn_0.3s_ease-out]">

        {/* Sidebar Steps */}
        <div className="w-full md:w-64 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col gap-4 shrink-0 backdrop-blur-xl max-h-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-neon-sm shadow-primary/20">
              <span className="material-symbols-outlined text-black font-bold">
                {clientToEdit ? 'edit_square' : 'person_add'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none font-display">
                {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                {clientToEdit ? 'Atualização de Cadastro' : 'Cadastro Unificado'}
              </span>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 scrollbar-hide px-1 flex-1 min-h-0">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-all text-left min-w-[140px] md:min-w-0 group/step relative ${currentStep === step.id
                  ? 'bg-white/10 text-primary shadow-glow shadow-primary/5 ring-1 ring-white/10'
                  : currentStep > step.id
                    ? 'text-slate-500 hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                  }`}
              >
                <div className={`flex items-center justify-center size-8 rounded-xl transition-all duration-300 ${currentStep === step.id
                  ? 'bg-primary text-black scale-110 shadow-neon-sm shadow-primary/40 rotate-1'
                  : currentStep > step.id
                    ? 'bg-emerald-500/10 text-emerald-500 shadow-glow-sm shadow-emerald-500/10'
                    : 'bg-white/5 text-slate-600 group-hover/step:bg-white/10'
                  }`}>
                  <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${currentStep === step.id ? 'scale-110 font-bold' : 'group-hover/step:scale-110'}`}>
                    {currentStep > step.id ? 'check' : step.icon}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-black tracking-tight leading-tight transition-colors ${currentStep === step.id ? 'text-white' : 'text-slate-500'} flex items-center gap-2`}>
                    {step.label}
                    {step.id === 6 && docConferences.some(c => c.documents.some(d => !d.isDelivered)) && (
                      <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full animate-pulse shadow-glow shadow-rose-500/40">
                        {docConferences.reduce((acc, c) => acc + c.documents.filter(d => !d.isDelivered).length, 0)}
                      </span>
                    )}
                  </span>
                  {currentStep === step.id && (
                    <span className="text-[9px] font-bold text-primary uppercase tracking-[0.1em] opacity-80 animate-[fadeIn_0.3s_ease-out]">
                      Editando Agora
                    </span>
                  )}
                </div>
                {currentStep === step.id && (
                  <div className="absolute left-[-24px] md:left-[-24px] w-1.5 h-8 bg-primary rounded-r-full shadow-glow shadow-primary/50 md:block hidden"></div>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-2 space-y-2">
            <button
              onClick={handleSave}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-primary text-black hover:-translate-y-1 shadow-neon shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform font-bold">save</span>
              {clientToEdit ? 'Salvar Alterações' : 'Salvar Cliente'}
            </button>

            {clientToEdit && (
              <div className="mt-3 px-1">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center justify-center gap-2 group/del"
                  >
                    <span className="material-symbols-outlined text-lg group-hover/del:scale-110 transition-transform">delete_forever</span>
                    Excluir
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 animate-[fadeIn_0.2s_ease-out]">
                    <p className="text-[10px] font-black text-rose-500 uppercase text-center tracking-tighter">Confirmar exclusão?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold uppercase hover:bg-white/10"
                      >
                        Não
                      </button>
                      <button
                        onClick={() => {
                          if (onDelete && clientToEdit.id) {
                            onDelete(clientToEdit.id);
                          }
                        }}
                        className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-[10px] font-bold uppercase shadow-glow shadow-rose-500/20"
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background-main relative">
          <div className="absolute top-0 right-0 p-4 z-10">
            <button onClick={onClose} className="size-8 rounded-full bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors border border-white/5">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
            <div className="max-w-4xl mx-auto space-y-6">

              {/* STEP 0: CLIENTE */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="md:col-span-4 flex justify-center mb-6">
                    <div className="bg-white/5 p-1.5 rounded-2xl flex shadow-inner border border-white/10 backdrop-blur-sm">
                      <button
                        onClick={() => handleTypeChange('pf')}
                        className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${clientType === 'pf' ? 'bg-primary text-black shadow-neon-sm scale-105 z-10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                      >Pessoa Física</button>
                      <button
                        onClick={() => handleTypeChange('pj')}
                        className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${clientType === 'pj' ? 'bg-primary text-black shadow-neon-sm scale-105 z-10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                      >Pessoa Jurídica</button>
                    </div>
                  </div>

                  {/* Photo Upload Area */}
                  <div className="md:col-span-4 flex flex-col sm:flex-row items-center gap-8 p-8 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 mb-6 transition-all hover:border-primary/40 group relative overflow-hidden backdrop-blur-sm shadow-sm"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}>

                    {isDragging && (
                      <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] z-20 flex items-center justify-center animate-pulse border-2 border-primary">
                        <div className="flex flex-col items-center text-primary">
                          <span className="material-symbols-outlined text-5xl">upload_file</span>
                          <span className="text-sm font-bold uppercase tracking-widest mt-2">Solte no círculo</span>
                        </div>
                      </div>
                    )}

                    <div className="shrink-0 relative">
                      <div className={`w-32 h-32 rounded-full bg-black border-4 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden ring-1 ring-white/10 transition-transform group-hover:scale-105 ${isDragging ? 'scale-110 rotate-3' : ''}`}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Preview"
                            className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out]"
                            onError={(e) => (e.currentTarget.src = 'https://i.pravatar.cc/150?u=error')}
                          />
                        ) : (
                          <div className="flex flex-col items-center text-slate-500">
                            <span className="material-symbols-outlined text-5xl mb-1">person</span>
                            <span className="text-[10px] font-bold uppercase">Sem Foto</span>
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 size-10 rounded-full bg-primary text-black shadow-neon-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-all border-2 border-black z-10">
                        <span className="material-symbols-outlined text-xl font-bold">add_a_photo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileInput} />
                      </label>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1.5">
                          Upload de Imagem <span className="material-symbols-outlined text-[14px] text-primary">cloud_upload</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-3">Arraste uma foto para o círculo ao lado ou use o botão para selecionar um arquivo do seu dispositivo.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Ou cole uma URL externa</label>
                        <div className="relative group/url">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/url:text-primary transition-colors text-lg">link</span>
                          <input
                            type="text"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://exemplo.com/minha-foto.jpg"
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm text-white placeholder-slate-700 shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {clientType === 'pf' ? (
                    <>
                      <SelectGroup
                        label="Status"
                        options={['Ativo', 'Inativo', 'Pendente', 'Arquivado']}
                        width="md:col-span-4"
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                        icon="info"
                      />

                      <SectionTitle title="Dados Básicos" />
                      <SelectGroup label="Grupo" options={['Adulto', 'Criança', 'Incapaz', 'Outro']} width="md:col-span-2" value={role} onChange={(e: any) => setRole(e.target.value)} />
                      <SelectGroup label="Perfil" options={['Normal', 'VIP', 'Urgente', 'Prospect', 'Parceiro']} width="md:col-span-2" value={perfil} onChange={(e: any) => setPerfil(e.target.value)} />

                      <InputGroup label="Nome Completo" width="md:col-span-3" required value={name} onChange={(e: any) => setName(e.target.value)} />
                      <InputGroup label="Nascimento" type="date" value={birthDate} onChange={(e: any) => setBirthDate(e.target.value)} />

                      {isMinor(birthDate) && (
                        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/20 animate-[fadeIn_0.3s_ease-out] shadow-glow-sm shadow-primary/5">
                          <InputGroup label="Nome do Responsável" width="md:col-span-2" value={guardianName} onChange={(e: any) => setGuardianName(e.target.value)} icon="supervisor_account" />
                          <InputGroup label="CPF do Responsável" placeholder="000.000.000-00" value={guardianCpf} onChange={(e: any) => setGuardianCpf(e.target.value)} />
                          <SelectGroup label="Parentesco" options={['Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão/Irmã', 'Tutor/Curador', 'Outro']} value={guardianRelationship} onChange={(e: any) => setGuardianRelationship(e.target.value)} />
                        </div>
                      )}

                      <InputGroup label="Nacionalidade" value={nacionalidade} onChange={(e: any) => setNacionalidade(e.target.value)} />
                      {!isMinor(birthDate) && (
                        <>
                          <InputGroup label="Profissão" width="md:col-span-2" value={profissao} onChange={(e: any) => setProfissao(e.target.value)} />
                          <SelectGroup label="Estado Civil" options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']} width="md:col-span-1" value={estadoCivil} onChange={(e: any) => setEstadoCivil(e.target.value)} />
                        </>
                      )}
                      <SelectGroup label="Escolaridade" options={['Fundamental Incompleto', 'Fundamental', 'Médio Incompleto', 'Médio', 'Superior Incompleto', 'Superior', 'Pós-Graduação']} width="col-span-1" value={escolaridade} onChange={(e: any) => setEscolaridade(e.target.value)} />
                      <SelectGroup
                        label="Origem do Cliente (Niche)"
                        icon="share"
                        options={['Rede Social (Instagram/FB)', 'Google Ads / Orgânico', 'Site / Landing Page', 'Boca a boca / Indicação', 'Parceria / Outro Escritório', 'Passante / Placa', 'YouTube', 'WhatsApp / Campanhas']}
                        width="md:col-span-4"
                        value={clientOrigin}
                        onChange={(e: any) => setClientOrigin(e.target.value)}
                      />

                      <SectionTitle title="Documentos & Senhas" />
                      <InputGroup label="CPF" placeholder="000.000.000-00" value={cpf} onChange={(e: any) => setCpf(e.target.value)} error={idError} />
                      <InputGroup label="RG" value={rg} onChange={(e: any) => setRg(e.target.value)} />
                      {!isMinor(birthDate) && <InputGroup label="PIS/PASEP" placeholder="000.00000.00-0" value={pis} onChange={(e: any) => setPis(e.target.value)} />}
                      <InputGroup label="Nº Benefício (NB)" placeholder="000.000.000-0" value={nb} onChange={(e: any) => setNb(e.target.value)} />
                      <InputGroup
                        label={isMinor(birthDate) ? "Senha MeuINSS (Resp.)" : "Senha MeuINSS"}
                        width="md:col-span-1"
                        type={showInssPassword ? "text" : "password"}
                        icon="lock"
                        value={inssPassword}
                        onChange={(e: any) => setInssPassword(e.target.value)}
                        placeholder="Senha do portal"
                        rightElement={
                          <button type="button" onClick={() => setShowInssPassword(!showInssPassword)} className="p-1 hover:text-primary text-slate-400 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">{showInssPassword ? 'visibility_off' : 'visibility'}</span>
                          </button>
                        }
                      />

                      <SectionTitle title="Contatos & Canais Digitais" />
                      <InputGroup label="Celular/WhatsApp" icon="smartphone" placeholder="(00) 00000-0000" value={phoneCell} onChange={(e: any) => setPhoneCell(e.target.value)} />
                      <InputGroup label="Tel. Residencial" icon="call" placeholder="(00) 0000-0000" value={phoneRes} onChange={(e: any) => setPhoneRes(e.target.value)} />
                      <InputGroup label="Tel. Comercial" icon="business_center" placeholder="(00) 0000-0000" value={phoneCom} onChange={(e: any) => setPhoneCom(e.target.value)} />
                      <InputGroup label="E-mail 1" icon="mail" width="md:col-span-2" placeholder="email@exemplo.com" value={email1} onChange={(e: any) => setEmail1(e.target.value)} />
                      <InputGroup label="E-mail 2" icon="alternate_email" width="md:col-span-2" placeholder="secundario@exemplo.com" value={email2} onChange={(e: any) => setEmail2(e.target.value)} />

                      <SectionTitle title="Endereço Completo" />
                      <InputGroup
                        label="CEP"
                        icon="map"
                        value={cep}
                        onChange={(e: any) => setCep(e.target.value)}
                        rightElement={isFetchingCep ? <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2"></div> : null}
                      />
                      <InputGroup label="Endereço (Rua, Nº, Comp)" width="md:col-span-2" value={address} onChange={(e: any) => setAddress(e.target.value)} />
                      <SelectGroup label="Estado" icon="flag" options={['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']} value={stateUf} onChange={(e: any) => setStateUf(e.target.value)} />
                      <InputGroup label="Bairro" value={neighborhood} onChange={(e: any) => setNeighborhood(e.target.value)} />
                      <InputGroup label="Cidade" width="md:col-span-3" value={city} onChange={(e: any) => setCity(e.target.value)} />

                      <SectionTitle title="Filiação & Contato de Emergência" />
                      <InputGroup label="Nome do Pai" width="md:col-span-2" icon="person" value={fatherName} onChange={(e: any) => setFatherName(e.target.value)} />
                      <InputGroup label="Nome da Mãe" width="md:col-span-2" icon="person" value={motherName} onChange={(e: any) => setMotherName(e.target.value)} />
                      <InputGroup label="Contato de Emergência" icon="emergency" placeholder="Nome do contato" value={contactPerson} onChange={(e: any) => setContactPerson(e.target.value)} />
                      <InputGroup label="Telefone de Emergência" icon="call" placeholder="(00) 00000-0000" value={contactPhone} onChange={(e: any) => setContactPhone(e.target.value)} />

                      <SectionTitle title="Informações Complementares" />
                      <ObservationTimeline
                        observations={obsTimeline}
                        onAdd={handleAddObservation}
                        onRemove={handleRemoveObservation}
                        newText={newObsText}
                        onTextChange={setNewObsText}
                        placeholder="Adicione uma nova anotação estratégica sobre este lead..."
                      />
                    </>
                  ) : (
                    <>
                      <SelectGroup
                        label="Status"
                        options={['Ativo', 'Inativo', 'Pendente', 'Arquivado']}
                        width="md:col-span-4"
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                        icon="info"
                      />

                      <SectionTitle title="Dados Institucionais" />
                      <SelectGroup label="Grupo" options={['Adulto', 'Criança', 'Incapaz', 'Outro']} width="md:col-span-2" value={role} onChange={(e: any) => setRole(e.target.value)} />
                      <SelectGroup label="Perfil" options={['Normal', 'VIP', 'Urgente', 'Prospect', 'Parceiro']} width="md:col-span-2" value={perfil} onChange={(e: any) => setPerfil(e.target.value)} />

                      <InputGroup label="Razão Social" width="md:col-span-2" required value={name} onChange={(e: any) => setName(e.target.value)} />
                      <InputGroup label="Responsável" width="md:col-span-2" icon="person" value={responsible} onChange={(e: any) => setResponsible(e.target.value)} />
                      <InputGroup label="Nome Fantasia" width="md:col-span-2" value={fantasyName} onChange={(e: any) => setFantasyName(e.target.value)} />
                      <InputGroup label="Ramo de Atividade" width="md:col-span-2" icon="work" value={activityBranch} onChange={(e: any) => setActivityBranch(e.target.value)} />

                      <InputGroup
                        label="CNPJ"
                        placeholder="00.000.000/0000-00"
                        width="md:col-span-2"
                        value={cpf}
                        onChange={(e: any) => setCpf(e.target.value)}
                        error={idError}
                        rightElement={isFetchingCnpj ? <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2"></div> : null}
                      />
                      <InputGroup label="Inscrição Estadual" value={stateRegistration} onChange={(e: any) => setStateRegistration(e.target.value)} />
                      <InputGroup label="Inscrição Municipal" value={municipalRegistration} onChange={(e: any) => setMunicipalRegistration(e.target.value)} />

                      <SectionTitle title="Contatos & Canais Digitais" />
                      <InputGroup label="E-mail 1" icon="mail" width="md:col-span-2" placeholder="email@exemplo.com" value={email1} onChange={(e: any) => setEmail1(e.target.value)} />
                      <InputGroup label="E-mail 2" icon="alternate_email" width="md:col-span-2" placeholder="secundario@exemplo.com" value={email2} onChange={(e: any) => setEmail2(e.target.value)} />
                      <InputGroup label="Celular/WhatsApp" icon="call" placeholder="(00) 00000-0000" value={phoneCell} onChange={(e: any) => setPhoneCell(e.target.value)} />
                      <InputGroup label="Telefone Fixo" icon="call" placeholder="(00) 0000-0000" value={phoneRes} onChange={(e: any) => setPhoneRes(e.target.value)} />
                      <InputGroup label="Site" icon="language" width="md:col-span-3" placeholder="www.exemplo.com.br" value={site} onChange={(e: any) => setSite(e.target.value)} />

                      <SectionTitle title="Localização" />
                      <InputGroup
                        label="CEP"
                        icon="map"
                        value={cep}
                        onChange={(e: any) => setCep(e.target.value)}
                        rightElement={isFetchingCep ? <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2"></div> : null}
                      />
                      <SelectGroup label="Estado" icon="flag" options={['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']} value={stateUf} onChange={(e: any) => setStateUf(e.target.value)} />
                      <InputGroup label="Endereço" width="md:col-span-2" value={address} onChange={(e: any) => setAddress(e.target.value)} />
                      <InputGroup label="Bairro" value={neighborhood} onChange={(e: any) => setNeighborhood(e.target.value)} />
                      <InputGroup label="Cidade" width="md:col-span-3" value={city} onChange={(e: any) => setCity(e.target.value)} />

                      <SectionTitle title="Informações Adicionais" />
                      <ObservationTimeline
                        observations={obsTimeline}
                        onAdd={handleAddObservation}
                        onRemove={handleRemoveObservation}
                        newText={newObsText}
                        onTextChange={setNewObsText}
                        placeholder="Histórico de observações institucionais..."
                      />
                    </>
                  )}
                </div>
              )}

              {/* STEP 1: PROCESSO */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="md:col-span-4 flex justify-center mb-6">
                    <div className="bg-white/5 p-1.5 rounded-2xl flex shadow-inner border border-white/10 backdrop-blur-sm">
                      <button
                        onClick={() => setProcessType('judicial')}
                        className={`px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${processType === 'judicial' ? 'bg-primary text-black shadow-neon-sm scale-105 z-10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                      >
                        <span className={`material-symbols-outlined text-xl font-bold ${processType === 'judicial' ? 'scale-110' : ''}`}>gavel</span> Judicial
                      </button>
                      <button
                        onClick={() => setProcessType('adm')}
                        className={`px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${processType === 'adm' ? 'bg-primary text-black shadow-neon-sm scale-105 z-10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                      >
                        <span className={`material-symbols-outlined text-xl font-bold ${processType === 'adm' ? 'scale-110' : ''}`}>description</span> Administrativo
                      </button>
                    </div>
                  </div>

                  {processType === 'judicial' ? (
                    <>
                      <SectionTitle title="Configurações e Identificação" />
                      <SelectGroup label="Grupo" options={['Previdenciário', 'Trabalhista', 'Cível', 'Saúde']} value={procGroup} onChange={(e: any) => setProcGroup(e.target.value)} />
                      <InputGroup label="Pasta" placeholder="0" value={procFolder} onChange={(e: any) => setProcFolder(e.target.value)} />
                      <InputGroup label="Número CNJ" width="md:col-span-2" placeholder="0000000-00.0000.0.00.0000" value={procCnj} onChange={(e: any) => setProcCnj(e.target.value)} />
                      <InputGroup label="Etiqueta" width="md:col-span-2" icon="label" value={procTag} onChange={(e: any) => setProcTag(e.target.value)} />
                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <InputGroup
                          label="Nº Processo"
                          placeholder="Número do processo"
                          value={processNumber}
                          onChange={(e: any) => setProcessNumber(e.target.value)}
                          disabled={procWaitingNumber}
                        />
                        <label className="flex items-center gap-2 px-1 cursor-pointer group/check">
                          <input type="checkbox" checked={procWaitingNumber} onChange={() => setProcWaitingNumber(!procWaitingNumber)} className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase group-hover/check:text-slate-400 transition-colors">Aguardando numeração</span>
                        </label>
                      </div>

                      <SectionTitle title="Trâmite e Status" />
                      <SelectGroup label="Local de trâmite" options={['Justiça Federal', 'Justiça Estadual', 'TRF', 'STJ', 'STF']} value={procCourt} onChange={(e: any) => setProcCourt(e.target.value)} />
                      <SelectGroup label="Status processual" options={['Em andamento', 'Suspenso', 'Arquivado', 'Baixado']} value={procStatus} onChange={(e: any) => setProcStatus(e.target.value)} />
                      <InputGroup label="Comarca" width="md:col-span-2" placeholder="Digite a comarca..." value={comarca} onChange={(e: any) => setComarca(e.target.value)} />
                      <SelectGroup label="UF Comarca" icon="flag" options={['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']} value={comarcaUf} onChange={(e: any) => setComarcaUf(e.target.value)} />

                      <SectionTitle title="Classificação do Caso" />
                      <SelectGroup label="Área Atuação" options={['Previdenciário', 'Saúde', 'Trabalhista']} value={areaAtuacao} onChange={(e: any) => setAreaAtuacao(e.target.value)} />
                      <SelectGroup label="Fase" options={['Conhecimento', 'Execução', 'Recursal']} value={procPhase} onChange={(e: any) => setProcPhase(e.target.value)} />
                      <SelectGroup label="Objeto da ação" width="md:col-span-2" options={['Medicamento', 'LOAS', 'Aposentadoria', 'Revisão', 'Terapias', 'Redução de carga horária', 'Monitor escolar']} value={objetoAcao} onChange={(e: any) => setObjetoAcao(e.target.value)} />
                      <SelectGroup label="Responsável" options={['Dr. Silva', 'Dra. Costa', 'Dr. Roberto']} value={procResponsible} onChange={(e: any) => setProcResponsible(e.target.value)} />
                      <SelectGroup label="Assunto" options={['Saúde Pública', 'Benefício Assistencial', 'Tempo Rural']} value={procSubject} onChange={(e: any) => setProcSubject(e.target.value)} />
                      <SelectGroup label="Localizador" options={['Gaveta 1', 'Arquivo Morto', 'Prateleira A']} value={procLocator} onChange={(e: any) => setProcLocator(e.target.value)} />
                      <SelectGroup label="Detalhes" options={['Urgente', 'Alta Prioridade', 'Processo Piloto']} value={procDetails} onChange={(e: any) => setProcDetails(e.target.value)} />
                      <SelectGroup label="Parceiro" options={['Escritório X', 'Contador Y', 'Sem Parceiro']} value={procPartner} onChange={(e: any) => setProcPartner(e.target.value)} />
                      <SelectGroup label="Prognóstico" options={['Provável', 'Possível', 'Remoto']} value={procPrognosis} onChange={(e: any) => setProcPrognosis(e.target.value)} />
                      <SelectGroup label="Origem" options={['Indicação', 'Google', 'Passante']} value={procOrigin} onChange={(e: any) => setProcOrigin(e.target.value)} />

                      <SectionTitle title="Campos Livres" />
                      <SelectGroup label="Campo livre 1" options={['Opção A', 'Opção B']} value={procFree1} onChange={(e: any) => setProcFree1(e.target.value)} />
                      <SelectGroup label="Campo livre 2" options={['Opção C', 'Opção D']} value={procFree2} onChange={(e: any) => setProcFree2(e.target.value)} />
                      <InputGroup label="Campo livre 3" value={procFree3} onChange={(e: any) => setProcFree3(e.target.value)} />
                      <InputGroup label="Campo livre 4" value={procFree4} onChange={(e: any) => setProcFree4(e.target.value)} />
                      <InputGroup label="Campo livre 5" value={procFree5} onChange={(e: any) => setProcFree5(e.target.value)} />
                      <SelectGroup label="Campo livre 6" options={['Opção E', 'Opção F']} value={procFree6} onChange={(e: any) => setProcFree6(e.target.value)} />

                      <SectionTitle title="Datas e Valores" />
                      <InputGroup label="Contratação" type="date" value={procContractDate} onChange={(e: any) => setProcContractDate(e.target.value)} />
                      <InputGroup label="Trânsito julgado" type="date" value={procFinalDate} onChange={(e: any) => setProcFinalDate(e.target.value)} />
                      <InputGroup label="Valor da causa" placeholder="0,00" value={procValue} onChange={(e: any) => setProcValue(e.target.value)} />
                      <InputGroup label="Encerramento" type="date" value={procEndDate} onChange={(e: any) => setProcEndDate(e.target.value)} />
                      <InputGroup label="Sentença" type="date" value={procSentenceDate} onChange={(e: any) => setProcSentenceDate(e.target.value)} />
                      <InputGroup label="Outro valor" placeholder="0,00" value={procOtherValue} onChange={(e: any) => setProcOtherValue(e.target.value)} />
                      <InputGroup label="Distribuição" type="date" value={procDistributionDate} onChange={(e: any) => setProcDistributionDate(e.target.value)} />
                      <InputGroup label="Execução" type="date" value={procExecutionDate} onChange={(e: any) => setProcExecutionDate(e.target.value)} />
                      <InputGroup label="Contingência" placeholder="0,00" value={procContingency} onChange={(e: any) => setProcContingency(e.target.value)} />
                      <InputGroup label="Pedido" width="md:col-span-3" value={procRequest} onChange={(e: any) => setProcRequest(e.target.value)} />

                      <SectionTitle title="Configurações e Notas" />
                      <TextareaGroup label="Observação" width="md:col-span-4" value={procObservation} onChange={(e: any) => setProcObservation(e.target.value)} />
                      <RadioGroup label="Segredo de justiça?" options={['Sim', 'Não']} value={procSecret} onChange={setProcSecret} />
                      <RadioGroup label="Capturar andamentos?" options={['Sim', 'Não']} value={procCapture} onChange={setProcCapture} />
                    </>
                  ) : (
                    <>
                      <SectionTitle title="Identificação Administrativa" />
                      <InputGroup
                        label="Protocolo / Requerimento"
                        width="md:col-span-2"
                        icon="tag"
                        placeholder="0000000000"
                        value={processNumber}
                        onChange={(e: any) => setProcessNumber(e.target.value)}
                      />
                      <InputGroup
                        label="Órgão / Parte Adversa"
                        width="md:col-span-2"
                        icon="group"
                        placeholder="INSS / Empresa"
                        value={adverseParty}
                        onChange={(e: any) => setAdverseParty(e.target.value)}
                      />
                      <SelectGroup
                        label="Área de Atuação"
                        icon="category"
                        value={areaAtuacao}
                        onChange={(e: any) => setAreaAtuacao(e.target.value)}
                        options={['Saúde', 'Previdenciário', 'Redução de Carga Horária']}
                      />
                      <SelectGroup
                        label="Objeto"
                        width="md:col-span-3"
                        icon="info"
                        value={objetoAcao}
                        onChange={(e: any) => setObjetoAcao(e.target.value)}
                        options={['Medicamentos', 'LOAS', 'Auxílio Doença', 'Aposentadoria', 'Terapias', 'Redução de carga horária', 'Monitor escolar']}
                      />
                    </>
                  )}
                </div>
              )}

              {/* STEP 2: ANDAMENTOS PROCESSUAIS */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-[fadeIn_0.3s_ease-out]">
                  <SectionTitle title="Perícias & Requerimentos INSS" />

                  <div className="md:col-span-2 flex flex-col gap-1">
                    <InputGroup label="Agendamento Perícia Médica" type="date" value={medicalPericiaDate} onChange={(e: any) => setMedicalPericiaDate(e.target.value)} icon="medical_services" />
                    <CheckboxItem label="Cliente avisado da perícia?" checked={medicalPericiaNotified} onChange={() => setMedicalPericiaNotified(!medicalPericiaNotified)} />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1">
                    <InputGroup label="Agendamento Perícia Social" type="date" value={socialPericiaDate} onChange={(e: any) => setSocialPericiaDate(e.target.value)} icon="diversity_3" />
                    <CheckboxItem label="Cliente avisado da perícia?" checked={socialPericiaNotified} onChange={() => setSocialPericiaNotified(!socialPericiaNotified)} />
                  </div>

                  <div className="md:col-span-4 bg-white/5 border border-white/10 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 backdrop-blur-sm">
                    <InputGroup label="Exigência INSS (Data Final)" type="date" value={inssExigenciaDate} onChange={(e: any) => setInssExigenciaDate(e.target.value)} icon="priority_high" />
                    <TextareaGroup label="Orientação para cumprimento" width="md:col-span-3" value={inssOrientation} onChange={(e: any) => setInssOrientation(e.target.value)} placeholder="Descreva os documentos necessários e o que o cliente deve fazer..." />
                  </div>

                  <SelectGroup label="Aguardando Decisão INSS" options={['Sim', 'Não', 'Análise Pendente', 'Concedido', 'Indeferido']} value={waitingInssDecision} onChange={(e: any) => setWaitingInssDecision(e.target.value)} icon="hourglass_top" />

                  <SectionTitle title="Fases Judiciais & Protocolos" />
                  <InputGroup label="Distribuído em" type="date" value={procDistributionDate} onChange={(e: any) => setProcDistributionDate(e.target.value)} icon="send" />
                  <InputGroup label="Decisão Liminar" placeholder="Status ou descrição" value={liminarDecision} onChange={(e: any) => setLiminarDecision(e.target.value)} icon="gavel" />
                  <InputGroup label="Em Bloqueio" placeholder="Motivo/Status" value={isBlocked} onChange={(e: any) => setIsBlocked(e.target.value)} icon="block" />
                  <InputGroup label="Em Agravo de Instrumento" placeholder="ID/Status" value={inAgravo} onChange={(e: any) => setInAgravo(e.target.value)} icon="quick_reference" />

                  <SectionTitle title="Tratamento & Clínicas (Casos Saúde)" />
                  <InputGroup label="Início do Tratamento" type="date" value={treatmentStartDate} onChange={(e: any) => setTreatmentStartDate(e.target.value)} icon="calendar_today" />
                  <InputGroup label="Clínica Responsável" width="md:col-span-3" placeholder="Nome da instituição" value={responsibleClinic} onChange={(e: any) => setResponsibleClinic(e.target.value)} icon="home_health" />

                  <SectionTitle title="Decisões & Prazos Conclusos" />
                  <InputGroup label="Decisão do Agravo" width="md:col-span-2" placeholder="Resultado/Fase" value={agravoDecision} onChange={(e: any) => setAgravoDecision(e.target.value)} icon="feedback" />
                  <InputGroup label="Concluso para Decisão" type="date" value={conclusoDecisaoDate} onChange={(e: any) => setConclusoDecisaoDate(e.target.value)} icon="history_edu" />
                  <InputGroup label="Concluso para Julgamento" type="date" value={conclusoJulgamentoDate} onChange={(e: any) => setConclusoJulgamentoDate(e.target.value)} icon="gavel" />
                </div>
              )}

              {/* STEP 3: DADOS ADICIONAIS */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-[fadeIn_0.3s_ease-out]">
                  <SectionTitle title="Saúde & Condições Especiais" />
                  <SelectGroup label="Tipo de Deficiência" width="md:col-span-2" icon="accessible" options={['Não possui', 'Física', 'Mental', 'Intelectual', 'Visual', 'Auditiva']} value={deficiencyType} onChange={(e: any) => setDeficiencyType(e.target.value)} />
                  <InputGroup label="CID (Classificação Int. de Doenças)" icon="medical_information" placeholder="Ex: M54.5" value={cid} onChange={(e: any) => setCid(e.target.value)} />
                  <InputGroup label="Doença Crônica / Grave" placeholder="Descreva se houver" value={chronicIllness} onChange={(e: any) => setChronicIllness(e.target.value)} />

                  <SectionTitle title="Histórico & Períodos Especiais" />
                  <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CheckboxItem
                      label="Trabalho Rural"
                      icon="agriculture"
                      checked={hasRuralWork}
                      onChange={() => setHasRuralWork(!hasRuralWork)}
                    />
                    <CheckboxItem
                      label="Serviço Militar"
                      icon="military_tech"
                      checked={hasMilitaryService}
                      onChange={() => setHasMilitaryService(!hasMilitaryService)}
                    />
                    <CheckboxItem
                      label="Serviço Público"
                      icon="account_balance_wallet"
                      checked={hasPublicService}
                      onChange={() => setHasPublicService(!hasPublicService)}
                    />
                  </div>

                  <SectionTitle title="Dependentes (Filhos / Cônjuge)" />
                  <div className="md:col-span-4 bg-white/5 border border-white/10 p-4 rounded-2xl space-y-4 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <InputGroup label="Nome do Dependente" value={newDepName} onChange={(e: any) => setNewDepName(e.target.value)} />
                      <SelectGroup label="Parentesco" options={['Cônjuge/Companheiro(a)', 'Filho(a)', 'Enteado(a)', 'Pai/Mãe', 'Outro']} value={newDepRelation} onChange={(e: any) => setNewDepRelation(e.target.value)} />
                      <InputGroup label="CPF" placeholder="000.000.000-00" value={newDepCpf} onChange={(e: any) => setNewDepCpf(e.target.value)} />
                      <div className="flex items-end gap-2">
                        <InputGroup label="Nascimento" type="date" value={newDepBirth} onChange={(e: any) => setNewDepBirth(e.target.value)} />
                        <button
                          onClick={() => {
                            if (newDepName && newDepRelation) {
                              setDependents([...dependents, { name: newDepName, relation: newDepRelation, birthDate: newDepBirth, cpf: newDepCpf }]);
                              setNewDepName(''); setNewDepRelation(''); setNewDepBirth(''); setNewDepCpf('');
                            }
                          }}
                          className="h-10 px-4 rounded-lg bg-primary text-black font-bold hover:scale-105 transition-all flex items-center justify-center shadow-neon-sm shadow-primary/20"
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                    </div>

                    {dependents.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <div className="space-y-2">
                          {dependents.map((dep, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-primary/30 transition-all shadow-sm">
                              <div className="flex gap-4 items-center">
                                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center text-primary font-bold text-xs border border-white/10">
                                  {dep.relation.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{dep.name}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-medium">{dep.relation} • {dep.cpf || 'Sem CPF'} • {dep.birthDate || 'Sem Data'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setDependents(dependents.filter((_, i) => i !== idx))}
                                className="size-8 rounded-full hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <SectionTitle title="Observações Estratégicas" />
                  <TextareaGroup
                    label="Anotações Gerais do Caso"
                    width="md:col-span-4"
                    placeholder="Detalhes relevantes para o planejamento previdenciário ou histórico do cliente..."
                    value={observations}
                    onChange={(e: any) => setObservations(e.target.value)}
                  />
                </div>
              )}

              {/* STEP 4: PARTE ADVERSA */}
              {currentStep === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-[fadeIn_0.3s_ease-out]">
                  <SectionTitle title="Identificação da Parte Adversa" />
                  <InputGroup label="Nome / Razão Social" width="md:col-span-3" icon="corporate_fare" />
                  <SelectGroup label="Tipo" options={['Empresa Privada', 'Órgão Público', 'Autarquia (INSS)', 'Pessoa Física']} />

                  <InputGroup label="CNPJ / CPF" placeholder="00.000.000/0000-00" />
                  <InputGroup label="Representante Legal" width="md:col-span-2" icon="person" />
                  <InputGroup label="Telefone de Contato" icon="call" />

                  <SectionTitle title="Advogado da Parte Adversa" />
                  <InputGroup label="Nome do Advogado" width="md:col-span-2" icon="badge" />
                  <InputGroup label="OAB" placeholder="00.000 / UF" />
                  <InputGroup label="E-mail" icon="mail" />
                </div>
              )}

              {/* STEP 5: HONORÁRIOS */}
              {currentStep === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* 1. Dados Bancários */}
                  <div className="md:col-span-4 p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 hover:border-primary/20 transition-all duration-500 group/hcard3">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-10 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center transition-transform duration-300 group-hover/hcard3:scale-110 group-hover/hcard3:rotate-3 shadow-inner">
                        <span className="material-symbols-outlined">account_balance</span>
                      </div>
                      <h3 className="text-[12px] font-black text-cyan-600 uppercase tracking-[0.2em]">
                        Dados Bancários para Pagamento
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <InputGroup label="Banco" width="md:col-span-2" icon="account_balance" value={bank} onChange={(e: any) => setBank(e.target.value)} />
                      <InputGroup label="Agência" value={agency} onChange={(e: any) => setAgency(e.target.value)} />
                      <InputGroup label="Conta Corrente / Poupança" value={account} onChange={(e: any) => setAccount(e.target.value)} />
                      <SelectGroup label="Tipo de Conta" options={['Conta Corrente', 'Poupança', 'Conta Salário', 'Cartão Magnético']} width="md:col-span-4" value={accountType} onChange={(e: any) => setAccountType(e.target.value)} />
                    </div>
                  </div>

                  {/* 2. Honorários Mensais */}
                  <div className="md:col-span-4 p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 hover:border-primary/20 transition-all duration-500 group/hcard4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-transform duration-300 group-hover/hcard4:scale-110 group-hover/hcard4:rotate-3 shadow-inner">
                        <span className="material-symbols-outlined">event_repeat</span>
                      </div>
                      <h3 className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                        Honorários mensais
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <InputGroup label="Valor" placeholder="R$ 0,00" icon="payments" value={monthlyValue} onChange={(e: any) => setMonthlyValue(e.target.value)} />
                      <SelectGroup
                        label="Parcelas"
                        options={['À vista', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x', '11x', '12x', '13x', '14x', '15x', '16x', '17x', '18x', '19x', '20x', '21x', '22x', '23x', '24x', 'Recorrente']}
                        value={monthlyInstallments}
                        onChange={(e: any) => setMonthlyInstallments(e.target.value)}
                      />
                      <InputGroup label="1º vencimento" type="number" placeholder="Dia" value={monthlyDueDate} onChange={(e: any) => setMonthlyDueDate(e.target.value)} />
                      <InputGroup label="Data Início" type="date" value={monthlyStartDate} onChange={(e: any) => setMonthlyStartDate(e.target.value)} />
                      <SelectGroup
                        label="Forma de Pag."
                        options={['Pix', 'Boleto', 'Cartão de Crédito', 'Dinheiro']}
                        value={monthlyPaymentMethod}
                        onChange={(e: any) => setMonthlyPaymentMethod(e.target.value)}
                      />
                      <TextareaGroup label="Descrição" width="md:col-span-4" placeholder="Campo livre para detalhes adicionais..." value={monthlyDescription} onChange={(e: any) => setMonthlyDescription(e.target.value)} />
                    </div>
                  </div>

                  {/* 3. Honorários Iniciais */}
                  <div className="md:col-span-4 p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 hover:border-primary/20 transition-all duration-500 group/hcard">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover/hcard:scale-110 group-hover/hcard:rotate-3 shadow-inner">
                        <span className="material-symbols-outlined">payments</span>
                      </div>
                      <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.2em]">
                        Honorários Iniciais (Pró-Labore)
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <InputGroup label="Valor de Entrada" placeholder="R$ 0,00" icon="payments" value={initialValue} onChange={(e: any) => setInitialValue(e.target.value)} />
                      <InputGroup label="Quantidade de Parcelas" placeholder="Ex: 1" value={initialInstallments} onChange={(e: any) => setInitialInstallments(e.target.value)} />
                      <InputGroup label="Vencimento 1ª Parcela" type="date" value={initialDueDate} onChange={(e: any) => setInitialDueDate(e.target.value)} />
                      <SelectGroup label="Forma de Pagamento" options={['Boleto', 'Pix', 'Cartão de Crédito', 'Transferência']} value={initialPaymentMethod} onChange={(e: any) => setInitialPaymentMethod(e.target.value)} />
                    </div>
                  </div>

                  {/* 4. Honorários Ad Exitum */}
                  <div className="md:col-span-4 p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 hover:border-primary/20 transition-all duration-500 group/hcard2">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center transition-transform duration-300 group-hover/hcard2:scale-110 group-hover/hcard2:rotate-3 shadow-inner">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <h3 className="text-[12px] font-black text-amber-600 uppercase tracking-[0.2em]">
                        Honorários Ad Exitum (Finais)
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <InputGroup label="Porcentagem (%)" placeholder="Ex: 30%" icon="percent" value={successPercentage} onChange={(e: any) => setSuccessPercentage(e.target.value)} />
                      <SelectGroup label="Base de Cálculo" options={['Bruto da Condenação', 'Líquido da Condenação', 'Valor do Benefício', 'Outro']} width="md:col-span-2" value={successBase} onChange={(e: any) => setSuccessBase(e.target.value)} />
                      <InputGroup label="Valor Mínimo" placeholder="R$ 0,00" value={successMin} onChange={(e: any) => setSuccessMin(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: CONFERÊNCIA DE DOCUMENTOS */}
              {currentStep === 6 && (
                <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                  <SectionTitle title="Conferência de Documentos" />

                  {docConferences.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 backdrop-blur-sm">
                      <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">fact_check</span>
                      <p className="text-slate-500 font-medium mb-6">Nenhuma conferência iniciada para este cliente.</p>
                      <button
                        onClick={() => setDocConferences([{ processType: '', documents: [] }])}
                        className="px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm shadow-neon-sm shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all"
                      >
                        <span className="material-symbols-outlined font-bold">add</span> Iniciar Conferência
                      </button>
                    </div>
                  ) : (
                    docConferences.map((conf, confIdx) => (
                      <div key={confIdx} className="p-8 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 transition-all relative group hover:border-primary/20">
                        <button
                          onClick={() => setDocConferences(prev => prev.filter((_, i) => i !== confIdx))}
                          className="absolute top-6 right-6 p-2 rounded-full hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                          <div className="md:col-span-2">
                            <InputGroup
                              label="Tipo do Processo"
                              placeholder="Ex: Previdenciário, Saúde..."
                              value={conf.processType}
                              onChange={(e: any) => {
                                const newConfs = [...docConferences];
                                newConfs[confIdx].processType = e.target.value;
                                setDocConferences(newConfs);
                              }}
                              icon="account_tree"
                            />
                          </div>
                          <div className="md:col-span-2 flex items-end justify-end">
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500 shadow-glow shadow-amber-500/5">
                              <span className="material-symbols-outlined text-lg font-bold">warning</span>
                              <span className="text-[11px] font-black uppercase tracking-wider">
                                {conf.documents.filter(d => !d.isDelivered).length} Pendentes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 pl-1">Documentos do Cliente</label>
                          {conf.documents.map((doc, docIdx) => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 shadow-sm group/doc hover:border-primary/30 transition-all">
                              <button
                                onClick={() => {
                                  const newConfs = [...docConferences];
                                  newConfs[confIdx].documents[docIdx].isDelivered = !newConfs[confIdx].documents[docIdx].isDelivered;
                                  setDocConferences(newConfs);
                                }}
                                className={`size-10 rounded-xl flex items-center justify-center border-2 transition-all ${doc.isDelivered ? 'bg-emerald-500 border-emerald-500 text-black shadow-glow shadow-emerald-500/20' : 'bg-black/40 border-white/10 text-slate-600 hover:border-white/20'}`}
                              >
                                <span className="material-symbols-outlined text-xl font-bold">
                                  {doc.isDelivered ? 'check' : 'close'}
                                </span>
                              </button>

                              <input
                                type="text"
                                value={doc.name}
                                placeholder="Nome do documento..."
                                onChange={(e) => {
                                  const newConfs = [...docConferences];
                                  newConfs[confIdx].documents[docIdx].name = e.target.value;
                                  setDocConferences(newConfs);
                                }}
                                className={`flex-1 bg-transparent border-none outline-none text-sm font-medium transition-colors ${doc.isDelivered ? 'text-slate-500 line-through' : 'text-white'}`}
                              />

                              <button
                                onClick={() => {
                                  const newConfs = [...docConferences];
                                  newConfs[confIdx].documents = newConfs[confIdx].documents.filter((_, i) => i !== docIdx);
                                  setDocConferences(newConfs);
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/doc:opacity-100 transition-all"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            const newConfs = [...docConferences];
                            newConfs[confIdx].documents.push({ id: Date.now().toString(), name: '', isDelivered: false });
                            setDocConferences(newConfs);
                          }}
                          className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2 group/add"
                        >
                          <span className="material-symbols-outlined group-hover/add:scale-125 transition-transform">add_circle</span>
                          <span className="text-xs font-bold uppercase tracking-widest">Adicionar Item</span>
                        </button>
                      </div>
                    ))
                  )}

                  {docConferences.length > 0 && (
                    <button
                      onClick={() => setDocConferences([...docConferences, { processType: '', documents: [] }])}
                      className="w-full py-6 rounded-[2rem] border-2 border-dashed border-primary/20 text-primary/60 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 group/add2"
                    >
                      <span className="material-symbols-outlined text-3xl group-hover/add2:scale-110 transition-transform">add_task</span>
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Adicionar Nova Conferência</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-6 md:p-8 bg-black border-t border-white/10 flex justify-between items-center shrink-0 backdrop-blur-md">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-primary hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-xl font-bold">keyboard_backspace</span> Anterior
            </button>

            <div className="flex gap-4">
              <button onClick={onClose} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                Cancelar
              </button>
              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleNext}
                  className="px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-black hover:scale-105 shadow-neon shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-3 group/next"
                >
                  Próximo <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform font-bold">arrow_right_alt</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewClientModal;