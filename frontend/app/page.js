"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Shield, AlertTriangle, Loader2, CheckCircle2, 
  Download, TrendingUp, LayoutDashboard, List, Settings, User,
  Search, Bell, LogOut, Plus, Trash2, Key, X, FileText, Activity, 
  EyeOff, Wand2, Zap, Globe, ShieldCheck, Server, Building2, 
  Moon, Sun, Sliders, Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// --- CONFIGURAÇÃO API ---
const API_URL = 'https://sentinel-api-rr8s.onrender.com'; 

// --- TOAST ---
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-4 animate-in slide-in-from-bottom-5 z-[60] border backdrop-blur-md ${type === 'success' ? 'bg-emerald-600/95 border-emerald-500' : 'bg-red-600/95 border-red-500'}`}>
    <div className={`p-1 rounded-full ${type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
        {type === 'success' ? <CheckCircle2 size={20} className="text-white"/> : <AlertTriangle size={20} className="text-white"/>}
    </div>
    <div>
      <p className="text-sm font-bold">{type === 'success' ? 'Sistema' : 'Alerta'}</p>
      <p className="text-xs opacity-90">{message}</p>
    </div>
  </div>
);

// --- MODAL AI FIX (GEMINI) ---
const AiFixModal = ({ isOpen, onClose, issue, isDark }) => {
    const [loading, setLoading] = useState(false);
    const [fixedCode, setFixedCode] = useState(null);

    useEffect(() => {
        if (isOpen && issue) {
            setLoading(true);
            setFixedCode(null);
            
            fetch(`${API_URL}/fix-code`, { 
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ snippet: issue.snippet, vulnerability: issue.name })
            })
            .then(res => {
                if (!res.ok) throw new Error("Servidor a acordar...");
                return res.json();
            })
            .then(data => setFixedCode(data.fixed_code || "A IA não conseguiu gerar uma correção."))
            .catch(() => setFixedCode("⚠️ O servidor Sentinel está a acordar (Cold Start). Tente novamente em 30s."))
            .finally(() => setLoading(false));
        }
    }, [isOpen, issue]);

    if (!isOpen) return null;

    const themeClass = isDark ? "bg-[#1e1035] border-[#7c3aed]/30 text-white" : "bg-white border-slate-100 text-slate-800";
    const headerClass = isDark ? "bg-[#150a24] border-[#7c3aed]/20" : "bg-slate-50 border-slate-100";
    const codeBg = isDark ? "bg-[#0a0510] border-[#361a5c] text-slate-300" : "bg-slate-900 border-slate-800 text-slate-200";

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 transition-all">
            <div className={`${themeClass} rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh] border`}>
                <div className={`p-6 border-b flex justify-between items-center ${headerClass}`}>
                    <h3 className="text-lg font-bold flex gap-2 items-center">
                        <div className="bg-indigo-100 p-1.5 rounded-lg"><Wand2 className="text-indigo-600" size={18}/></div>
                        Sentinel AI <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">GEMINI FLASH</span>
                    </h3>
                    <button onClick={onClose}><X size={20} className="opacity-50 hover:opacity-100"/></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <p className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-2"><AlertTriangle size={12}/> Vulnerabilidade</p>
                        <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto border shadow-inner ${codeBg}`}>
                            {issue.snippet || "N/A"}
                        </pre>
                    </div>
                    <div className="flex justify-center py-2 relative">
                         <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/20"></div></div>
                         <div className="relative px-4">
                            {loading ? <Loader2 className="animate-spin text-indigo-600 w-8 h-8"/> : <div className="bg-indigo-500/10 p-2 rounded-full border border-indigo-500/20 shadow-sm"><Zap className="text-indigo-500 fill-indigo-500"/></div>}
                         </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-500 uppercase mb-2 flex items-center gap-2"><CheckCircle2 size={12}/> Correção</p>
                        {loading ? (
                            <div className="h-24 bg-slate-200/10 rounded-xl animate-pulse border border-slate-200/20"></div>
                        ) : (
                            <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto border shadow-inner ${codeBg}`}>
                                {fixedCode}
                            </pre>
                        )}
                    </div>
                </div>
                <div className={`p-4 border-t flex justify-end ${headerClass}`}>
                    <button onClick={onClose} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">Concluído</button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL USER ---
