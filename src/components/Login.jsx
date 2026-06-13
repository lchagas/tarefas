import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Lock, Mail, UserPlus, LogIn, Sparkles, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (!/[A-Z]/.test(pass)) return 'A senha deve conter pelo menos uma letra maiúscula.';
    if (!/[a-z]/.test(pass)) return 'A senha deve conter pelo menos uma letra minúscula.';
    if (!/[0-9]/.test(pass)) return 'A senha deve conter pelo menos um número.';
    if (!/[@$!%*?&]/.test(pass)) return 'A senha deve conter pelo menos um caractere especial (ex: @$!%*?&).';
    return null;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!isSupabaseConfigured) {
      // Simulação em Modo Demo Local
      setTimeout(() => {
        setLoading(false);
        const demoUser = {
          id: 'local-user-123',
          email: email,
          user_metadata: { full_name: name || email.split('@')[0] }
        };
        localStorage.setItem('todo_demo_user', JSON.stringify(demoUser));
        onLoginSuccess(demoUser);
      }, 1000);
      return;
    }

    if (isSignUp) {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setMessage({ type: 'error', text: pwdError });
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0],
            }
          }
        });
        if (error) throw error;
        
        // No Supabase, se a confirmação de e-mail estiver ativa, o usuário não loga imediatamente.
        if (data?.user && data.session === null) {
          setMessage({ 
            type: 'success', 
            text: 'Cadastro realizado! Verifique seu e-mail para confirmação (ou faça login se a confirmação estiver desativada).' 
          });
          setIsSignUp(false);
        } else if (data?.user) {
          onLoginSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data?.user) {
          onLoginSuccess(data.user);
        }
      }
    } catch (error) {
      let errorMsg = error.message || 'Ocorreu um erro na autenticação.';
      if (errorMsg.toLowerCase().includes('email not confirmed') || errorMsg.toLowerCase().includes('email_not_confirmed')) {
        errorMsg = 'Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada para ativar a conta.';
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const demoUser = {
        id: 'local-user-123',
        email: 'visitante@todolist.com',
        user_metadata: { full_name: 'Visitante Demo' }
      };
      localStorage.setItem('todo_demo_user', JSON.stringify(demoUser));
      onLoginSuccess(demoUser);
    }, 800);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] px-4 py-12 sm:px-6 lg:px-8">
      {/* Banner de Aviso caso o Supabase não esteja configurado */}
      {!isSupabaseConfigured && (
        <div className="mb-8 max-w-md rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 shadow-sm animate-fade-in">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-300">Modo de Demonstração Local Ativo</h3>
              <p className="mt-1 text-xs text-amber-450 leading-relaxed">
                As credenciais do Supabase não foram encontradas no arquivo <code className="bg-amber-900/30 px-1 py-0.5 rounded text-amber-200 font-mono text-[10px] font-bold">.env.local</code>.
                O aplicativo funcionará temporariamente salvando as tarefas no seu <strong>Navegador (LocalStorage)</strong>. Você pode simular qualquer e-mail/senha abaixo ou clicar no botão Demo.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/50 transition-all duration-300">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-950/30 text-blue-400 mb-4 ring-8 ring-blue-950/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-100">
            {isSignUp ? 'Criar uma nova conta' : 'Entrar na sua conta'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp ? 'Comece a organizar suas tarefas hoje' : 'Gerencie seu dia com foco e produtividade'}
          </p>
        </div>

        {/* Alternador de abas */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800/80">
          <button
            onClick={() => { setIsSignUp(false); setMessage({ type: '', text: '' }); }}
            className={`flex-1 rounded-md py-2 text-center text-sm font-medium transition-all duration-200 cursor-pointer ${
              !isSignUp 
                ? 'bg-slate-850 text-slate-100 shadow-sm border border-slate-800/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Acessar Conta
          </button>
          <button
            onClick={() => { setIsSignUp(true); setMessage({ type: '', text: '' }); }}
            className={`flex-1 rounded-md py-2 text-center text-sm font-medium transition-all duration-200 cursor-pointer ${
              isSignUp 
                ? 'bg-slate-850 text-slate-100 shadow-sm border border-slate-800/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cadastrar-se
          </button>
        </div>

        {message.text && (
          <div className={`rounded-lg p-3.5 text-sm flex items-start gap-2.5 animate-fade-in ${
            message.type === 'error' 
              ? 'bg-rose-950/20 border border-rose-900/50 text-rose-350' 
              : 'bg-emerald-950/20 border border-emerald-900/50 text-emerald-350'
          }`}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{message.text}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4 rounded-md shadow-sm">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="block w-full rounded-xl border border-slate-800 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all duration-200 text-sm bg-slate-950/40 hover:bg-slate-950/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Endereço de E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="block w-full rounded-xl border border-slate-800 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all duration-200 text-sm bg-slate-950/40 hover:bg-slate-950/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-800 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all duration-200 text-sm bg-slate-950/40 hover:bg-slate-950/20"
                />
              </div>
              {isSignUp && (
                <p className="mt-1.5 text-[10px] text-slate-500 leading-normal">
                  A senha deve ter pelo menos 8 caracteres, contendo letra maiúscula, minúscula, número e caractere especial (ex: @$!%*?&).
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:transform active:scale-[0.98] transition-all-300 shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {isSignUp ? 'Criar Minha Conta' : 'Acessar Aplicativo'}
                </span>
              )}
            </button>
          </div>
        </form>

        {!isSupabaseConfigured && (
          <div className="mt-6">
            <div className="relative flex justify-center text-xs uppercase my-4">
              <span className="bg-[#111827] px-3 text-slate-500 font-semibold tracking-wider">Ou</span>
            </div>
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#161f30] hover:bg-slate-800/80 py-3 px-4 text-sm font-semibold text-slate-300 active:scale-[0.98] transition-all-300 cursor-pointer"
            >
              Entrar no Modo Demo Local
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
