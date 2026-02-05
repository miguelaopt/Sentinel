"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Shield, AlertTriangle, Loader2, CheckCircle2, 
  Download, TrendingUp, LayoutDashboard, List, Settings, User,
  Search, Bell, LogOut, Plus, Trash2, Key, X, FileText, Activity, EyeOff, Wand2, Zap
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

// --- COMPONENTES AUXILIARES ---

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-lg shadow-2xl text-white font-medium flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50 border ${type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'}`}>
    {type === 'success' ? <CheckCircle2 size={20} className="text-white"/> : <AlertTriangle size={20} className="text-white"/>}
    <div>
      <p className="text-sm font-bold">{type === 'success' ? 'Sucesso' : 'Erro'}</p>
      <p className="text-xs opacity-90">{message}</p>
    </div>
  </div>
);

// MODAL DE AI FIX (GEMINI)
const AiFixModal = ({ isOpen, onClose, issue }) => {
    const [loading, setLoading] = useState(false);
    const [fixedCode, setFixedCode] = useState(null);

    useEffect(() => {
        if (isOpen && issue) {
            setLoading(true);
            setFixedCode(null);
            
            // LINK DO RENDER CORRIGIDO AQUI
            fetch('https://sentinel-api-rr8s.onrender.com/fix-code', { 
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ snippet: issue.snippet, vulnerability: issue.name })
            })
            .then(res => {
                if (!res.ok) throw new Error("Erro no servidor (Verifique se o Backend foi atualizado no Render)");
                return res.json();
            })
            .then(data => setFixedCode(data.fixed_code || "A IA não conseguiu gerar uma correção."))
            .catch((err) => setFixedCode(`Erro: ${err.message}`))
            .finally(() => setLoading(false));
        }
    }, [isOpen, issue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold flex gap-2 items-center text-slate-800">
                        <Wand2 className="text-indigo-600"/> Sentinel AI <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold">GEMINI FLASH</span>
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <p className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-2"><AlertTriangle size={12}/> Código Vulnerável</p>
                        <pre className="bg-red-50 p-4 rounded-lg text-xs font-mono text-red-700 overflow-x-auto border border-red-100">
                            {issue.snippet || "Snippet não disponível."}
                        </pre>
                    </div>
                    <div className="flex justify-center py-2">
                        {loading ? <Loader2 className="animate-spin text-indigo-600 w-8 h-8"/> : <div className="bg-indigo-50 p-2 rounded-full border border-indigo-100"><Zap className="text-indigo-600 fill-indigo-600"/></div>}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center gap-2"><CheckCircle2 size={12}/> Correção Sugerida</p>
                        {loading ? (
                            <div className="h-24 bg-slate-100 rounded-lg animate-pulse border border-slate-200"></div>
                        ) : (
                            <pre className="bg-emerald-50 p-4 rounded-lg text-xs font-mono text-emerald-800 overflow-x-auto border border-emerald-100">
                                {fixedCode}
                            </pre>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-md">Concluído</button>
                </div>
            </div>
        </div>
    );
};

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'Viewer' });
  
    if (!isOpen) return null;
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await fetch('/api/create-user', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onSuccess(formData.email);
        onClose();
      } catch (err) {
        alert("Erro: " + err.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-100">
             <h3 className="text-lg font-bold text-slate-800">Novo Operador</h3>
             <p className="text-xs text-slate-500">Adicionar membro à equipa.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <input className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Nome Completo" onChange={e => setFormData({...formData, fullName: e.target.value})} required/>
            <input className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" type="email" placeholder="Email Corporativo" onChange={e => setFormData({...formData, email: e.target.value})} required/>
            <input className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" type="password" placeholder="Password Inicial" onChange={e => setFormData({...formData, password: e.target.value})} required/>
            <select className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="Viewer">Viewer</option>
                <option value="Developer">Developer</option>
                <option value="Admin">Admin</option>
            </select>
            <div className="flex gap-3 mt-6 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm">
                    {loading ? 'A processar...' : 'Criar Conta'}
                </button>
            </div>
          </form>
        </div>
      </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function Home() {
  const router = useRouter();
  
  // ESTADOS
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedIssueForAi, setSelectedIssueForAi] = useState(null);

  // DADOS
  const [latestScan, setLatestScan] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState({ email: false, slack: false, weekly: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  
  // Estado local para esconder issues ignorados
  const [ignoredIssues, setIgnoredIssues] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logAction = async (action, details) => {
      if (!userProfile?.id) return;
      await supabase.from('audit_logs').insert({
          actor_id: userProfile.id,
          actor_email: userProfile.email,
          action: action,
          details: details
      });
      refreshData(userProfile.id); 
  };

  const refreshData = async (userId) => {
     if (!userId) return;
     const { data: usersData } = await supabase.from('profiles').select('*').order('full_name');
     if (usersData) setUsers(usersData);
     const { data: keysData } = await supabase.from('api_keys').select('*').eq('user_id', userId);
     if (keysData) setApiKeys(keysData);
     const { data: logsData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
     if (logsData) setAuditLogs(logsData);
  };

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { router.push('/login'); return; }

        let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const safeProfile = profile || { 
            id: user.id, 
            email: user.email, 
            full_name: user.user_metadata?.full_name || 'Utilizador', 
            role: 'Viewer' 
        };

        setUserProfile(safeProfile);
        // Carregar notificações apenas se existirem no objeto settings
        if (safeProfile.settings) {
            setNotifications(safeProfile.settings);
        }

        const { data: scans } = await supabase.from('scans').select('created_at, report').order('created_at', { ascending: true }).limit(30);
        if (scans && scans.length > 0) {
            setHistoryData(scans.map(s => ({ date: format(new Date(s.created_at), 'dd/MM'), total: s.report.total_issues, critical: s.report.summary.critical })));
            setLatestScan(scans[scans.length - 1].report);
        }
        
        await refreshData(safeProfile.id);

      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // --- ACTIONS ---
  
  const handleAiFix = (issue) => {
      setSelectedIssueForAi(issue);
      setAiModalOpen(true);
      logAction('AI_FIX_REQUESTED', `Solicitou correção AI para ${issue.name}`);
  };

  const handleIgnoreIssue = (issueName) => {
      setIgnoredIssues([...ignoredIssues, issueName]);
      logAction('ISSUE_IGNORED', `Ignorou a vulnerabilidade: ${issueName}`);
      showToast('Vulnerabilidade oculta.', 'success');
  };

  // --- CORREÇÃO DO BOTÃO DE NOTIFICAÇÕES ---
  const handleToggleNotification = async (key) => {
      if (!userProfile?.id) return;
      
      const newSettings = { ...notifications, [key]: !notifications[key] };
      setNotifications(newSettings); // UI Optimistic Update
      
      // Tenta gravar na base de dados
      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', userProfile.id);
      
      if (error) { 
          console.error("Erro SQL:", error.message);
          showToast('Erro ao gravar: Verifique permissões.', 'error'); 
          setNotifications(notifications); // Revert se falhar
      } else { 
          showToast('Preferências atualizadas!');
          logAction('SETTINGS_UPDATE', `Alterou a notificação ${key} para ${!notifications[key]}`);
      }
  };

  const handleGenerateKey = async () => {
      if (!userProfile?.id) return;
      const newKey = 'sk_sentinel_' + Math.random().toString(36).substring(2);
      const { error } = await supabase.from('api_keys').insert({ user_id: userProfile.id, key_value: newKey });
      
      if (error) showToast('Erro ao criar chave', 'error');
      else { 
          showToast('Nova API Key gerada!'); 
          logAction('KEY_GENERATED', 'Gerou uma nova chave de acesso API');
          refreshData(userProfile.id); 
      }
  };

  const handleDeleteUser = async (targetId, targetEmail) => {
      if (!confirm(`Tem a certeza que quer remover ${targetEmail}?`)) return;
      const { error } = await supabase.from('profiles').delete().eq('id', targetId);
      if (error) showToast("Erro: Apenas Admins.", "error");
      else { 
          showToast("Utilizador removido."); 
          logAction('USER_REMOVED', `Removeu o utilizador ${targetEmail} da equipa`);
          refreshData(userProfile?.id); 
      }
  };

  const handleUserCreated = (email) => {
      showToast('Utilizador criado com sucesso!');
      logAction('USER_CREATED', `Adicionou ${email} à equipa`);
      refreshData(userProfile?.id);
  };

  const generatePDF = () => {
    if (!latestScan) return;
    const doc = new jsPDF();
    const data = latestScan;
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Sentinel Enterprise Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Resumo Executivo", 14, 55);
    autoTable(doc, {
      startY: 60,
      head: [['Métrica', 'Valor']],
      body: [['Total Vulnerabilidades', data.total_issues], ['Críticas', data.summary.critical], ['Ficheiros Afetados', data.issues.length]],
      theme: 'grid', headStyles: { fillColor: [79, 70, 229] }
    });
    doc.text("Detalhes Técnicos", 14, doc.lastAutoTable.finalY + 15);
    const issuesToExport = data.issues.map(issue => [issue.severity, issue.name, `${issue.file} (L:${issue.line})`]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Gravidade', 'Vulnerabilidade', 'Local']],
      body: issuesToExport,
      theme: 'striped', headStyles: { fillColor: [220, 38, 38] }, styles: { fontSize: 8 }
    });
    doc.save(`sentinel-report.pdf`);
    showToast('Relatório PDF descarregado!');
    logAction('REPORT_DOWNLOADED', 'Exportou o relatório PDF de segurança');
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-12 h-12 text-indigo-600"/></div>;
  
  const emptyState = !latestScan;
  const isCritical = latestScan?.summary.critical > 0;
  
  const filteredIssues = latestScan?.issues
    .filter(issue => !ignoredIssues.includes(issue.name))
    .filter(issue => {
        const matchesSearch = issue.name.toLowerCase().includes(searchTerm.toLowerCase()) || issue.file.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = filterSeverity === 'ALL' || issue.severity === filterSeverity;
        return matchesSearch && matchesSeverity;
    }) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleUserCreated} />
      <AiFixModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} issue={selectedIssueForAi} />
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 shadow-2xl hidden md:flex border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30"><Shield className="w-6 h-6 text-white" /></div>
          <div>
              <span className="font-bold text-lg tracking-tight block">Sentinel</span>
              <span className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">Enterprise</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <MenuButton icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MenuButton icon={<List size={18}/>} label="Vulnerabilidades" active={activeTab === 'vulnerabilities'} onClick={() => setActiveTab('vulnerabilities')} />
          <MenuButton icon={<Activity size={18}/>} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          <MenuButton icon={<User size={18}/>} label="Equipa" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <MenuButton icon={<Settings size={18}/>} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border border-slate-600">{userProfile?.full_name?.charAt(0)}</div>
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate w-32">{userProfile?.full_name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{userProfile?.role}</p>
                </div>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg text-xs flex justify-center items-center w-full gap-2 transition-all"><LogOut size={14}/> Terminar Sessão</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 md:ml-64 p-8 md:p-10 overflow-y-auto bg-slate-50">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <header className="flex justify-between items-center mb-10">
           <div>
               <h1 className="text-3xl font-extrabold capitalize text-slate-900 tracking-tight">{activeTab === 'audit' ? 'Audit Logs' : activeTab}</h1>
               <p className="text-slate-500 text-sm mt-1">Plataforma de Segurança Corporativa</p>
           </div>
           
           <div className="flex gap-4">
              <button className="p-2 text-slate-400 hover:text-indigo-600 relative transition-colors"><Bell size={24}/><span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span></button>
              {activeTab === 'dashboard' && !emptyState && <button onClick={generatePDF} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 text-sm"><Download size={18}/> Exportar Relatório</button>}
           </div>
        </header>

        {activeTab === 'dashboard' && !emptyState && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <KPICard title="Total Vulnerabilidades" value={latestScan.total_issues} icon={<AlertTriangle className="text-white"/>} color="bg-indigo-500" />
               <KPICard title="Risco Crítico" value={latestScan.summary.critical} icon={<Shield className="text-white"/>} color="bg-red-500" />
               <KPICard title="Ficheiros Analisados" value={latestScan.total_issues * 3} icon={<List className="text-white"/>} color="bg-blue-500" />
               <KPICard title="Status" value={isCritical ? "FALHA" : "SEGURO"} icon={isCritical ? <AlertTriangle className="text-white"/> : <CheckCircle2 className="text-white"/>} color={isCritical ? "bg-orange-500" : "bg-emerald-500"} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/60">
               <h3 className="text-lg font-bold mb-6 flex gap-2 items-center text-slate-800"><TrendingUp className="text-indigo-500" size={20}/> Tendência de Segurança</h3>
               <div className="h-[280px]"><ResponsiveContainer><AreaChart data={historyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="date" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false}/><RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/><Area type="monotone" dataKey="total" stroke="#94a3b8" fill="transparent" strokeWidth={2}/><Area type="monotone" dataKey="critical" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
            </div>
          </div>
        )}

        {activeTab === 'vulnerabilities' && !emptyState && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                 <div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400 w-5 h-5"/><input type="text" placeholder="Pesquisar..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                 <div className="flex gap-2">{['ALL', 'CRITICO', 'ALTO'].map(s => <button key={s} onClick={() => setFilterSeverity(s)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filterSeverity === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s}</button>)}</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                  {filteredIssues.map((issue, idx) => (
                      <div key={idx} className="p-6 hover:bg-slate-50/80 flex flex-col md:flex-row justify-between gap-4 transition-colors group">
                          <div className="flex gap-4">
                              <div className={`w-1 h-full rounded-full shrink-0 ${issue.severity === 'CRITICO' ? 'bg-red-500' : 'bg-blue-400'}`}></div>
                              <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{issue.name}</h4>
                                  <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2"><FileText size={12}/> {issue.file} <span className="text-slate-300">|</span> Linha {issue.line}</p>
                                  {issue.snippet && <code className="block mt-2 bg-slate-800 text-slate-300 p-2 rounded text-[10px] font-mono shadow-inner border border-slate-700/50 max-w-2xl overflow-x-auto">{issue.snippet}</code>}
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <span className={`px-2 py-1 h-fit rounded text-[10px] font-extrabold border uppercase tracking-wide w-fit ${issue.severity === 'CRITICO' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{issue.severity}</span>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleAiFix(issue)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded hover:bg-indigo-100 transition-colors border border-indigo-200"><Wand2 size={14}/> AI Fix</button>
                                <button onClick={() => handleIgnoreIssue(issue.name)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded hover:bg-slate-200 transition-colors" title="Ignorar"><EyeOff size={14}/> Ignorar</button>
                             </div>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
        )}

        {activeTab === 'audit' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-100">
                       <tr><th className="p-5">Data & Hora</th><th className="p-5">Autor</th><th className="p-5">Ação</th><th className="p-5">Detalhes</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="p-5 text-slate-400 font-mono text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()} | {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                             <td className="p-5 font-bold text-slate-700">{log.actor_email}</td>
                             <td className="p-5"><span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-[10px] text-slate-600 font-bold">{log.action}</span></td>
                             <td className="p-5 text-sm text-slate-600">{log.details}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'users' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800">Equipa</h2><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95 text-sm"><Plus size={16}/> Adicionar</button></div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <table className="w-full text-left"><thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider"><tr><th className="p-5">Nome</th><th className="p-5">Cargo</th><th className="p-5 text-right">Ações</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">{users.map(u => (<tr key={u.id} className="hover:bg-slate-50 transition-colors"><td className="p-5"><div><p className="font-bold text-slate-800 text-sm">{u.full_name}</p><p className="text-xs text-slate-500">{u.email}</p></div></td><td className="p-5"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600 border border-slate-200">{u.role}</span></td><td className="p-5 text-right"><button onClick={() => handleDeleteUser(u.id, u.email)} className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></td></tr>))}</tbody></table>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex justify-between mb-4"><h3 className="font-bold text-lg flex gap-2 items-center text-slate-800"><Key className="text-indigo-500" size={20}/> API Keys</h3><button onClick={handleGenerateKey} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">Gerar Nova</button></div>
                 <div className="space-y-2">{apiKeys.map(k => <div key={k.id} className="bg-slate-800 p-4 rounded-lg text-slate-200 font-mono text-xs flex justify-between items-center border border-slate-700 shadow-inner"><span>{k.key_value}</span><span className="text-slate-500 text-[10px]">{new Date(k.created_at).toLocaleDateString()}</span></div>)}</div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-lg mb-6 flex gap-2 items-center text-slate-800"><Bell className="text-indigo-500" size={20}/> Preferências</h3>
                 <div className="space-y-6">
                    <Toggle label="Email Alerts" desc="Receber notificação quando falhas CRÍTICAS são detetadas." active={notifications.email} onToggle={() => handleToggleNotification('email')} />
                    <Toggle label="Slack Integration" desc="Enviar relatório para o canal #security-ops." active={notifications.slack} onToggle={() => handleToggleNotification('slack')} />
                 </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
}

const MenuButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <div className={active ? '' : 'opacity-70'}>{icon}</div><span className="text-sm">{label}</span>
  </button>
);
const KPICard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1"><div className={`${color} p-3 rounded-xl shadow-lg shadow-indigo-100/50`}>{icon}</div><div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</p><p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p></div></div>
);
const Toggle = ({ label, desc, active, onToggle }) => (
  <div className="flex items-center justify-between"><div><p className="font-bold text-slate-800 text-sm">{label}</p><p className="text-xs text-slate-500 mt-0.5">{desc}</p></div><button onClick={onToggle} className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>
);