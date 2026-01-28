import React, { useState } from 'react';
import { Task, KanbanColumn } from '../types';
import { useData } from '../contexts/DataContext';
import ClientSearchModal from '../components/ClientSearchModal';

const Tasks: React.FC = () => {
    const {
        tasks, addTask, updateTask, deleteTask: removeTask,
        columns, updateColumns,
        teamMembers, clients,
        setTasks,
        addTaskColumn, updateTaskColumn, deleteTaskColumn,
        reorderTaskColumns, reorderTasks
    } = useData();

    // --- ESTADOS LOCAIS (UI) ---

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState(''); // Estado para busca de cliente
    const [showClientList, setShowClientList] = useState(false); // Mantido o antigo, mas vamos usar o Modal agora
    const [isClientSearchModalOpen, setIsClientSearchModalOpen] = useState(false); // Novo estado
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
    const [newComment, setNewComment] = useState('');
    const [selectedResponsible, setSelectedResponsible] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isResponsibleDropdownOpen, setIsResponsibleDropdownOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    // --- CRUD COLUNAS ---
    const addColumn = async () => {
        const newCol: KanbanColumn = {
            id: `col-${Date.now()}`,
            title: 'Nova Coluna',
            color: 'bg-slate-400',
            count: 0
        };
        await addTaskColumn(newCol);
    };

    const handleUpdateColumnTitle = async (id: string, newTitle: string) => {
        const col = columns.find(c => c.id === id);
        if (col) {
            await updateTaskColumn({ ...col, title: newTitle });
        }
    };

    const handleDeleteColumn = async (id: string) => {
        if (window.confirm('Excluir esta coluna e todas as suas tarefas?')) {
            await deleteTaskColumn(id);
        }
    };

    // --- CRUD CARDS (TAREFAS) ---
    const openNewTaskModal = (status: string) => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: '',
            description: '',
            processNumber: '',
            clientName: '',
            location: '',
            fatalDeadline: '',
            internalDeadline: '',
            responsible: { name: 'Thalia', avatar: 'https://i.pravatar.cc/150?img=32' },
            status: status,
            dialogue: []
        };
        setSelectedTask(newTask);
        setClientSearch(''); // Resetar busca
        setIsTaskModalOpen(true);
    };

    const saveTask = () => {
        if (!selectedTask) return;
        if (tasks.find(t => t.id === selectedTask.id)) {
            updateTask(selectedTask);
        } else {
            addTask(selectedTask);
        }
        setIsTaskModalOpen(false);
        setSelectedTask(null);
    };

    const deleteTask = (id: string) => {
        removeTask(id);
        setIsTaskModalOpen(false);
        setOpenMenuId(null);
    };

    const duplicateTask = (task: Task) => {
        const duplicatedTask: Task = {
            ...task,
            id: `task-${Date.now()}`,
            clientName: `${task.clientName} (Cópia)`,
            dialogue: []
        };
        addTask(duplicatedTask);
        setOpenMenuId(null);
    };

    // --- SISTEMA DE COMENTÁRIOS ---
    const addComment = () => {
        if (!selectedTask || !newComment.trim()) return;
        const comment = {
            author: 'Dr. Silva',
            text: newComment,
            date: new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        };
        const updatedTask = {
            ...selectedTask,
            dialogue: [...selectedTask.dialogue, comment]
        };
        setSelectedTask(updatedTask);
        updateTask(updatedTask);
        setNewComment('');
    };

    // --- DRAG AND DROP (Nativo com Reordenação) ---
    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = async (e: React.DragEvent, targetStatus: string, targetTaskId?: string) => {
        e.preventDefault();
        const draggedTaskId = e.dataTransfer.getData('taskId');
        if (!draggedTaskId) return;

        // Clone current tasks
        const newTasks = [...tasks];
        const draggedTaskIndex = newTasks.findIndex(t => t.id === draggedTaskId);
        if (draggedTaskIndex === -1) return;

        const [draggedTask] = newTasks.splice(draggedTaskIndex, 1);
        draggedTask.status = targetStatus;

        if (targetTaskId) {
            const targetIndex = newTasks.findIndex(t => t.id === targetTaskId);
            if (targetIndex !== -1) {
                newTasks.splice(targetIndex, 0, draggedTask);
            } else {
                newTasks.push(draggedTask);
            }
        } else {
            let lastTaskIndex = -1;
            for (let i = newTasks.length - 1; i >= 0; i--) {
                if (newTasks[i].status === targetStatus) {
                    lastTaskIndex = i;
                    break;
                }
            }

            if (lastTaskIndex !== -1) {
                newTasks.splice(lastTaskIndex + 1, 0, draggedTask);
            } else {
                newTasks.push(draggedTask);
            }
        }

        // Identify only tasks in the TARGET column to sync with DB reorderTaskLeads-like logic
        const targetColumnTasks = newTasks.filter(t => t.status === targetStatus);

        // If it moved between columns, we also need to update its status in the DB
        // reorderTasks handles both status change and position updates for the given task list
        await reorderTasks(targetStatus, targetColumnTasks);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // Estado para edição de título da coluna
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
            <header className="sticky top-0 z-40 px-6 py-4 lg:px-10 flex items-center justify-between backdrop-blur-md bg-black/80 border-b border-white/10">
                <div className="flex flex-col">
                    <h2 className="text-white text-xl lg:text-2xl font-bold tracking-tight font-display">Gestão de Tarefas</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Modo Kanban</span>
                        <span className="text-[10px] text-slate-500 font-medium">• Arraste para mover</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex -space-x-3 items-center">
                        {teamMembers.slice(0, 5).map(member => (
                            <div
                                key={member.id}
                                onClick={() => setSelectedResponsible(selectedResponsible === member.name ? null : member.name)}
                                className={`size-10 rounded-full border-2 transition-all cursor-pointer shadow-sm hover:translate-y-[-4px] relative group ${selectedResponsible === member.name ? 'border-primary ring-4 ring-primary/20 z-10 scale-110' : 'border-black hover:z-10'}`}
                                title={member.name}
                            >
                                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                {selectedResponsible === member.name && (
                                    <div className="absolute -top-1 -right-1 size-4 bg-primary text-black rounded-full flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {teamMembers.length > 5 && (
                            <div className="size-10 rounded-full border-2 border-black bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                                +{teamMembers.length - 5}
                            </div>
                        )}
                        {selectedResponsible && (
                            <button
                                onClick={() => setSelectedResponsible(null)}
                                className="ml-4 text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">close</span> Limpar Filtro
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={addColumn} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-bold text-white border border-white/10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">view_column</span> Nova Coluna
                        </button>
                        <button onClick={() => openNewTaskModal('afazer')} className="px-6 py-2.5 rounded-full bg-primary hover:scale-105 text-black shadow-neon transition-all text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg font-bold">add_task</span> Nova Tarefa
                        </button>
                    </div>
                </div>
            </header>

            <style>{`
        .tasks-scroll-container {
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: auto;
            scrollbar-color: #D4AF37 rgba(255,255,255,0.05);
        }
        .tasks-scroll-container::-webkit-scrollbar {
            height: 14px;
            display: block;
        }
        .tasks-scroll-container::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            margin: 0 24px;
            border-radius: 8px;
        }
        .tasks-scroll-container::-webkit-scrollbar-thumb {
            background-color: #D4AF37;
            border-radius: 8px;
            border: 3px solid transparent;
            background-clip: content-box;
        }
        .tasks-scroll-container::-webkit-scrollbar-thumb:hover {
            background-color: #B8860B;
        }
        .tasks-scroll-container::-webkit-scrollbar-corner {
            background: transparent;
        }
`}</style>

            {/* Kanban Board - Layout Replicado do CRM */}
            <div className="flex-1 w-full relative min-h-0">
                <div className="absolute inset-0 tasks-scroll-container">
                    <div className="inline-flex h-full items-start px-6 lg:px-10 pt-6 pb-4">
                        {columns.map(column => (
                            <div
                                key={column.id}
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, column.id)}
                                className="flex-shrink-0 w-80 lg:w-96 mr-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col"
                            >
                                {/* Column Header */}
                                <div className="p-5 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <span className={`size-2.5 rounded-full ${column.color}`}></span>

                                        {editingColumnId === column.id ? (
                                            <input
                                                autoFocus
                                                className="bg-black border border-primary/20 rounded px-2 py-0.5 focus:ring-2 focus:ring-primary/20 font-bold text-white w-40 text-sm outline-none"
                                                value={column.title}
                                                onChange={(e) => handleUpdateColumnTitle(column.id, e.target.value)}
                                                onBlur={() => setEditingColumnId(null)}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingColumnId(null)}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">{column.title}</span>
                                                <button
                                                    onClick={() => setEditingColumnId(column.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-opacity"
                                                    title="Editar nome da coluna"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                </button>
                                            </div>
                                        )}

                                        <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 border border-white/10">
                                            {tasks.filter(t => t.status === column.id && (!selectedResponsible || t.responsible.name === selectedResponsible)).length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteColumn(column.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>

                                <div className="flex-1 px-4 pb-6 space-y-4">
                                    {tasks.filter(task => task.status === column.id && (!selectedResponsible || task.responsible.name === selectedResponsible)).map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, task.id)}
                                            onDragOver={onDragOver}
                                            onDrop={(e) => {
                                                e.stopPropagation(); // Stop bubbling to column
                                                onDrop(e, column.id, task.id);
                                            }}
                                            className="bg-white/5 p-4 rounded-2xl shadow-sm border border-white/5 cursor-grab active:cursor-grabbing hover:shadow-neon-sm shadow-primary/5 hover:border-primary/20 transition-all group/card relative"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    {task.clientName && (
                                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wide truncate max-w-[120px]">
                                                            {task.clientName}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {task.responsible?.avatar && (
                                                        <img src={task.responsible.avatar} alt={task.responsible.name} className="size-8 rounded-full border-2 border-white shadow-md object-cover" />
                                                    )}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === task.id ? null : task.id); }}
                                                            className="size-7 rounded-full hover:bg-white/10 text-slate-500 hover:text-primary transition-all flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                        </button>

                                                        {openMenuId === task.id && (
                                                            <div className="absolute right-0 top-8 w-48 bg-black rounded-2xl shadow-2xl border border-white/10 z-50 py-2 animate-[fadeIn_0.2s_ease-out]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedTask(task);
                                                                        setClientSearch(task.clientName || ''); // Sincronizar busca com nome atual
                                                                        setIsTaskModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-primary flex items-center gap-2 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">edit</span> Editar Tarefa
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); duplicateTask(task); }}
                                                                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-primary flex items-center gap-2 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">content_copy</span> Duplicar
                                                                </button>
                                                                <div className="h-px bg-white/5 my-1 mx-2"></div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                                    className="w-full px-4 py-2 text-left text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">delete</span> Excluir
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <h4 className="text-sm font-bold text-white mb-1 truncate">{task.title || 'Nova Tarefa'}</h4>
                                            <p className="text-[10px] text-slate-500 line-clamp-2 mb-4 leading-relaxed italic">
                                                "{task.description || 'Sem descrição definida...'}"
                                            </p>

                                            <div className="flex items-center justify-between text-[10px] bg-black/20 p-2 rounded-lg border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-500 uppercase font-bold text-[8px]">Prazo Fatal</span>
                                                    <span className="text-rose-500 font-bold">{task.fatalDeadline || '--/--'}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-slate-500 uppercase font-bold text-[8px]">Comentários</span>
                                                    <span className="text-primary font-bold flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px] font-bold">chat</span>
                                                        {task.dialogue.length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => openNewTaskModal(column.id)}
                                        className="w-full py-3 rounded-xl border border-dashed border-white/10 text-slate-500 hover:border-primary/40 hover:bg-white/5 hover:text-primary transition-all text-xs font-bold flex items-center justify-center gap-2 group"
                                    >
                                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform font-bold">add</span>
                                        Novo Card
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addColumn}
                            className="flex-shrink-0 w-80 lg:w-96 h-20 rounded-3xl border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 text-slate-500 hover:text-primary group"
                        >
                            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform font-bold">add</span>
                            <span className="font-bold text-sm uppercase tracking-widest">Adicionar Nova Coluna</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TASK MODAL (CRUD CARD & COMMENTS) --- */}
            {isTaskModalOpen && selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-black w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
                        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-2xl">assignment</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {selectedTask.title ? selectedTask.title : 'Nova Tarefa'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">Configurações e acompanhamento da tarefa</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => deleteTask(selectedTask.id)} className="size-10 rounded-full hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <button onClick={() => { setIsTaskModalOpen(false); setSelectedTask(null); }} className="size-10 rounded-full hover:bg-white/5 text-slate-500 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Informações da Tarefa */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Título e Descrição (Foco Principal estilo Trello) */}
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Tarefa</label>
                                        <input
                                            value={selectedTask.title}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                                            placeholder="Ex: Elaborar Recurso Inominado"
                                            className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg text-white outline-none placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                                        <textarea
                                            value={selectedTask.description}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                            placeholder="O que precisa ser feito?"
                                            rows={6}
                                            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none resize-none placeholder:text-slate-700"
                                        />
                                    </div>
                                </div>

                                {/* Contexto Jurídico (Colapsável ou Secundário) */}
                                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 shadow-sm space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary font-bold">gavel</span> Contexto Jurídico
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5 relative">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cliente</label>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-all text-left group flex items-center justify-between ${isClientDropdownOpen ? 'border-primary bg-white/10 shadow-neon-sm' : 'border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                                                >
                                                    <span className={`text-sm ${selectedTask.clientName ? 'font-bold text-white' : 'text-slate-600'}`}>
                                                        {selectedTask.clientName || 'Buscar Cliente...'}
                                                    </span>
                                                    {selectedTask.clientName ? (
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTask({ ...selectedTask, clientName: '' });
                                                            }}
                                                            className="material-symbols-outlined text-sm text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-white"
                                                            title="Remover cliente"
                                                        >
                                                            close
                                                        </span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-[18px] text-slate-600 group-hover:text-primary transition-colors">search</span>
                                                    )}
                                                </button>

                                                {/* Quick Client Selection Dropdown */}
                                                {isClientDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[110]" onClick={() => setIsClientDropdownOpen(false)}></div>
                                                        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-black border border-white/10 rounded-2xl shadow-2xl z-[120] max-h-60 overflow-y-auto scrollbar-hide animate-[fadeInDown_0.2s_ease-out]">
                                                            <div className="p-2 border-b border-white/5 mb-1">
                                                                <input
                                                                    autoFocus
                                                                    value={clientSearchTerm}
                                                                    onChange={(e) => setClientSearchTerm(e.target.value)}
                                                                    placeholder="Filtrar clientes..."
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                                                />
                                                            </div>
                                                            {clients
                                                                .filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()))
                                                                .map(client => (
                                                                    <button
                                                                        key={client.id}
                                                                        onClick={() => {
                                                                            setSelectedTask({
                                                                                ...selectedTask,
                                                                                clientName: client.name,
                                                                                location: client.location || selectedTask.location
                                                                            });
                                                                            setIsClientDropdownOpen(false);
                                                                            setClientSearchTerm('');
                                                                        }}
                                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-left transition-all group"
                                                                    >
                                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                                                                            {client.avatar ? (
                                                                                <img src={client.avatar} className="w-full h-full object-cover rounded-full" />
                                                                            ) : (
                                                                                client.name.substring(0, 2).toUpperCase()
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{client.name}</span>
                                                                            <span className="text-[9px] text-slate-500 capitalize">{client.role}</span>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            <button
                                                                onClick={() => {
                                                                    setIsClientSearchModalOpen(true);
                                                                    setIsClientDropdownOpen(false);
                                                                }}
                                                                className="w-full mt-1 p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-sm font-bold">person_search</span>
                                                                Busca Avançada
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Processo</label>
                                            <input
                                                value={selectedTask.processNumber || ''}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, processNumber: e.target.value })}
                                                placeholder="Nº do Processo"
                                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm text-white outline-none font-mono placeholder:text-slate-700"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 md:col-span-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Local de Trâmite</label>
                                            <input
                                                value={selectedTask.location || ''}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, location: e.target.value })}
                                                placeholder="Vara ou Tribunal"
                                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm text-white outline-none placeholder:text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Seção de Comentários / Diálogo */}
                                <div className="space-y-4 pt-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-white">
                                        <span className="material-symbols-outlined text-primary text-[20px] font-bold">assignment</span>
                                        Instruções
                                    </h4>

                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                                        {selectedTask.dialogue.map((msg, i) => (
                                            <div key={i} className={`flex flex-col gap-1 max-w-[80%] ${msg.author === 'Dr. Silva' ? 'ml-auto items-end' : ''}`}>
                                                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.author === 'Dr. Silva' ? 'bg-primary text-black font-bold rounded-tr-none shadow-glow shadow-primary/20' : 'bg-white/5 text-white border border-white/10 rounded-tl-none'}`}>
                                                    {msg.text}
                                                </div>
                                                <span className="text-[9px] text-slate-500 font-bold px-1 uppercase tracking-tighter">{msg.author} • {msg.date}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/10 focus-within:border-primary/50 transition-all">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    addComment();
                                                }
                                            }}
                                            placeholder="Escreva um comentário ou instrução..."
                                            rows={3}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm p-2 resize-none placeholder:text-slate-700"
                                        />
                                        <button
                                            onClick={addComment}
                                            className="size-10 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-105 transition-all shadow-neon"
                                        >
                                            <span className="material-symbols-outlined font-bold">send</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar do Modal */}
                            <div className="space-y-6 bg-white/5 p-6 rounded-3xl border border-white/10">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prazo Fatal</label>
                                        <input
                                            type="date"
                                            value={selectedTask.fatalDeadline}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, fatalDeadline: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-black border border-white/10 font-bold text-rose-500 text-sm outline-none focus:border-rose-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entrega para Revisão</label>
                                        <input
                                            type="date"
                                            value={selectedTask.internalDeadline}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, internalDeadline: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-black border border-white/10 font-bold text-primary text-sm outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Responsável</label>

                                    <div className="space-y-2">
                                        {/* Visualização Atual e Dropdown */}
                                        <div className="relative">
                                            <div
                                                onClick={() => setIsResponsibleDropdownOpen(!isResponsibleDropdownOpen)}
                                                className={`flex items-center gap-3 p-3 bg-black rounded-2xl border transition-all cursor-pointer group relative ${isResponsibleDropdownOpen ? 'border-primary shadow-neon-sm' : 'border-white/10 hover:border-primary/30'}`}
                                            >
                                                <div className="size-10 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${selectedTask.responsible.avatar})` }}></div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-sm font-bold text-white">{selectedTask.responsible.name}</span>
                                                    <span className="text-[10px] text-slate-500">Responsável Atual</span>
                                                </div>
                                                <span className={`material-symbols-outlined text-slate-600 group-hover:text-primary transition-all ${isResponsibleDropdownOpen ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
                                            </div>

                                            {isResponsibleDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[110]" onClick={() => setIsResponsibleDropdownOpen(false)}></div>
                                                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-black border border-white/10 rounded-2xl shadow-2xl z-[120] animate-[fadeInDown_0.2s_ease-out]">
                                                        {teamMembers.map(member => (
                                                            <button
                                                                key={member.id}
                                                                onClick={() => {
                                                                    setSelectedTask({
                                                                        ...selectedTask,
                                                                        responsible: {
                                                                            name: member.name,
                                                                            avatar: member.avatar
                                                                        }
                                                                    });
                                                                    setIsResponsibleDropdownOpen(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-left transition-all group"
                                                            >
                                                                <div className="size-10 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${member.avatar})` }}></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{member.name}</span>
                                                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{member.department}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-slate-400 pl-2">Toque para alterar o responsável</p>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button onClick={saveTask} className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-sm shadow-neon hover:scale-[1.02] transition-all active:scale-95 uppercase tracking-widest">
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Busca de Clientes */}
            <ClientSearchModal
                isOpen={isClientSearchModalOpen}
                onClose={() => setIsClientSearchModalOpen(false)}
                onSelectClient={(client) => {
                    if (selectedTask) {
                        setSelectedTask({
                            ...selectedTask,
                            clientName: client.name,
                            location: client.location || selectedTask.location
                        });
                    }
                }}
            />

        </div>
    );
};

export default Tasks;
