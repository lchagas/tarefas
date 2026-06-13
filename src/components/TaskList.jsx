import React, { useState, useEffect } from 'react';
import { db } from '../supabaseClient';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  Search, 
  Check, 
  AlertCircle, 
  Loader2,
  Tag,
  ArrowLeft,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const CATEGORIES = {
  'Trabalho': { color: 'bg-indigo-950/40 border-indigo-900/50 text-indigo-300', text: 'TRABALHO' },
  'Pessoal': { color: 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300', text: 'PESSOAL' },
  'Estudos': { color: 'bg-amber-950/40 border-amber-900/50 text-amber-300', text: 'ESTUDOS' },
  'Outros': { color: 'bg-slate-800/40 border-slate-700/50 text-slate-350', text: 'OUTROS' }
};

const PRIORITIES = {
  'Alta': { color: 'bg-rose-950/40 border-rose-900/50 text-rose-300', icon: ArrowUp, label: 'ALTA' },
  'Média': { color: 'bg-amber-950/40 border-amber-900/50 text-amber-300', icon: ArrowRight, label: 'MÉDIA' },
  'Baixa': { color: 'bg-sky-950/40 border-sky-900/50 text-sky-300', icon: ArrowDown, label: 'BAIXA' }
};

export default function TaskList({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' (mostra 3 colunas), 'pending' (todo/doing), 'completed' (done)
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Formulário de Nova Tarefa
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Pessoal');
  const [newPriority, setNewPriority] = useState('Média');
  const [newDueDate, setNewDueDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await db.getTasks(user?.id);
      setTasks(data);
    } catch (err) {
      setError('Erro ao carregar as tarefas. Tente recarregar a página.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setFormLoading(true);
    setError('');

    const taskData = {
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      due_date: newDueDate || null,
      status: 'todo', // Kanban padrão: entra em "Início"
      completed: false
    };

    try {
      const createdTask = await db.createTask(taskData, user?.id);
      setTasks([createdTask, ...tasks]);
      setNewTitle('');
      setNewDueDate('');
    } catch (err) {
      setError('Erro ao adicionar tarefa. Tente novamente.');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Move a tarefa para o status especificado
  const handleUpdateStatus = async (taskId, newStatus) => {
    const previousTasks = [...tasks];
    // Atualização otimista
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus, completed: newStatus === 'done' } : t));

    try {
      await db.updateTask(taskId, { status: newStatus }, user?.id);
    } catch (err) {
      setTasks(previousTasks);
      setError('Erro ao mover a tarefa. Tente novamente.');
      console.error(err);
    }
  };

  const handleToggleCompleteDirect = async (taskId, currentStatus) => {
    // Ao clicar no checkbox: se concluído vai para 'todo' (Início), senão vai para 'done' (Encerrado)
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await handleUpdateStatus(taskId, newStatus);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    // Atualização otimista
    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      await db.deleteTask(taskId, user?.id);
    } catch (err) {
      setTasks(previousTasks);
      setError('Erro ao excluir tarefa. Tente novamente.');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const isOverdue = (dateString, completed) => {
    if (!dateString || completed) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(dateString);
    dueDate.setHours(24,0,0,0);
    return dueDate < today;
  };

  // Filtro de Busca
  const searchedTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  // Divide as tarefas por coluna do Kanban
  const todoTasks = searchedTasks.filter(t => t.status === 'todo');
  const doingTasks = searchedTasks.filter(t => t.status === 'doing');
  const doneTasks = searchedTasks.filter(t => t.status === 'done');

  // Determina a visibilidade das colunas baseado no filtro superior
  const showTodo = filter === 'all' || filter === 'pending';
  const showDoing = filter === 'all' || filter === 'pending';
  const showDone = filter === 'all' || filter === 'completed';

  // Helper para renderizar um card de tarefa no Kanban
  const renderTaskCard = (task) => {
    const categoryDetails = CATEGORIES[task.category] || CATEGORIES['Outros'];
    const priorityDetails = PRIORITIES[task.priority] || PRIORITIES['Média'];
    const PriorityIcon = priorityDetails.icon;
    const isTaskOverdue = isOverdue(task.due_date, task.completed);

    return (
      <div
        key={task.id}
        className={`bg-[#161f30] border rounded-xl p-4 space-y-3.5 shadow-sm hover:shadow-md hover:border-slate-750 transition-all duration-200 group relative ${
          task.status === 'done' 
            ? 'border-slate-800/80 opacity-50' 
            : isTaskOverdue 
              ? 'border-rose-900/50 bg-rose-950/10' 
              : 'border-slate-800/80'
        }`}
      >
        <div className="flex items-start gap-3 justify-between">
          
          <div className="flex items-start gap-3 min-w-0">
            {/* Checkbox circular de conclusão rápida */}
            <button
              onClick={() => handleToggleCompleteDirect(task.id, task.status)}
              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 cursor-pointer ${
                task.status === 'done'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : isTaskOverdue
                    ? 'border-rose-700 hover:border-rose-500 bg-rose-950/30'
                    : 'border-slate-700 hover:border-blue-500 bg-slate-900'
              }`}
            >
              {task.status === 'done' && <Check className="h-3 w-3 stroke-[3px]" />}
            </button>

            {/* Título */}
            <h4 className={`font-semibold text-slate-200 text-sm leading-snug break-words ${
              task.status === 'done' ? 'line-through text-slate-500' : ''
            }`}>
              {task.title}
            </h4>
          </div>

          {/* Lixeira visível apenas no hover */}
          <button
            onClick={() => handleDeleteTask(task.id)}
            className="text-slate-500 hover:text-rose-450 hover:bg-rose-950/30 rounded-lg p-1 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer"
            title="Excluir Tarefa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Tags e Prazos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider ${categoryDetails.color}`}>
            {categoryDetails.text}
          </span>
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider ${priorityDetails.color}`}>
            <PriorityIcon className="h-2.5 w-2.5 shrink-0" />
            {priorityDetails.label}
          </span>
          {task.due_date && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium py-0.5 px-1.5 rounded ${
              task.status === 'done'
                ? 'text-slate-500'
                : isTaskOverdue
                  ? 'bg-rose-950/45 text-rose-300 font-semibold border border-rose-900/50'
                  : 'text-slate-350 bg-slate-800 border border-slate-700/60'
            }`}>
              <CalendarIcon className="h-2.5 w-2.5 shrink-0" />
              {formatDate(task.due_date)}
              {isTaskOverdue && ' (Atrasada)'}
            </span>
          )}
        </div>

        {/* Ações de Movimentação do Kanban no rodapé do card */}
        <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800/80">
          {/* Voltar status */}
          {task.status !== 'todo' && (
            <button
              onClick={() => handleUpdateStatus(task.id, task.status === 'done' ? 'doing' : 'todo')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-slate-400 hover:bg-slate-800 border border-slate-700/60 cursor-pointer active:scale-95 transition-all bg-slate-900"
              title={task.status === 'done' ? 'Voltar para Fazendo' : 'Voltar para Início'}
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar
            </button>
          )}

          {/* Avançar status */}
          {task.status !== 'done' && (
            <button
              onClick={() => handleUpdateStatus(task.id, task.status === 'todo' ? 'doing' : 'done')}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shadow-sm"
              title={task.status === 'todo' ? 'Mover para Fazendo' : 'Mover para Encerrado'}
            >
              {task.status === 'todo' ? (
                <>
                  Iniciar
                  <Play className="h-2.5 w-2.5 stroke-[3px]" />
                </>
              ) : (
                <>
                  Concluir
                  <CheckCircle2 className="h-2.5 w-2.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Barra superior com Busca e Filtros */}
      <div className="bg-[#111827] border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div>
            <h1 className="font-display font-bold text-xl text-slate-100 tracking-tight m-0">Quadro de Projetos (Kanban)</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gerencie suas tarefas movendo-as entre os diferentes estágios.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* Filtro de Colunas */}
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl w-full sm:w-auto border border-slate-800/60">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                  filter === 'all'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas as Colunas
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                  filter === 'pending'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Em Andamento
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                  filter === 'completed'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Concluídas
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full sm:w-56 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-850 py-1.5 pl-8.5 pr-4 text-slate-200 text-xs focus:border-blue-500 focus:outline-none bg-slate-950/40 hover:bg-slate-950/20 transition-all duration-200"
              />
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 text-sm text-rose-350 flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Principal: Formulário + Quadro Kanban */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Formulário de Criação (1 coluna na lateral no desktop, topo no mobile) */}
        <div className="xl:col-span-1 bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display font-bold text-base text-slate-100 mb-4 flex items-center gap-2">
            <span className="h-5 w-5 bg-blue-950/50 text-blue-400 rounded-md flex items-center justify-center text-xs font-bold border border-blue-900/30">+</span>
            Nova Tarefa
          </h2>
          
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                Título da Tarefa
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Fazer deploy..."
                className="w-full rounded-xl border border-slate-800 py-2.5 px-3.5 text-slate-200 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 bg-slate-950/40 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 py-2.5 px-2.5 text-slate-300 text-xs focus:border-blue-500 focus:outline-none bg-[#0B0F19] transition-all cursor-pointer"
                >
                  <option value="Pessoal" className="bg-slate-900">Pessoal</option>
                  <option value="Trabalho" className="bg-slate-900">Trabalho</option>
                  <option value="Estudos" className="bg-slate-900">Estudos</option>
                  <option value="Outros" className="bg-slate-900">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                  Prioridade
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 py-2.5 px-2.5 text-slate-300 text-xs focus:border-blue-500 focus:outline-none bg-[#0B0F19] transition-all cursor-pointer"
                >
                  <option value="Baixa" className="bg-slate-900">Baixa</option>
                  <option value="Média" className="bg-slate-900">Média</option>
                  <option value="Alta" className="bg-slate-900">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Data Limite (Opcional)
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 py-2.5 px-3.5 text-slate-355 text-xs focus:border-blue-500 focus:outline-none bg-[#0B0F19] transition-all cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading || !newTitle.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
            >
              {formLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Criar Tarefa
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quadro Kanban (3 colunas no desktop, empilhado no mobile) */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          
          {/* Coluna 1: INÍCIO */}
          {showTodo && (
            <div className="bg-[#111827]/40 border border-slate-800/60 rounded-2xl p-4.5 space-y-4 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  <h3 className="font-display font-bold text-slate-300 text-sm">Início</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {todoTasks.length}
                </span>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {todoTasks.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-8 bg-[#161f30]/30 rounded-xl border border-dashed border-slate-800">Sem tarefas pendentes.</p>
                ) : (
                  todoTasks.map(renderTaskCard)
                )}
              </div>
            </div>
          )}

          {/* Coluna 2: FAZENDO */}
          {showDoing && (
            <div className="bg-[#111827]/40 border border-slate-800/60 rounded-2xl p-4.5 space-y-4 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <h3 className="font-display font-bold text-slate-300 text-sm">Fazendo</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {doingTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {doingTasks.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-8 bg-[#161f30]/30 rounded-xl border border-dashed border-slate-800">Nenhuma tarefa em execução.</p>
                ) : (
                  doingTasks.map(renderTaskCard)
                )}
              </div>
            </div>
          )}

          {/* Coluna 3: ENCERRADO */}
          {showDone && (
            <div className="bg-[#111827]/40 border border-slate-800/60 rounded-2xl p-4.5 space-y-4 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <h3 className="font-display font-bold text-slate-300 text-sm">Encerrado</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {doneTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {doneTasks.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-8 bg-[#161f30]/30 rounded-xl border border-dashed border-slate-800">Nenhuma tarefa concluída.</p>
                ) : (
                  doneTasks.map(renderTaskCard)
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
