"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro de autenticação: ' + error.message);
      setLoading(false);
    } else {
      // Login com sucesso, redireciona
      router.push('/'); 
      router.refresh(); // Força uma atualização para garantir que o layout sabe que estamos logados
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      {/* Container Principal com fundo branco e sombra suave */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800/10">
        
        {/* Cabeçalho com Gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-10 text-center relative overflow-hidden">
          {/* Efeito de fundo sutil */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-y-6 origin-top-left"></div>
          
          <div className="relative z-10 flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
               <Shield className="text-white w-12 h-12" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sentinel Enterprise</h1>
          <p className="text-indigo-100 mt-3 text-sm font-medium">Portal de Segurança Unificado</p>
        </div>
        
        {/* Formulário */}
        <form onSubmit={handleLogin} className="p-10 space-y-7">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Email Corporativo</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // CORREÇÃO AQUI: text-gray-900 para o texto ficar escuro e legível
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="seu.nome@empresa.com"
                  required
                />
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // CORREÇÃO AQUI: text-gray-900 e bg-gray-50
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium font-mono"
                  placeholder="••••••••"
                  required
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-indigo-600 hover:to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                A validar credenciais...
              </span>
            ) : 'Entrar no Sistema'}
          </button>
           <p className="text-center text-gray-500 text-xs mt-4">© 2026 Sentinel Security Systems. Acesso restrito.</p>
        </form>
      </div>
    </div>
  );
}