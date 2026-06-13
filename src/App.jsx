import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Login from './components/Login';
import TaskList from './components/TaskList';
import Analytics from './components/Analytics';
import CalendarView from './components/CalendarView';
import { CheckSquare, BarChart3, Calendar, LogOut, User, AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'analytics', 'calendar'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica se existe usuário no modo Demo Local
    const localUser = localStorage.getItem('todo_demo_user');
    if (localUser) {
      setUser(JSON.parse(localUser));
      setLoading(false);
      return;
    }

    // 2. Se o Supabase estiver configurado, escuta o estado da sessão
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('todo_demo_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-450">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  // Se o usuário não está logado, exibe a tela de Login
  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      
      {/* Aviso de Modo Demo Local no cabeçalho */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-950/20 border-b border-amber-900/40 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>
            <strong>Modo de Teste Local:</strong> Suas tarefas estão sendo salvas no LocalStorage deste navegador. Configure as variáveis de ambiente no arquivo <code className="bg-amber-900/30 px-1 py-0.5 rounded font-mono font-bold text-amber-200">.env.local</code> para sincronizar com o Supabase.
          </span>
        </div>
      )}

      {/* Navbar (Cabeçalho) */}
      <header className="bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold font-display text-lg">
                ✓
              </div>
              <span className="font-display font-bold text-xl text-slate-100 tracking-tight">FocusFlow</span>
            </div>

            {/* Menu de Opções / Abas */}
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                  activeTab === 'tasks'
                    ? 'bg-slate-800/60 text-blue-400 border-slate-800/50'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border-transparent'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                Tarefas
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                  activeTab === 'analytics'
                    ? 'bg-slate-800/60 text-blue-400 border-slate-800/50'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border-transparent'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Análises
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                  activeTab === 'calendar'
                    ? 'bg-slate-800/60 text-blue-400 border-slate-800/50'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border-transparent'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Calendário
              </button>
            </nav>

            {/* Usuário e Sair */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-slate-350 text-sm border-r border-slate-800/80 pr-4">
                <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700/60">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium truncate max-w-[150px]">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-950/30 transition-all duration-200 cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-slate-800 bg-[#111827] flex justify-around py-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === 'tasks' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <CheckSquare className="h-5 w-5" />
            <span>Tarefas</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === 'analytics' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Análises</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === 'calendar' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span>Calendário</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tasks' && <TaskList user={user} />}
        {activeTab === 'analytics' && <Analytics user={user} />}
        {activeTab === 'calendar' && <CalendarView user={user} />}
      </main>

      {/* Rodapé */}
      <footer className="bg-slate-900/30 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} FocusFlow - Organização Inteligente e Produtividade.</p>
      </footer>
    </div>
  );
}
