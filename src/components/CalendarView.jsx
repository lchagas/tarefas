import React, { useState, useEffect } from 'react';
import { db } from '../supabaseClient';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CalendarDays, 
  Check, 
  ChevronRight,
  Loader2
} from 'lucide-react';

const CATEGORIES = {
  'Trabalho': 'bg-indigo-950/40 border-indigo-900/50 text-indigo-300',
  'Pessoal': 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300',
  'Estudos': 'bg-amber-950/40 border-amber-900/50 text-amber-300',
  'Outros': 'bg-slate-800/40 border-slate-700/50 text-slate-350'
};

export default function CalendarView({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null); // Data selecionada no minicalendário
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await db.getTasks(user?.id);
      setTasks(data);
    } catch (err) {
      setError('Erro ao carregar as tarefas no calendário.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
      await db.updateTask(taskId, { completed: !currentStatus }, user?.id);
    } catch (err) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: currentStatus } : t));
      console.error(err);
    }
  };

  // Helper para datas
  const getLocalDateString = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString(0);
  const tomorrowStr = getLocalDateString(1);

  // Gera os próximos 7 dias para o Mini Calendário
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dayNum = d.getDate();
    const dateStr = d.toISOString().split('T')[0];
    return { dayName, dayNum, dateStr, fullDate: d };
  });

  // Agrupamento lógico das tarefas
  const categorizedTasks = tasks.reduce((acc, task) => {
    if (!task.due_date) {
      acc.noDate.push(task);
      return acc;
    }

    const taskDate = task.due_date;

    // Atrasada
    if (!task.completed && taskDate < todayStr) {
      acc.overdue.push(task);
    } 
    // Hoje
    else if (taskDate === todayStr) {
      acc.today.push(task);
    } 
    // Amanhã
    else if (taskDate === tomorrowStr) {
      acc.tomorrow.push(task);
    } 
    // Futuras
    else if (taskDate > tomorrowStr) {
      acc.upcoming.push(task);
    }

    return acc;
  }, { overdue: [], today: [], tomorrow: [], upcoming: [], noDate: [] });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
  };

  const filteredByDayTasks = selectedDay 
    ? tasks.filter(t => t.due_date === selectedDay)
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100 tracking-tight m-0">Calendário e Agenda</h1>
        <p className="text-sm text-slate-400 mt-1">Visualize seus prazos e compromissos organizados de forma cronológica.</p>
      </div>

      {/* Mini Calendário (Linha dos Próximos 7 Dias) */}
      <div className="bg-[#111827] border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-blue-500" />
          Próximos 7 dias
        </h3>
        
        <div className="grid grid-cols-7 gap-2">
          {next7Days.map((day) => {
            const isSelected = selectedDay === day.dateStr;
            const hasTasks = tasks.some(t => t.due_date === day.dateStr && !t.completed);
            
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDay(selectedDay === day.dateStr ? null : day.dateStr)}
                className={`py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-250 cursor-pointer border ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-102' 
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {day.dayName}
                </span>
                <span className="text-lg font-bold mt-1 font-display">
                  {day.dayNum}
                </span>
                {hasTasks && (
                  <span className={`h-1.5 w-1.5 rounded-full mt-1.5 ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exibição condicional caso um dia esteja selecionado no Mini Calendário */}
      {selectedDay && (
        <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h3 className="font-display font-semibold text-slate-200 text-sm md:text-base">
              Tarefas para {new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button 
              onClick={() => setSelectedDay(null)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              Ver agenda completa
            </button>
          </div>

          {filteredByDayTasks.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Nenhuma tarefa marcada para este dia.</p>
          ) : (
            <div className="space-y-2.5">
              {filteredByDayTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-800/60 hover:bg-slate-800/40 transition-all duration-200">
                  <button
                    onClick={() => handleToggleComplete(task.id, task.completed)}
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                      task.completed
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-700 hover:border-blue-400 bg-slate-900'
                    }`}
                  >
                    {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                  </button>
                  <span className={`text-sm font-medium text-slate-200 ${task.completed ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agenda/Linha do Tempo Completa */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. ATRASADAS (Apenas exibe se houver) */}
          {categorizedTasks.overdue.length > 0 && (
            <div className="bg-[#111827] border border-rose-950/40 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-450 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Atrasadas ({categorizedTasks.overdue.length})
              </h3>
              
              <div className="space-y-3">
                {categorizedTasks.overdue.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 hover:border-rose-800 transition-all duration-200">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className="h-5 w-5 rounded-full border border-rose-850 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer bg-slate-900 text-white"
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3px] text-blue-400" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 leading-tight">{task.title}</p>
                      <span className="text-[10px] font-bold text-rose-300 uppercase mt-1 inline-block bg-rose-950/40 border border-rose-900/50 px-1.5 py-0.5 rounded-md">
                        Venceu em {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. HOJE */}
          <div className="bg-[#111827] border border-slate-855 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-500" />
              Hoje ({categorizedTasks.today.length})
            </h3>
            
            {categorizedTasks.today.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhuma tarefa marcada para hoje.</p>
            ) : (
              <div className="space-y-3">
                {categorizedTasks.today.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/60 hover:bg-slate-800/40 transition-all duration-200">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer ${
                        task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 hover:border-blue-400 bg-slate-900'
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                    </button>
                    <p className={`text-sm font-semibold text-slate-200 text-sm leading-tight ${task.completed ? 'line-through text-slate-550' : ''}`}>
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. AMANHÃ */}
          <div className="bg-[#111827] border border-slate-855 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-blue-500" />
              Amanhã ({categorizedTasks.tomorrow.length})
            </h3>
            
            {categorizedTasks.tomorrow.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhuma tarefa marcada para amanhã.</p>
            ) : (
              <div className="space-y-3">
                {categorizedTasks.tomorrow.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/60 hover:bg-slate-800/40 transition-all duration-200">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer ${
                        task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 hover:border-blue-400 bg-slate-900'
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                    </button>
                    <p className={`text-sm font-semibold text-slate-200 text-sm leading-tight ${task.completed ? 'line-through text-slate-550' : ''}`}>
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. FUTURAS (Próximos Dias) */}
          <div className="bg-[#111827] border border-slate-855 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-indigo-500" />
              Futuras ({categorizedTasks.upcoming.length})
            </h3>
            
            {categorizedTasks.upcoming.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhuma tarefa futura com data.</p>
            ) : (
              <div className="space-y-3">
                {categorizedTasks.upcoming.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/60 hover:bg-slate-800/40 transition-all duration-200">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer ${
                        task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 hover:border-blue-400 bg-slate-900'
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold text-slate-205 leading-tight ${task.completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-450 mt-1 inline-block">
                        Vence em {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. SEM DATA */}
          <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-500"></span>
              Sem data definida ({categorizedTasks.noDate.length})
            </h3>
            
            {categorizedTasks.noDate.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Todas as tarefas possuem uma data de conclusão.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categorizedTasks.noDate.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/60 hover:bg-slate-800/40 transition-all duration-200">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer ${
                        task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 hover:border-blue-450 bg-slate-900'
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold text-slate-205 leading-tight ${task.completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 inline-block ${
                        task.category === 'Trabalho' ? 'bg-indigo-950/40 border-indigo-900/50 text-indigo-300' :
                        task.category === 'Pessoal' ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300' :
                        task.category === 'Estudos' ? 'bg-amber-950/40 border-amber-900/50 text-amber-300' :
                        'bg-slate-800/40 border-slate-700/50 text-slate-350'
                      }`}>
                        {task.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
