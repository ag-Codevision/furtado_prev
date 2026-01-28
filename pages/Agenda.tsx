import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { AgendaEvent } from '../types';

const Agenda: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, categories, addCategory, updateCategory, deleteCategory } = useData();

  // Função auxiliar para normalizar texto (remover acentos)
  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // --- ESTADOS ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedDayView, setSelectedDayView] = useState<{ day: number, month: number, year: number } | null>(null);

  // Estados para os Seletores de Mês/Ano
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);

  // Estados para nova categoria
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatColor, setNewCatColor] = useState('indigo');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Estados do Formulário de Novo Evento
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<string>('Perícias');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newResponsibleId, setNewResponsibleId] = useState<string>('');
  const [newClientId, setNewClientId] = useState<string>('');
  const [newNb, setNewNb] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const { teamMembers, clients } = useData();

  // --- LOGICA DE CALENDÁRIO ---
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const viewMonth = currentDate.getMonth();
  const viewYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Dias do mês anterior para preencher o grid
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    month: viewMonth - 1,
    year: viewYear,
    isCurrentMonth: false
  }));

  // Dias do mês atual
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    month: viewMonth,
    year: viewYear,
    isCurrentMonth: true
  }));

  // Total de dias para exibir (grid completando as semanas)
  const allDays = [...prevMonthDays, ...currentMonthDays];
  const remainingDays = 42 - allDays.length;
  const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
    day: i + 1,
    month: viewMonth + 1,
    year: viewYear,
    isCurrentMonth: false
  }));

  const calendarGrid = [...allDays, ...nextMonthDays];

  // --- FILTRAGEM ---
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (selectedFilter === 'Todos') return true;
      return event.type === selectedFilter;
    });
  }, [events, selectedFilter]);

  // --- NAVEGAÇÃO ---
  const prevMonth = () => setCurrentDate(new Date(viewYear, viewMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(viewYear, viewMonth + 1, 1));

  // --- ACTIONS ---
  const openNewEventModal = () => {
    setEditingEventId(null);
    setNewTitle(''); setNewDate(''); setNewTime(''); setNewLocation(''); setNewDescription('');
    setNewResponsibleId(''); setNewClientId(''); setNewNb('');
    setNewType(categories[0]?.label || 'Outro');
    setIsModalOpen(true);
  };

  const openEditEventModal = (event: AgendaEvent) => {
    setEditingEventId(event.id);
    setNewTitle(event.title);
    setNewDate(event.date);
    setNewTime(event.time || '');
    setNewLocation(event.location || '');
    setNewDescription(event.description || '');
    setNewType(event.type);
    setNewResponsibleId(event.responsibleId || '');
    setNewClientId(event.clientId || '');
    setNewNb(event.nb || '');
    setIsModalOpen(true);
  };

  const handleAddEvent = () => {
    if (!newTitle || !newDate) return;
    const event: AgendaEvent = {
      id: editingEventId || Date.now().toString(),
      title: newTitle,
      date: newDate,
      time: newTime,
      type: newType,
      location: newLocation,
      description: newDescription,
      responsibleId: newResponsibleId || undefined,
      clientId: newClientId || undefined,
      nb: newNb || undefined
    };

    if (editingEventId) {
      updateEvent(event);
    } else {
      addEvent(event);
    }

    setIsModalOpen(false);
    // Reset
    setNewTitle(''); setNewDate(''); setNewTime(''); setNewLocation(''); setNewDescription('');
    setNewResponsibleId(''); setNewClientId(''); setNewNb('');
    setClientSearch(''); setIsClientDropdownOpen(false);
    setEditingEventId(null);
  };

  const handleAddCategory = () => {
    if (!newCatLabel) return;
    const cat = {
      id: editingCategoryId || Date.now().toString(),
      label: newCatLabel,
      color: newCatColor
    };
    if (editingCategoryId) {
      updateCategory(cat);
    } else {
      addCategory(cat);
    }
    setEditingCategoryId(null);
    setNewCatLabel('');
    setNewCatColor('indigo');
    // We keep the modal open to let them manage more if they want, 
    // but the user might expect it to close?
    // Let's close it only if it's a "New" one, or explicitly closed.
    // Actually, usually managing categories is a separate view.
    // For now, let's just close it.
    setIsNewCategoryModalOpen(false);
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategoryId(cat.id);
    setNewCatLabel(cat.label);
    setNewCatColor(cat.color);
  };

  const getCategoryColor = (type: string) => {
    const cat = categories.find(c => c.label === type);
    return cat?.color || 'slate';
  };

  const getEventsForDay = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.date === dateStr);
  };

  // Hoje formatado
  const today = new Date();
  // const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="flex h-full overflow-hidden relative bg-black">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* SEÇÃO PRINCIPAL (HEADER + CALENDÁRIO) */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex-shrink-0 px-8 py-6 z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-4xl font-light tracking-tight text-white font-display"><span className="font-bold text-primary">Agenda</span></h2>
            <p className="text-slate-500 text-sm font-light tracking-wide uppercase tracking-[0.1em]">Controle de perícias médicas, prazos administrativos e audiências.</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedDayView && (
              <button
                onClick={() => setSelectedDayView(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors pr-4 border-r border-white/10"
              >
                <span className="material-symbols-outlined font-bold">arrow_back</span>
                <span className="text-sm font-bold uppercase tracking-widest">Voltar ao Mês</span>
              </button>
            )}
            <div className="hidden md:flex p-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-sm items-center max-w-[850px]">
              <div className="flex items-center overflow-x-auto scrollbar-hide px-1 gap-1">
                <button
                  onClick={() => setSelectedFilter('Todos')}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all ${selectedFilter === 'Todos'
                    ? 'bg-primary text-black shadow-neon-sm'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFilter(cat.label)}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all ${selectedFilter === cat.label
                      ? `bg-${cat.color}-500/20 text-${cat.color}-500 border border-${cat.color}-500/30 shadow-sm shadow-${cat.color}-500/10`
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsNewCategoryModalOpen(true)}
                className="size-8 flex-shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-white/10 hover:text-primary transition-all ml-1"
                title="Gerenciar Categorias"
              >
                <span className="material-symbols-outlined text-[18px] font-bold">settings</span>
              </button>
            </div>
            <button
              onClick={openNewEventModal}
              className="flex items-center gap-2 bg-primary hover:scale-105 text-black pl-4 pr-5 py-2.5 rounded-full transition-all shadow-neon hover:shadow-primary/30 active:scale-95 group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-90 font-bold">add</span>
              <span className="text-sm font-bold tracking-wide uppercase">Novo Evento</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 pb-8 overflow-hidden z-10">
          <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden relative shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2 relative">
                <button onClick={prevMonth} className="size-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm font-bold">arrow_back_ios_new</span>
                </button>

                <div className="flex items-center gap-1 group">
                  {/* Seletor de Mês */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
                      className="text-xl font-bold text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1"
                    >
                      {monthNames[viewMonth]}
                      <span className={`material-symbols-outlined text-sm transition-transform text-primary ${isMonthSelectorOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {isMonthSelectorOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-black rounded-2xl shadow-2xl border border-white/10 z-[100] p-2 grid grid-cols-2 gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {monthNames.map((m, idx) => (
                          <button
                            key={m}
                            onClick={() => {
                              setCurrentDate(new Date(viewYear, idx, 1));
                              setIsMonthSelectorOpen(false);
                            }}
                            className={`px-3 py-2 text-xs font-bold rounded-xl text-left transition-all ${viewMonth === idx ? 'bg-primary text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                          >
                            {m.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seletor de Ano */}
                  <div className="relative">
                    <button
                      onClick={() => setIsYearSelectorOpen(!isYearSelectorOpen)}
                      className="text-xl font-light text-slate-500 px-2 py-1 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1"
                    >
                      {viewYear}
                      <span className={`material-symbols-outlined text-sm transition-transform text-primary ${isYearSelectorOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {isYearSelectorOpen && (
                      <div className="absolute top-full left-0 mt-2 w-32 bg-black rounded-2xl shadow-2xl border border-white/10 z-[100] p-2 max-h-60 overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-top-2 duration-200">
                        {Array.from({ length: 20 }, (_, i) => viewYear - 10 + i).map((y) => (
                          <button
                            key={y}
                            onClick={() => {
                              setCurrentDate(new Date(y, viewMonth, 1));
                              setIsYearSelectorOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-sm font-bold rounded-xl text-left transition-all ${viewYear === y ? 'bg-primary text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={nextMonth} className="size-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward_ios</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, dIdx) => (
                <div key={day} className={`py-4 text-center text-[10px] font-black tracking-[0.2em] uppercase ${dIdx === 0 || dIdx === 6 ? 'text-primary/60' : 'text-slate-500'}`}>{day}</div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-y-auto bg-transparent custom-scrollbar">
              {calendarGrid.map((dateObj, idx) => {
                const dayEvents = getEventsForDay(dateObj.day, dateObj.month, dateObj.year);
                const isTodayCell = today.getDate() === dateObj.day && today.getMonth() === dateObj.month && today.getFullYear() === dateObj.year;
                const colIdx = idx % 7;
                const isWeekend = colIdx === 0 || colIdx === 6;

                return (
                  <div key={idx}
                    onClick={() => setSelectedDayView({ day: dateObj.day, month: dateObj.month, year: dateObj.year })}
                    className={`border-r border-b border-white/5 p-3 min-h-[110px] flex flex-col gap-2 group transition-all relative cursor-pointer 
                      ${!dateObj.isCurrentMonth ? 'opacity-30' : 'hover:bg-primary/[0.03] hover:backdrop-blur-sm'} 
                      ${isWeekend && dateObj.isCurrentMonth ? 'bg-white/[0.01]' : ''}
                      ${isTodayCell ? 'bg-primary/[0.05]' : ''}`}>

                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-black tracking-tight transition-colors ${!dateObj.isCurrentMonth
                        ? 'text-slate-700'
                        : isTodayCell
                          ? 'size-7 flex items-center justify-center rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-black bg-primary text-black shadow-neon-sm'
                          : 'text-slate-400 group-hover:text-white'
                        }`}>
                        {dateObj.day}
                      </span>
                      {dayEvents.length > 0 && dateObj.isCurrentMonth && (
                        <span className="size-1.5 rounded-full bg-primary/40 group-hover:bg-primary shadow-neon-sm transition-colors"></span>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); openEditEventModal(event); }}
                          className={`px-2 py-1 rounded-lg border text-[8px] font-black truncate flex items-center gap-2 cursor-pointer transition-all uppercase tracking-widest
                            bg-${getCategoryColor(event.type)}-500/5 border-${getCategoryColor(event.type)}-500/20 text-${getCategoryColor(event.type)}-500/80
                            hover:bg-${getCategoryColor(event.type)}-500/20 hover:border-${getCategoryColor(event.type)}-500/40 hover:text-${getCategoryColor(event.type)}-500 active:scale-95`}
                        >
                          <div className={`size-1 rounded-full bg-${getCategoryColor(event.type)}-500 shadow-glow-sm shadow-${getCategoryColor(event.type)}-500/50`}></div>
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest pl-1">
                          + {dayEvents.length - 3} eventos
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div >

      {/* LATERAL (RESUMO DO MÊS) */}
      < aside className="w-[420px] flex-shrink-0 px-6 py-6 pb-8 overflow-hidden z-20 flex flex-col gap-6" >
        <div className="flex-1 bg-white/5 p-8 rounded-[2.5rem] flex flex-col relative overflow-hidden shadow-2xl border-white/10 border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="flex items-start justify-between mb-8 z-10">
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">Resumo do Mês</p>
              <h2 className="text-7xl font-light text-white mt-2 font-display tracking-tight leading-none tracking-tighter">
                {filteredEvents.length}
              </h2>
              <p className="text-lg text-slate-500 font-light mt-1">Eventos Planejados</p>
            </div>
            <div className="size-16 rounded-[1.5rem] border border-white/10 flex items-center justify-center bg-white/5 shadow-glow shadow-primary/5 text-primary rotate-3 transform transition-transform hover:rotate-0">
              <span className="material-symbols-outlined text-3xl font-bold">event_available</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 z-10 overflow-y-auto pr-2 custom-scrollbar">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">calendar_today</span>
                <p className="text-xs italic text-center">Nenhum evento para este filtro.</p>
              </div>
            ) : (
              filteredEvents
                .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
                .map(event => (
                  <div key={event.id} className="group relative">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold tracking-wider opacity-60 mb-2">
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold">
                        {event.date.split('-').reverse().join('/')} {event.time || ''}
                      </span>
                      <button onClick={() => deleteEvent(event.id)} className="opacity-0 group-hover:opacity-100 text-rose-500/50 hover:text-rose-500 transition-all focus:opacity-100">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                    <div
                      onClick={() => openEditEventModal(event)}
                      className={`p-5 rounded-[2rem] border-l-[6px] bg-black/40 border border-white/5 shadow-sm hover:shadow-neon-sm shadow-primary/5 hover:border-primary/30 transition-all group-hover:translate-x-1 cursor-pointer border-l-${getCategoryColor(event.type)}-500`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest bg-${getCategoryColor(event.type)}-500/10 text-${getCategoryColor(event.type)}-500 border border-${getCategoryColor(event.type)}-500/20 shadow-sm`}>
                          {event.type}
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-sm leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                      {event.description && (
                        <p className="text-slate-500 text-xs mt-2 line-clamp-2 italic font-light leading-relaxed">
                          "{event.description}"
                        </p>
                      )}
                      {event.location && (
                        <p className="text-slate-600 text-[10px] mt-3 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm text-primary">location_on</span> {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </aside >

      {/* VIEW DIÁRIA (ZOOM) */}
      {
        selectedDayView && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedDayView(null)}
                  className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-500 transition-all font-bold"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                    Agenda do dia {selectedDayView.day} de {monthNames[selectedDayView.month]}
                  </h3>
                  <p className="text-slate-500 text-sm font-bold italic">{selectedDayView.year}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingEventId(null);
                  setNewTitle('');
                  setNewDate(`${selectedDayView.year}-${String(selectedDayView.month + 1).padStart(2, '0')}-${String(selectedDayView.day).padStart(2, '0')}`);
                  setNewTime(''); setNewLocation(''); setNewDescription(''); setNewType(categories[0]?.label || 'Outro');
                  setIsModalOpen(true);
                }}
                className="bg-primary text-black px-6 py-2.5 rounded-full font-bold text-sm shadow-neon hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-[18px] font-bold">add</span> Novo para este dia
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-6">
                {getEventsForDay(selectedDayView.day, selectedDayView.month, selectedDayView.year).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <span className="material-symbols-outlined text-[80px] opacity-20 mb-4">calendar_today</span>
                    <p className="text-xl font-light">Nenhum compromisso para este dia.</p>
                  </div>
                ) : (
                  getEventsForDay(selectedDayView.day, selectedDayView.month, selectedDayView.year)
                    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                    .map(event => (
                      <div
                        key={event.id}
                        onClick={() => openEditEventModal(event)}
                        className="group flex gap-6 p-6 bg-white/5 border border-white/10 rounded-[2rem] shadow-sm hover:shadow-neon-sm shadow-primary/5 transition-all cursor-pointer hover:-translate-y-1"
                      >
                        <div className="flex-shrink-0 w-24 flex flex-col items-center justify-center border-r border-white/10 pr-6">
                          <span className="text-2xl font-black text-primary drop-shadow-glow">{event.time || '--:--'}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 px-2 py-0.5 rounded-lg bg-${getCategoryColor(event.type)}-500/10 text-${getCategoryColor(event.type)}-500 border border-${getCategoryColor(event.type)}-500/20 shadow-sm`}>
                            {event.type}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{event.title}</h4>
                          {event.description && (
                            <p className="text-slate-500 font-light mb-4 italic">"{event.description}"</p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                              {event.location}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex items-center pr-4">
                          <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-black transition-all">
                            <span className="material-symbols-outlined font-bold">edit</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* MODAL GERENCIAR CATEGORIAS */}
      {
        isNewCategoryModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-black w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold text-white">{editingCategoryId ? 'Editar Categoria' : 'Gerenciar Categorias'}</h3>
                <button onClick={() => { setIsNewCategoryModalOpen(false); setEditingCategoryId(null); setNewCatLabel(''); }} className="size-10 rounded-full hover:bg-white/10 text-slate-500 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{editingCategoryId ? 'Nome da Categoria' : 'Nova Categoria'}</label>
                    <input
                      value={newCatLabel}
                      onChange={e => setNewCatLabel(e.target.value)}
                      placeholder="Ex: Reunião Interna"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none transition-all text-sm text-white font-bold placeholder:text-slate-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cor</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['amber', 'red', 'purple', 'pink', 'blue', 'emerald', 'indigo', 'slate'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCatColor(color)}
                          className={`size-8 rounded-full bg-${color}-500 border-4 transition-all ${newCatColor === color ? 'border-primary/20 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingCategoryId && (
                      <button
                        onClick={() => { setEditingCategoryId(null); setNewCatLabel(''); setNewCatColor('indigo'); }}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-xs border border-white/10 hover:text-white transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCatLabel}
                      className="flex-[2] py-3 rounded-xl bg-primary text-black font-bold text-xs shadow-neon hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                    >
                      {editingCategoryId ? 'Salvar Alteração' : 'Adicionar Categoria'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categorias Existentes</label>
                  <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`size-3 rounded-full bg-${cat.color}-500 shadow-glow-sm shadow-${cat.color}-500/50`}></div>
                          <span className="text-sm font-bold text-white">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-primary transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* MODAL NOVO EVENTO */}
      {
        isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-black w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary text-black shadow-neon">
                    <span className="material-symbols-outlined text-2xl font-bold">{editingEventId ? 'edit_calendar' : 'event'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{editingEventId ? 'Editar Evento' : 'Novo Evento'}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 text-slate-500 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* COLUNA ESQUERDA */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Título</label>
                      <input
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="Ex: Audiência JEF"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none transition-all text-sm text-white font-bold placeholder:text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                        <input
                          type="date"
                          value={newDate}
                          onChange={e => setNewDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm text-white font-bold"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hora (Opcional)</label>
                        <input
                          type="time"
                          value={newTime}
                          onChange={e => setNewTime(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 pt-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Evento</label>
                      <div className="grid grid-cols-2 gap-2 mt-1 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNewType(cat.label)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${newType === cat.label
                              ? `bg-${cat.color}-500 text-black border-${cat.color}-500 shadow-neon-sm`
                              : 'bg-white/5 text-slate-500 border-white/10 hover:border-primary/30'
                              }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* COLUNA DIREITA */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Local (Opcional)</label>
                      <input
                        value={newLocation}
                        onChange={e => setNewLocation(e.target.value)}
                        placeholder="Ex: Sala 4"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm text-white placeholder:text-slate-700 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Responsável</label>
                        <select
                          value={newResponsibleId}
                          onChange={e => setNewResponsibleId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm text-white font-bold appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-black">Ninguém</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.id} className="bg-black">{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cliente</label>
                        <button
                          type="button"
                          onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                          className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-left text-sm font-bold flex items-center justify-between transition-all ${isClientDropdownOpen ? 'border-primary shadow-neon-sm' : 'border-white/10 hover:border-white/20'}`}
                        >
                          <span className={`${newClientId ? 'text-white' : 'text-slate-500'} truncate`}>
                            {newClientId ? clients.find(c => c.id === newClientId)?.name : 'Pesquisar...'}
                          </span>
                          <span className={`material-symbols-outlined text-sm transition-transform ${isClientDropdownOpen ? 'rotate-180 text-primary' : 'text-slate-500'}`}>expand_more</span>
                        </button>

                        {isClientDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-2xl shadow-2xl z-[160] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-3 border-b border-white/5 bg-white/5">
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input
                                  autoFocus
                                  value={clientSearch}
                                  onChange={e => setClientSearch(e.target.value)}
                                  placeholder="Nome ou CPF..."
                                  className="w-full pl-9 pr-4 py-2 bg-black rounded-lg border border-white/10 focus:border-primary outline-none text-xs text-white font-bold"
                                />
                              </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                              <button
                                type="button"
                                onClick={() => { setNewClientId(''); setIsClientDropdownOpen(false); setClientSearch(''); }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-white/5 hover:text-white rounded-lg transition-all mb-1 border border-transparent hover:border-white/5"
                              >
                                Nenhum (Desvincular)
                              </button>
                              {clients
                                .filter(c => {
                                  const search = normalizeText(clientSearch);
                                  const name = normalizeText(c.name);
                                  const cpf = c.cpf ? c.cpf.replace(/\D/g, '') : '';
                                  const searchDigits = clientSearch.replace(/\D/g, '');

                                  return name.includes(search) || (searchDigits && cpf.includes(searchDigits));
                                })
                                .slice(0, 20)
                                .map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setNewClientId(c.id);
                                      setIsClientDropdownOpen(false);
                                      setClientSearch('');
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-white/10 rounded-xl transition-all group border border-transparent hover:border-primary/20 mb-1"
                                  >
                                    <div className="text-sm font-bold text-white group-hover:text-primary truncate">{c.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {c.cpf && <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-medium">CPF: {c.cpf}</span>}
                                      {c.processNumber && <span className="text-[10px] text-slate-600 group-hover:text-slate-500 font-medium">• Proc: {c.processNumber}</span>}
                                    </div>
                                  </button>
                                ))}
                              {clients.filter(c => {
                                const search = normalizeText(clientSearch);
                                const name = normalizeText(c.name);
                                return name.includes(search) || (c.cpf && c.cpf.includes(clientSearch));
                              }).length === 0 && clientSearch && (
                                  <div className="px-3 py-6 text-center text-slate-500 text-xs italic">
                                    Nenhum cliente encontrado para "{clientSearch}"
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {newType === 'Perícias' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nº do Benefício (NB)</label>
                        <input
                          value={newNb}
                          onChange={e => setNewNb(e.target.value)}
                          placeholder="000.000.000-0"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm text-white font-bold placeholder:text-slate-700"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                      <textarea
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        placeholder="Escreva detalhes ou observações..."
                        rows={newType === 'Perícias' ? 2 : 5}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm text-white resize-none placeholder:text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  {editingEventId && (
                    <button
                      onClick={() => { deleteEvent(editingEventId); setIsModalOpen(false); }}
                      className="flex-shrink-0 px-8 py-4 rounded-2xl bg-white/5 text-rose-500 font-bold text-sm hover:bg-rose-500/10 transition-all border border-white/10 hover:border-rose-500/20 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">delete_forever</span>
                      Excluir
                    </button>
                  )}
                  <button
                    onClick={handleAddEvent}
                    disabled={!newTitle || !newDate}
                    className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-sm shadow-neon hover:scale-[1.01] transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                  >
                    {editingEventId ? 'Atualizar Evento' : 'Salvar Evento'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Agenda;