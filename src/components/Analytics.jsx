import React, { useState, useEffect } from 'react';
import { db } from '../supabaseClient';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';
import { 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  ListTodo
} from 'lucide-react';

// Cores para os gráficos de pizza
const COLORS_CATEGORY = ['#6366f1', '#10b981', '#f59e0b', '#64748b']; // Indigo, Emerald, Amber, Slate
const COLORS_PRIORITY = ['#f43f5e', '#f59e0b', '#0ea5e9']; // Rose, Amber, Sky

export default function Analytics({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setError('Erro ao carregar os dados de análises.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111827] border border-slate-850 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-slate-400 font-medium">Processando dados estatísticos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 text-sm text-rose-350 flex items-center gap-2.5">
        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // Cálculos de Métricas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Tarefas Atrasadas
  const overdueTasks = tasks.filter(t => {
    if (t.completed || !t.due_date) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(t.due_date);
    dueDate.setHours(24,0,0,0);
    return dueDate < today;
  }).length;

  // Processamento de dados do Kanban (Status)
  const todoCount = tasks.filter(t => (t.status || (t.completed ? 'done' : 'todo')) === 'todo').length;
  const doingCount = tasks.filter(t => (t.status || (t.completed ? 'done' : 'todo')) === 'doing').length;
  const doneCount = tasks.filter(t => (t.status || (t.completed ? 'done' : 'todo')) === 'done').length;

  const statusData = [
    { name: 'Início', quantidade: todoCount, fill: '#3b82f6' },
    { name: 'Fazendo', quantidade: doingCount, fill: '#f59e0b' },
    { name: 'Encerrado', quantidade: doneCount, fill: '#10b981' }
  ];

  // Processamento de dados por Categoria
  const categoryDataMap = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryDataMap).map(name => ({
    name,
    value: categoryDataMap[name]
  }));

  // Processamento de dados por Prioridade
  const priorityDataMap = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const priorityOrder = ['Alta', 'Média', 'Baixa'];
  const priorityData = priorityOrder
    .filter(name => priorityDataMap[name] > 0)
    .map(name => ({
      name,
      value: priorityDataMap[name]
    }));

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Título de Seção */}
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100 tracking-tight m-0">Análises de Produtividade</h1>
        <p className="text-sm text-slate-400 mt-1">Veja seus hábitos de conclusão de tarefas e distribuição de carga de trabalho.</p>
      </div>

      {/* Grid de Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total de Tarefas */}
        <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-950/40 text-blue-400 rounded-xl flex items-center justify-center border border-blue-900/30">
            <ListTodo className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Total</span>
            <span className="text-2xl font-bold text-slate-100">{totalTasks}</span>
          </div>
        </div>

        {/* Concluídas */}
        <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-950/40 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-900/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Concluídas</span>
            <span className="text-2xl font-bold text-slate-100">{completedTasks}</span>
          </div>
        </div>

        {/* Taxa de Conclusão */}
        <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-950/40 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-900/30">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Taxa de Conclusão</span>
            <span className="text-2xl font-bold text-slate-100">{completionRate}%</span>
          </div>
        </div>

        {/* Pendentes / Atrasadas */}
        <div className={`bg-[#111827] border rounded-2xl p-6 shadow-sm flex items-center gap-4 ${
          overdueTasks > 0 ? 'border-rose-900/50 bg-rose-950/10' : 'border-slate-850'
        }`}>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${
            overdueTasks > 0 
              ? 'bg-rose-950/40 text-rose-400 border-rose-900/30' 
              : 'bg-slate-950/40 text-slate-400 border-slate-800/60'
          }`}>
            {overdueTasks > 0 ? <AlertTriangle className="h-6 w-6 animate-pulse" /> : <Circle className="h-6 w-6" />}
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {overdueTasks > 0 ? 'Atrasadas' : 'Pendentes'}
            </span>
            <span className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-rose-450' : 'text-slate-100'}`}>
              {overdueTasks > 0 ? overdueTasks : pendingTasks}
            </span>
          </div>
        </div>

      </div>

      {totalTasks === 0 ? (
        <div className="bg-[#111827] border border-slate-850 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-sm text-slate-400">Nenhum dado disponível. Adicione tarefas primeiro para ver relatórios detalhados.</p>
        </div>
      ) : (
        /* Seção de Gráficos */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico 1: Status do Kanban */}
            <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-100 text-sm md:text-base">Distribuição do Fluxo</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', fontSize: '11px', color: '#f3f4f6' }}
                      itemStyle={{ color: '#f3f4f6' }}
                    />
                    <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Categorias */}
            <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-100 text-sm md:text-base">Tarefas por Categoria</h3>
              {categoryData.length === 0 ? (
                <p className="text-sm text-slate-405 py-12 text-center">Nenhuma categoria registrada.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_CATEGORY[index % COLORS_CATEGORY.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', fontSize: '11px', color: '#f3f4f6' }} 
                        itemStyle={{ color: '#f3f4f6' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Gráfico 3: Prioridades */}
            <div className="bg-[#111827] border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-100 text-sm md:text-base">Distribuição por Prioridade</h3>
              {priorityData.length === 0 ? (
                <p className="text-sm text-slate-405 py-12 text-center">Nenhuma prioridade registrada.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => {
                          const priorityIdx = priorityOrder.indexOf(entry.name);
                          const color = COLORS_PRIORITY[priorityIdx !== -1 ? priorityIdx : 1];
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', fontSize: '11px', color: '#f3f4f6' }} 
                        itemStyle={{ color: '#f3f4f6' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Barra de Progresso do Usuário */}
          <div className="bg-[#111827] border border-slate-855 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-100 text-sm md:text-base">Meta de Conclusão Diária</h3>
              <span className="text-xs font-bold text-blue-400 bg-blue-955/50 border border-blue-900/30 px-2.5 py-0.5 rounded-full">{completionRate}% Concluído</span>
            </div>
            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {completionRate === 100 
                ? 'Espetacular! Você completou 100% de todas as tarefas cadastradas. Dia produtivo!' 
                : completionRate >= 75 
                  ? 'Excelente ritmo! A maior parte das suas tarefas foi concluída. Continue assim!'
                  : completionRate >= 50 
                    ? 'Metade do caminho percorrida! Mantenha o foco para concluir o restante.'
                    : completionRate > 0 
                      ? 'Você começou a progredir! Que tal riscar mais algumas tarefas hoje?'
                      : 'Nenhuma tarefa concluída ainda. Dê o primeiro passo marcando uma tarefa como concluída!'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