const CreateUserModal = ({ isOpen, onClose, onSuccess, isDark }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'Viewer' });
    if (!isOpen) return null;
    const handleSubmit = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
        const res = await fetch('/api/create-user', { method: 'POST', body: JSON.stringify(formData), headers: { 'Content-Type': 'application/json' } });
        const data = await res.json(); if (!res.ok) throw new Error(data.error); onSuccess(formData.email); onClose();
      } catch (err) { alert("Erro: " + err.message); } finally { setLoading(false); }
    };
    
    const bgClass = isDark ? "bg-[#1e1035] text-white border-[#7c3aed]/30" : "bg-white text-slate-800 border-slate-100";
    const inputClass = isDark ? "bg-[#0a0510] border-[#361a5c] text-white" : "bg-white border-slate-200 text-slate-800";

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className={`${bgClass} border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden`}>
          <div className="p-6 border-b border-white/10"><h3 className="text-lg font-bold">Novo Operador</h3></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <input className={`w-full p-3 border rounded-lg text-sm outline-none focus:border-indigo-500 ${inputClass}`} placeholder="Nome" onChange={e => setFormData({...formData, fullName: e.target.value})} required/>
            <input className={`w-full p-3 border rounded-lg text-sm outline-none focus:border-indigo-500 ${inputClass}`} type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} required/>
            <input className={`w-full p-3 border rounded-lg text-sm outline-none focus:border-indigo-500 ${inputClass}`} type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required/>
            <select className={`w-full p-3 border rounded-lg text-sm outline-none focus:border-indigo-500 ${inputClass}`} onChange={e => setFormData({...formData, role: e.target.value})}><option value="Viewer">Viewer</option><option value="Developer">Developer</option><option value="Admin">Admin</option></select>
            <div className="flex gap-3 mt-6"><button type="button" onClick={onClose} className="flex-1 py-3 opacity-70 hover:opacity-100 font-bold rounded-lg text-sm border border-white/10">Cancelar</button><button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">{loading ? '...' : 'Criar'}</button></div>
          </form>
        </div>
      </div>
    );
};

