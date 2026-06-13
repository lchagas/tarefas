import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente foram configuradas
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'SEU_SUPABASE_URL_AQUI');

// Instancia o cliente apenas se configurado para evitar exceções de inicialização
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Auxiliar para validar se uma string é um UUID válido do Postgres
const isValidUUID = (str) => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/**
 * Interface unificada de Persistência (Supabase ou LocalStorage)
 * Isso permite que o aplicativo mude dinamicamente entre os modos com a mesma API de persistência.
 */
export const db = {
  // --- TAREFAS ---
  async getTasks(userId) {
    if (isSupabaseConfigured && userId && isValidUUID(userId)) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(t => ({
        ...t,
        status: t.status || (t.completed ? 'done' : 'todo')
      }));
    } else {
      const tasks = localStorage.getItem('todo_tasks');
      const parsedTasks = tasks ? JSON.parse(tasks) : [];
      return parsedTasks.map(t => ({
        ...t,
        status: t.status || (t.completed ? 'done' : 'todo')
      }));
    }
  },

  async createTask(taskData, userId) {
    const status = taskData.status || (taskData.completed ? 'done' : 'todo');
    const completed = status === 'done';
    const normalizedData = { ...taskData, status, completed };

    if (isSupabaseConfigured && userId && isValidUUID(userId)) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...normalizedData, user_id: userId }])
        .select();
      
      if (error) throw error;
      return data[0];
    } else {
      const tasks = this.getLocalTasks();
      const newTask = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...normalizedData,
        user_id: userId || 'local-user'
      };
      tasks.unshift(newTask);
      this.saveLocalTasks(tasks);
      return newTask;
    }
  },

  async updateTask(taskId, updates, userId) {
    const normalizedUpdates = { ...updates };
    if (updates.status !== undefined) {
      normalizedUpdates.completed = updates.status === 'done';
    } else if (updates.completed !== undefined) {
      normalizedUpdates.status = updates.completed ? 'done' : 'todo';
    }

    if (isSupabaseConfigured && userId && isValidUUID(userId)) {
      const { data, error } = await supabase
        .from('tasks')
        .update(normalizedUpdates)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      return data[0];
    } else {
      const tasks = this.getLocalTasks();
      const index = tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...normalizedUpdates };
        this.saveLocalTasks(tasks);
        return tasks[index];
      }
      return null;
    }
  },

  async deleteTask(taskId, userId) {
    if (isSupabaseConfigured && userId && isValidUUID(userId)) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } else {
      const tasks = this.getLocalTasks();
      const filtered = tasks.filter(t => t.id !== taskId);
      this.saveLocalTasks(filtered);
      return true;
    }
  },

  // Helpers do LocalStorage
  getLocalTasks() {
    const tasks = localStorage.getItem('todo_tasks');
    return tasks ? JSON.parse(tasks) : [];
  },

  saveLocalTasks(tasks) {
    localStorage.setItem('todo_tasks', JSON.stringify(tasks));
  }
};