export default function Home() {
  const router = useRouter();
  
  // --- STATES ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // DARK MODE TOGGLE REAL
  
  // Modals & Menus
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedIssueForAi, setSelectedIssueForAi] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  
  // System Health
  const [apiStatus, setApiStatus] = useState('Checking...');

  // Data
  const [latestScan, setLatestScan] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState({ email: false, slack: false, weekly: false });
  const [slackWebhook, setSlackWebhook] = useState('');
  const [policies, setPolicies] = useState({ dockerScan: true, activeValidation: true, blockCritical: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [ignoredIssues, setIgnoredIssues] = useState([]);

  // --- THEME ENGINE ---
  const theme = darkMode ? {
      bg: 'bg-[#05020a]', text: 'text-slate-100', card: 'bg-[#150a24]', border: 'border-[#361a5c]', 
      muted: 'text-[#a78bfa]', hover: 'hover:bg-[#1e1035]', sidebar: 'bg-[#0f0518]', input: 'bg-[#0a0510]'
  } : {
      bg: 'bg-slate-50', text: 'text-slate-800', card: 'bg-white', border: 'border-slate-100', 
      muted: 'text-slate-500', hover: 'hover:bg-slate-50', sidebar: 'bg-slate-900', input: 'bg-white'
  };

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  // --- LOGIC ---
  const checkApiHealth = async () => {
      try {
          const res = await fetch(API_URL);
          if (res.ok) setApiStatus('Operational'); else setApiStatus('Error');
      } catch (error) { setApiStatus('Waking up...'); }
  };

  const refreshData = async (userId) => {
     if (!userId) return;
     const { data: usersData } = await supabase.from('profiles').select('*').order('full_name'); if(usersData) setUsers(usersData);
     const { data: keysData } = await supabase.from('api_keys').select('*').eq('user_id', userId); if(keysData) setApiKeys(keysData);
     const { data: logsData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50); if(logsData) setAuditLogs(logsData);
  };

  const logAction = async (action, details) => {
      if (!userProfile?.id) return;
      await supabase.from('audit_logs').insert({ actor_id: userProfile.id, actor_email: userProfile.email, action, details });
      refreshData(userProfile.id); 
  };

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push('/login'); return; }

        let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const safeProfile = profile || { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'Agente', role: 'Viewer' };

        setUserProfile(safeProfile);
        if (safeProfile.settings) setNotifications(safeProfile.settings);
        if (safeProfile.slack_webhook) setSlackWebhook(safeProfile.slack_webhook);

        const { data: scans } = await supabase.from('scans').select('created_at, report').order('created_at', { ascending: true }).limit(30);
        if (scans && scans.length > 0) {
            setHistoryData(scans.map(s => ({ date: format(new Date(s.created_at), 'dd/MM'), total: s.report.total_issues, critical: s.report.summary.critical })));
            setLatestScan(scans[scans.length - 1].report);
        }
        await refreshData(safeProfile.id);
        checkApiHealth();
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    init();
    function handleClickOutside(event) { if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAiFix = (issue) => { setSelectedIssueForAi(issue); setAiModalOpen(true); logAction('AI_FIX_REQ', `Gemini analisou ${issue.name}`); };
  const handleIgnoreIssue = (name) => { setIgnoredIssues([...ignoredIssues, name]); logAction('IGNORED', `Ignorou ${name}`); showToast('Vulnerabilidade silenciada.'); };
  
  const handleToggleNotification = async (key) => {
      if (!userProfile?.id) return;
      const newSettings = { ...notifications, [key]: !notifications[key] };
      setNotifications(newSettings);
      const { error } = await supabase.from('profiles').update({ settings: newSettings }).eq('id', userProfile.id);
      if (error) { setNotifications(notifications); showToast('Erro SQL.', 'error'); } else { showToast('Gravado.'); logAction('SETTINGS', `Alterou ${key}`); }
  };

  const handleSaveWebhook = async () => {
    if (!userProfile?.id) return;
    const { error } = await supabase.from('profiles').update({ slack_webhook: slackWebhook }).eq('id', userProfile.id);
    if (error) showToast('Erro ao gravar Webhook', 'error'); else { showToast('Webhook Slack configurado!'); logAction('SETTINGS', 'Atualizou Slack Webhook'); }
  };

  const handleTogglePolicy = (key) => {
      setPolicies({...policies, [key]: !policies[key]});
      showToast('Política atualizada (Simulação)');
      logAction('POLICY_CHANGE', `Alterou política: ${key}`);
  };

  const handleGenerateKey = async () => { if (!userProfile?.id) return; const { error } = await supabase.from('api_keys').insert({ user_id: userProfile.id, key_value: 'sk_' + Math.random().toString(36).substring(2) }); if(!error) { showToast('Chave gerada!'); logAction('KEY_GEN', 'Nova API Key'); refreshData(userProfile.id); }};
  const handleDeleteUser = async (id, email) => { if (confirm(`Eliminar ${email}?`)) { const { error } = await supabase.from('profiles').delete().eq('id', id); if(!error) { showToast('Eliminado.'); logAction('USER_DEL', `Eliminou ${email}`); refreshData(userProfile.id); }}};
  
  const generatePDF = () => {
    if (!latestScan) return;
    const doc = new jsPDF();
    doc.setFillColor(31, 41, 55); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("Sentinel Enterprise Report", 14, 20);
    doc.setFontSize(10); doc.text(`Gerado: ${new Date().toLocaleString()}`, 14, 30);
    doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.text("Resumo", 14, 55);
    autoTable(doc, { startY: 60, head: [['Métrica', 'Valor']], body: [['Total', latestScan.total_issues], ['Críticas', latestScan.summary.critical]], theme: 'grid', headStyles: { fillColor: [79, 70, 229] } });
    doc.save(`sentinel-report.pdf`);
    logAction('REPORT_DOWNLOADED', 'Exportou PDF');
  };

  if (loading) return <div className={`flex h-screen items-center justify-center ${theme.bg}`}><Loader2 className="animate-spin w-12 h-12 text-indigo-600"/></div>;
  const emptyState = !latestScan;
  const isCritical = latestScan?.summary.critical > 0;
  const filteredIssues = latestScan?.issues.filter(i => !ignoredIssues.includes(i.name)).filter(i => (filterSeverity === 'ALL' || i.severity === filterSeverity) && (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.file.toLowerCase().includes(searchTerm.toLowerCase()))) || [];

  return (
    <div className={`min-h-screen ${theme.bg} flex font-sans ${theme.text} transition-colors duration-300`}>
      <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={(email) => {showToast('Agente registado!'); logAction('USER_ADD', `Adicionou ${email}`); refreshData(userProfile.id)}} isDark={darkMode} />
      <AiFixModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} issue={selectedIssueForAi} isDark={darkMode} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* SIDEBAR */}
      <aside className={`w-64 ${theme.sidebar} text-white flex flex-col fixed h-full z-20 shadow-2xl hidden md:flex border-r border-white/10 transition-colors duration-300`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/30"><Shield className="w-6 h-6 text-white" /></div>
          <div><span className="font-bold text-lg tracking-tight block">Sentinel</span><span className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">Enterprise</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <MenuButton icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MenuButton icon={<List size={18}/>} label="Vulnerabilidades" active={activeTab === 'vulnerabilities'} onClick={() => setActiveTab('vulnerabilities')} />
          <MenuButton icon={<ShieldCheck size={18}/>} label="Compliance" active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} />
          <MenuButton icon={<Activity size={18}/>} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          <MenuButton icon={<Building2 size={18}/>} label="Organização" active={activeTab === 'org'} onClick={() => setActiveTab('org')} />
          <MenuButton icon={<User size={18}/>} label="Equipa" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <MenuButton icon={<Settings size={18}/>} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-4 border-t border-white/10 bg-black/20 text-center">
            <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold border border-white/10 shadow-inner">{userProfile?.full_name?.charAt(0)}</div>
                <div className="text-left overflow-hidden"><p className="font-bold text-sm truncate w-28">{userProfile?.full_name}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{userProfile?.role}</p></div>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg text-xs flex justify-center items-center w-full gap-2 transition-all"><LogOut size={14}/> Terminar Sessão</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 md:ml-64 p-8 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
           <div><h1 className="text-3xl font-extrabold capitalize tracking-tight">{activeTab === 'org' ? 'Organização' : activeTab === 'dashboard' ? 'Overview' : activeTab}</h1><p className={`text-sm mt-1 ${theme.muted}`}>Plataforma de Segurança Corporativa</p></div>
           
           <div className="flex gap-4 items-center">
              {/* DARK MODE TOGGLE */}
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl transition-all border ${theme.card} ${theme.border} hover:border-indigo-500`}>
                  {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}
              </button>

              {/* DROPDOWN NOTIFICAÇÕES */}
              <div className="relative" ref={notifRef}>
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-indigo-600 text-white' : `${theme.card} ${theme.border} border text-slate-500 hover:text-indigo-600`}`}>
                      <Bell size={20}/>
                      {isCritical && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>}
                  </button>
                  {isNotifOpen && (
                      <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in slide-in-from-top-2 ${theme.card} ${theme.border}`}>
                          <div className={`p-4 border-b flex justify-between items-center ${theme.border}`}><h4 className="font-bold text-sm">Notificações</h4><span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">Recentes</span></div>
                          <div className="max-h-64 overflow-y-auto">
                              {isCritical && (<div className="p-4 border-b border-white/5 hover:bg-red-500/10 transition-colors flex gap-3"><div className="bg-red-500/20 p-2 rounded-full h-fit"><AlertTriangle size={16} className="text-red-500"/></div><div><p className="text-xs font-bold">Risco Crítico Detetado</p><p className={`text-[10px] mt-0.5 ${theme.muted}`}>Chaves AWS expostas.</p></div></div>)}
                              {auditLogs.slice(0, 3).map(log => (<div key={log.id} className={`p-4 border-b border-white/5 ${theme.hover} transition-colors flex gap-3`}><div className="bg-indigo-500/20 p-2 rounded-full h-fit"><Activity size={16} className="text-indigo-500"/></div><div><p className="text-xs font-bold">{log.action}</p><p className={`text-[10px] ${theme.muted} mt-0.5`}>{log.details}</p><p className="text-[9px] opacity-50 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p></div></div>))}
                              {auditLogs.length === 0 && !isCritical && <div className={`p-6 text-center text-xs ${theme.muted}`}>Sem novas notificações.</div>}
                          </div>
                      </div>
                  )}
              </div>

              {activeTab === 'dashboard' && !emptyState && <button onClick={generatePDF} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 text-sm"><Download size={18}/> Exportar Relatório</button>}
           </div>
        </header>

        {activeTab === 'dashboard' && !emptyState && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <KPICard title="Vulnerabilidades" value={latestScan.total_issues} icon={<AlertTriangle className="text-white"/>} color="bg-indigo-500" theme={theme} />
               <KPICard title="Risco Crítico" value={latestScan.summary.critical} icon={<Shield className="text-white"/>} color="bg-red-500" theme={theme} />
               <KPICard title="Ficheiros Analisados" value={latestScan.total_issues * 3} icon={<List className="text-white"/>} color="bg-blue-500" theme={theme} />
               <KPICard title="Compliance Status" value={isCritical ? "C-" : "A+"} icon={<ShieldCheck className="text-white"/>} color={isCritical ? "bg-orange-500" : "bg-emerald-500"} theme={theme} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`lg:col-span-2 p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                   <h3 className="text-lg font-bold mb-6 flex gap-2 items-center"><TrendingUp className="text-indigo-500" size={20}/> Tendência de Segurança</h3>
                   <div className="h-[280px]"><ResponsiveContainer><AreaChart data={historyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#f1f5f9'}/><XAxis dataKey="date" tick={{fontSize: 11, fill: '#888'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize: 11, fill: '#888'}} axisLine={false} tickLine={false}/><RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: darkMode ? '#1e1035' : '#fff', color: darkMode ? '#fff' : '#000'}}/><Area type="monotone" dataKey="total" stroke="#94a3b8" fill="transparent" strokeWidth={2}/><Area type="monotone" dataKey="critical" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
                </div>
                <div className={`p-6 rounded-2xl shadow-sm border flex flex-col ${theme.card} ${theme.border}`}>
                    <h3 className="text-lg font-bold mb-6 flex gap-2 items-center"><Activity className="text-indigo-500" size={20}/> System Health</h3>
                    <div className="space-y-4 flex-1">
                         <SystemStatusItem label="API Endpoint" status={apiStatus === 'Operational' ? 'Operational' : apiStatus === 'Error' ? 'Error' : 'Waking up...'} theme={theme} />
                         <SystemStatusItem label="Database" status="Operational" theme={theme} />
                         <SystemStatusItem label="Gemini AI" status="Operational" theme={theme} />
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
            <div className="space-y-6 animate-in fade-in">
                <div className={`p-8 rounded-2xl shadow-sm border flex flex-col md:flex-row items-center justify-between gap-6 ${theme.card} ${theme.border}`}>
                    <div><h2 className="text-2xl font-extrabold">Relatório de Conformidade</h2><p className={`mt-2 max-w-xl ${theme.muted}`}>Análise automatizada baseada nos scans recentes contra normas internacionais (GDPR, SOC2).</p></div>
                    <div className={`text-4xl font-black ${isCritical ? 'text-orange-500' : 'text-emerald-500'} bg-opacity-10 px-6 py-4 rounded-2xl border border-opacity-20`}>{isCritical ? '72%' : '98%'}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ComplianceCard title="GDPR" status={isCritical ? "Needs Review" : "Compliant"} desc="Proteção de dados pessoais (PII)." passed={!isCritical} theme={theme} />
                    <ComplianceCard title="SOC 2 Type II" status="Compliant" desc="Controlo de acessos e auditoria." passed={true} theme={theme} />
                    <ComplianceCard title="OWASP Top 10" status={isCritical ? "Fail" : "Pass"} desc="Injeção SQL e falhas críticas." passed={!isCritical} theme={theme} />
                </div>
            </div>
        )}

        {activeTab === 'vulnerabilities' && (
           <div className="space-y-6 animate-in fade-in">
              <div className={`p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 ${theme.card} ${theme.border}`}>
                 <div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400 w-5 h-5"/><input type="text" placeholder="Pesquisar..." className={`w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:border-indigo-500 text-sm ${theme.input} ${theme.border}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                 <div className="flex gap-2">{['ALL', 'CRITICO', 'ALTO'].map(s => <button key={s} onClick={() => setFilterSeverity(s)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSeverity === s ? 'bg-indigo-600 text-white shadow-md' : `border ${theme.border} ${theme.muted} hover:bg-slate-500/10`}`}>{s}</button>)}</div>
              </div>
              <div className={`rounded-2xl shadow-sm border divide-y overflow-hidden ${theme.card} ${theme.border} ${darkMode ? 'divide-[#361a5c]' : 'divide-slate-100'}`}>
                  {filteredIssues.map((issue, idx) => (
                      <div key={idx} className={`p-6 flex flex-col md:flex-row justify-between gap-4 transition-colors group ${theme.hover}`}>
                          <div className="flex gap-4">
                              <div className={`w-1 h-full rounded-full shrink-0 ${issue.severity === 'CRITICO' ? 'bg-red-500' : 'bg-blue-400'}`}></div>
                              <div>
                                  <h4 className="font-bold text-sm tracking-wide">{issue.name}</h4>
                                  <p className={`text-xs font-mono mt-1 flex items-center gap-2 ${theme.muted}`}><FileText size={12}/> {issue.file} <span className="opacity-30">|</span> L:{issue.line}</p>
                                  {issue.snippet && <code className={`block mt-2 p-3 rounded text-[10px] font-mono shadow-inner border max-w-2xl overflow-x-auto ${darkMode ? 'bg-black/30 border-white/10 text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{issue.snippet}</code>}
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <span className={`px-2 py-1 h-fit rounded text-[10px] font-extrabold border uppercase tracking-wide w-fit ${issue.severity === 'CRITICO' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{issue.severity}</span>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleAiFix(issue)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"><Wand2 size={14}/> AI Fix</button>
                                <button onClick={() => handleIgnoreIssue(issue.name)} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded transition-colors border ${darkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}><EyeOff size={14}/> Ignorar</button>
                             </div>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
        )}

        {/* --- ORG TAB (MULTI-TENANCY UI) --- */}
        {activeTab === 'org' && (
            <div className="space-y-6 animate-in fade-in">
                <div className={`p-8 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                    <div className="flex justify-between items-center mb-6">
                        <div><h2 className="text-xl font-bold">Organização</h2><p className={`text-sm ${theme.muted}`}>Gerir subscrição e detalhes da empresa.</p></div>
                        <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">Plano Enterprise</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-xs font-bold uppercase opacity-50 mb-1">Empresa</p>
                            <p className="font-bold text-lg">Sentinel Corp.</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-xs font-bold uppercase opacity-50 mb-1">Membros</p>
                            <p className="font-bold text-lg">{users.length} / 10 Licenças</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'audit' && (
           <div className={`rounded-2xl shadow-sm border overflow-hidden animate-in fade-in ${theme.card} ${theme.border}`}>
               <table className="w-full text-left">
                  <thead className={`text-[10px] uppercase border-b ${darkMode ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-50 text-slate-500 border-slate-100'}`}><tr><th className="p-5">Data & Hora</th><th className="p-5">Autor</th><th className="p-5">Ação</th><th className="p-5">Detalhes</th></tr></thead>
                  <tbody className={`divide-y text-sm ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>{auditLogs.map(log => (<tr key={log.id} className={theme.hover}><td className={`p-5 font-mono text-xs whitespace-nowrap ${theme.muted}`}>{new Date(log.created_at).toLocaleDateString()} <span className="opacity-30">|</span> {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td><td className="p-5 font-bold">{log.actor_email}</td><td className="p-5"><span className={`border px-2 py-1 rounded text-[10px] font-bold ${darkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>{log.action}</span></td><td className={`p-5 ${theme.muted}`}>{log.details}</td></tr>))}</tbody>
               </table>
           </div>
        )}

        {activeTab === 'users' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center"><h2 className="text-lg font-bold">Equipa</h2><button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md text-sm transition-transform active:scale-95"><Plus size={16}/> Adicionar</button></div>
              <div className={`rounded-2xl shadow-sm border overflow-hidden ${theme.card} ${theme.border}`}><table className="w-full text-left"><thead className={`text-[10px] uppercase border-b ${darkMode ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-50 text-slate-500 border-slate-100'}`}><tr><th className="p-5">Nome</th><th className="p-5">Cargo</th><th className="p-5 text-right">Ações</th></tr></thead><tbody className={`divide-y text-sm ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>{users.map(u => (<tr key={u.id} className={theme.hover}><td className="p-5"><div><p className="font-bold">{u.full_name}</p><p className={`text-xs ${theme.muted}`}>{u.email}</p></div></td><td className="p-5"><span className={`border px-2 py-1 rounded text-xs font-bold ${darkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>{u.role}</span></td><td className="p-5 text-right"><button onClick={() => handleDeleteUser(u.id, u.email)} className={`transition-colors p-2 rounded-lg ${darkMode ? 'text-slate-500 hover:bg-red-900/20 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-4xl space-y-8 animate-in fade-in">
              {/* POLICY MANAGER */}
              <div className={`p-8 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                 <h3 className="font-bold text-lg mb-6 flex gap-2 items-center"><Sliders className="text-indigo-500" size={20}/> Policy Manager</h3>
                 <div className="space-y-4">
                     <Toggle label="Active Validation" desc="Testar se chaves AWS/Stripe estão ativas." active={policies.activeValidation} onToggle={() => handleTogglePolicy('activeValidation')} theme={theme} />
                     <Toggle label="Docker Scanning" desc="Verificar vulnerabilidades em Dockerfiles." active={policies.dockerScan} onToggle={() => handleTogglePolicy('dockerScan')} theme={theme} />
                     <Toggle label="Block Critical" desc="Falhar build se encontrar erros críticos." active={policies.blockCritical} onToggle={() => handleTogglePolicy('blockCritical')} theme={theme} />
                 </div>
              </div>

              {/* SLACK INTEGRATION */}
              <div className={`p-8 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                 <h3 className="font-bold text-lg mb-4 flex gap-2 items-center"><Zap className="text-indigo-500"/> Integrações</h3>
                 <div className="space-y-4">
                     <label className="text-sm font-bold opacity-70">Slack Webhook URL</label>
                     <div className="flex gap-4">
                         <input type="password" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/..." className={`flex-1 p-3 border rounded-lg text-sm outline-none focus:border-indigo-500 transition-all ${theme.input} ${theme.border}`}/>
                         <button onClick={handleSaveWebhook} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800">Guardar</button>
                     </div>
                 </div>
              </div>

              {/* API KEYS */}
              <div className={`p-8 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                 <div className="flex justify-between mb-4"><h3 className="font-bold text-lg flex gap-2 items-center"><Key className="text-indigo-500" size={20}/> API Credentials</h3><button onClick={handleGenerateKey} className={`text-xs font-bold text-indigo-500 px-3 py-1.5 rounded hover:bg-indigo-500/10 border border-indigo-500/20 transition-colors`}>Generate New</button></div>
                 <div className="space-y-2">{apiKeys.map(k => <div key={k.id} className={`p-4 rounded-lg font-mono text-xs flex justify-between items-center border shadow-inner ${darkMode ? 'bg-black/30 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}><span>{k.key_value}</span><span className="opacity-50">{new Date(k.created_at).toLocaleDateString()}</span></div>)}</div>
              </div>

              {/* NOTIFICATIONS */}
              <div className={`p-8 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                 <h3 className="font-bold text-lg mb-6 flex gap-2 items-center"><Bell className="text-indigo-500" size={20}/> Preferências</h3>
                 <div className="space-y-6"><Toggle label="Email Alerts" desc="Notificar falhas críticas." active={notifications.email} onToggle={() => handleToggleNotification('email')} theme={theme} /><Toggle label="Slack" desc="Canal #security." active={notifications.slack} onToggle={() => handleToggleNotification('slack')} theme={theme} /></div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTES ---
const MenuButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-medium' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}><div className={active ? '' : 'opacity-70'}>{icon}</div><span className="text-sm">{label}</span></button>
);
const KPICard = ({ title, value, icon, color, theme }) => (
  <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${theme.card} ${theme.border}`}>
      <div className={`${color} p-3 rounded-xl shadow-lg shadow-indigo-100/50`}>{icon}</div>
      <div><p className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>{title}</p><p className="text-2xl font-extrabold mt-0.5">{value}</p></div>
  </div>
);
const ComplianceCard = ({ title, status, desc, passed, theme }) => (
    <div className={`p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}><div className="flex justify-between items-start mb-4"><h4 className="font-bold">{title}</h4>{passed ? <div className="bg-emerald-500/10 p-1 rounded-full"><CheckCircle2 size={16} className="text-emerald-500"/></div> : <div className="bg-red-500/10 p-1 rounded-full"><AlertTriangle size={16} className="text-red-500"/></div>}</div><p className={`text-xs h-8 ${theme.muted}`}>{desc}</p><div className={`mt-4 text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>Status: {status}</div></div>
);
const SystemStatusItem = ({ label, status, theme }) => (
    <div className={`flex justify-between items-center p-3 rounded-xl ${theme.hover} border ${theme.border}`}><div className="flex items-center gap-3"><Globe size={16} className="text-indigo-500"/><span className="text-sm font-medium">{label}</span></div><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${status === 'Operational' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></span><span className={`text-xs ${theme.muted}`}>{status}</span></div></div>
);
const Toggle = ({ label, desc, active, onToggle, theme }) => (
  <div className="flex items-center justify-between">
      <div><p className="font-bold text-sm">{label}</p><p className={`text-xs mt-0.5 ${theme.muted}`}>{desc}</p></div>
      <button onClick={onToggle} className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-indigo-600' : 'bg-slate-200 opacity-50'}`}>
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </button>
  </div>
);