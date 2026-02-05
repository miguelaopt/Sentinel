"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';
import { 
  Shield, AlertTriangle, Loader2, CheckCircle2, 
  Download, TrendingUp, LayoutDashboard, List, Settings, User,
  Search, Bell, LogOut, Plus, Trash2, Key, X, FileText, Activity, 
  EyeOff, Wand2, Zap, Globe, ShieldCheck, Server, Building2, 
  Moon, Sun, Sliders, Lock, Play, BarChart3, Clock, Terminal
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const API_URL = 'https://sentinel-api-rr8s.onrender.com'; 

// --- TOAST ---
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-4 animate-in slide-in-from-bottom-5 z-[60] border backdrop-blur-md ${type === 'success' ? 'bg-emerald-600/95 border-emerald-500' : 'bg-red-600/95 border-red-500'}`}>
    <div className={`p-1 rounded-full ${type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
        {type === 'success' ? <CheckCircle2 size={20} className="text-white"/> : <AlertTriangle size={20} className="text-white"/>}
    </div>
    <div><p className="text-sm font-bold">{type === 'success' ? 'Sistema' : 'Alerta'}</p><p className="text-xs opacity-90">{message}</p></div>
  </div>
);

// --- MODAL AI ---
const AiFixModal = ({ isOpen, onClose, issue, isDark }) => {
    const [loading, setLoading] = useState(false);
    const [fixedCode, setFixedCode] = useState(null);
    useEffect(() => {
        if (isOpen && issue) {
            setLoading(true); setFixedCode(null);
            fetch(`${API_URL}/fix-code`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ snippet: issue.snippet, vulnerability: issue.name }) })
            .then(res => res.json()).then(data => setFixedCode(data.fixed_code || "Sem correção.")).catch(() => setFixedCode("Erro na IA.")).finally(() => setLoading(false));
        }
    }, [isOpen, issue]);
    if (!isOpen) return null;
    const themeClass = isDark ? "bg-[#1e1035] border-[#7c3aed]/30 text-white" : "bg-white border-slate-100 text-slate-800";
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className={`${themeClass} rounded-2xl w-full max-w-2xl border overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center"><h3 className="font-bold flex gap-2"><Wand2 className="text-indigo-600"/> AI Fix</h3><button onClick={onClose}><X size={20}/></button></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <pre className="bg-red-500/10 p-4 rounded-xl text-xs font-mono text-red-500 overflow-x-auto">{issue.snippet || "N/A"}</pre>
                    <div className="flex justify-center">{loading ? <Loader2 className="animate-spin text-indigo-600"/> : <Zap className="text-indigo-500"/>}</div>
                    <pre className="bg-emerald-500/10 p-4 rounded-xl text-xs font-mono text-emerald-500 overflow-x-auto">{fixedCode}</pre>
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
      } catch (err) { alert(err.message); } finally { setLoading(false); }
    };
    const bgClass = isDark ? "bg-[#1e1035] text-white border-[#7c3aed]/30" : "bg-white text-slate-800 border-slate-100";
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className={`${bgClass} border rounded-2xl w-full max-w-md p-6`}>
          <h3 className="text-lg font-bold mb-4">Novo Operador</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full p-3 border rounded-lg text-sm bg-transparent" placeholder="Nome" onChange={e => setFormData({...formData, fullName: e.target.value})} required/>
            <input className="w-full p-3 border rounded-lg text-sm bg-transparent" type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} required/>
            <input className="w-full p-3 border rounded-lg text-sm bg-transparent" type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required/>
            <select className="w-full p-3 border rounded-lg text-sm bg-transparent" onChange={e => setFormData({...formData, role: e.target.value})}><option className="text-black" value="Viewer">Viewer</option><option className="text-black" value="Admin">Admin</option></select>
            <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-3 border rounded-lg text-sm">Cancelar</button><button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg text-sm">Criar</button></div>
          </form>
        </div>
      </div>
    );
};

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef(null); // Referência para o input de ficheiro
  
  // --- STATES ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState(["> Sentinel Core v2.4 initialized...", "> Waiting for commands."]);
  
  // Menus
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedIssueForAi, setSelectedIssueForAi] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [apiStatus, setApiStatus] = useState('Checking...');

  // Dados
  const [latestScan, setLatestScan] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState({ email: false, slack: false });
  const [slackWebhook, setSlackWebhook] = useState('');
  const [policies, setPolicies] = useState({ dockerScan: true, activeValidation: true, blockCritical: false });
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [ignoredIssues, setIgnoredIssues] = useState([]);

  // PERMISSÃO INTELIGENTE
  const userRole = userProfile?.role ? userProfile.role.trim().toUpperCase() : '';
  const isAdmin = userRole === 'ADMIN';

  const theme = darkMode ? { bg: 'bg-[#05020a]', text: 'text-slate-100', card: 'bg-[#150a24]', border: 'border-[#361a5c]', muted: 'text-[#a78bfa]', hover: 'hover:bg-[#1e1035]', sidebar: 'bg-[#0f0518]', input: 'bg-[#0a0510]' } : { bg: 'bg-slate-50', text: 'text-slate-800', card: 'bg-white', border: 'border-slate-100', muted: 'text-slate-500', hover: 'hover:bg-slate-50', sidebar: 'bg-slate-900', input: 'bg-white' };
  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  // --- TERMINAL LOGIC ---
  const addLog = (msg) => {
      setTerminalLogs(prev => [...prev.slice(-6), `> ${msg}`]);
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

  // --- SCAN LOGIC ---
  const handleScanClick = () => {
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      addLog(`File selected: ${file.name}`);
      addLog("Initiating upload sequence...");
      showToast("Scan iniciado. Ver terminal.", "success");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('policies_json', JSON.stringify(policies));

      try {
          addLog("Uploading to Sentinel Core...");
          const res = await fetch(`${API_URL}/scan`, { method: 'POST', body: formData });
          
          if (!res.ok) throw new Error("Upload failed");
          
          addLog("Analyzing static artifacts...");
          const data = await res.json();
          
          addLog(`Scan Complete. Found ${data.total_issues} issues.`);
          if (data.total_issues > 0) addLog(`[CRITICAL] ${data.summary.critical} critical vulnerabilities.`);
          
          // Guardar na DB
          await supabase.from('scans').insert({ 
              org_id: orgData?.id, 
              report: data,
              status: 'Completed' 
          });

          // Atualizar Estado Local
          setLatestScan(data);
          setSeverityData([
                { name: 'Crítico', count: data.summary.critical, fill: '#EF4444' },
                { name: 'Alto', count: data.summary.high, fill: '#F59E0B' },
                { name: 'Médio', count: data.summary.medium, fill: '#3B82F6' }
          ]);
          logAction('SCAN_COMPLETED', `Analisou ${file.name}`);
          showToast("Scan concluído com sucesso!");

      } catch (error) {
          addLog(`[ERROR] Scan failed: ${error.message}`);
          showToast("Falha no Scan.", "error");
      }
  };

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push('/login'); return; }
        
        // RPC Function para ignorar RLS e ler role real
        const { data: profileData } = await supabase.rpc('get_my_profile');
        
        const safeProfile = profileData || { 
            id: user.id, email: user.email, full_name: 'Agente', role: 'Viewer', 
            settings: { email: false, slack: false }, slack_webhook: '', org_id: null 
        };
        setUserProfile(safeProfile);
        
        if (safeProfile.settings) setNotifications(safeProfile.settings);
        if (safeProfile.slack_webhook) setSlackWebhook(safeProfile.slack_webhook);

        if (safeProfile.org_id) {
            const { data: org } = await supabase.from('organizations').select('*').eq('id', safeProfile.org_id).single();
            if (org) { setOrgData(org); if (org.policies) setPolicies(org.policies); }
        }

        const { data: scans } = await supabase.from('scans').select('created_at, report').order('created_at', { ascending: true }).limit(30);
        if (scans && scans.length > 0) {
            const report = scans[scans.length - 1].report;
            setLatestScan(report);
            setHistoryData(scans.map(s => ({ date: format(new Date(s.created_at), 'dd/MM'), total: s.report.total_issues, critical: s.report.summary.critical })));
            setSeverityData([{ name: 'Critical', count: report.summary.critical, fill: '#EF4444' }, { name: 'High', count: report.summary.high, fill: '#F59E0B' }, { name: 'Medium', count: report.summary.medium, fill: '#3B82F6' }]);
        }
        await refreshData(safeProfile.id);
        fetch(API_URL).then(res => setApiStatus(res.ok ? 'Operational' : 'Error')).catch(() => setApiStatus('Waking up...'));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    init();
    function handleClickOutside(event) { if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAiFix = (issue) => { setSelectedIssueForAi(issue); setAiModalOpen(true); logAction('AI_FIX_REQ', `Gemini analisou ${issue.name}`); };
  const handleIgnoreIssue = (name) => { setIgnoredIssues([...ignoredIssues, name]); logAction('IGNORED', `Ignorou ${name}`); showToast('Vulnerabilidade silenciada.'); };
  
  const handleTogglePolicy = async (key) => {
      if (!isAdmin) { showToast('Apenas Admins.', 'error'); return; }
      if (!orgData?.id) { showToast('Erro: Sem Organização.', 'error'); return; }
      
      const newPolicies = { ...policies, [key]: !policies[key] };
      setPolicies(newPolicies); // Optimistic Update
      
      const { error } = await supabase.from('organizations').update({ policies: newPolicies }).eq('id', orgData.id);
      
      if (error) { 
          console.error("Erro Policy:", error);
          setPolicies(policies); // Revert
          showToast('Erro ao gravar (Verifica RLS).', 'error'); 
      } 
      else { 
          logAction('POLICY_UPDATE', `Admin alterou regra: ${key}`); 
          addLog(`Policy changed: ${key} = ${newPolicies[key]}`);
      }
  };

  const handleUpdateOrgName = async (newName) => {
      if (!isAdmin) return;
      const { error } = await supabase.from('organizations').update({ name: newName }).eq('id', orgData.id);
      if (!error) { setOrgData({...orgData, name: newName}); showToast('Nome atualizado.'); }
  };

  const handleToggleNotification = async (key) => {
      if (!userProfile?.id) return;
      const newSettings = { ...notifications, [key]: !notifications[key] };
      setNotifications(newSettings);
      await supabase.from('profiles').update({ settings: newSettings }).eq('id', userProfile.id);
      showToast('Gravado.');
  };

  const handleSaveWebhook = async () => {
    if (!isAdmin) { showToast('Apenas Admins.', 'error'); return; }
    await supabase.from('profiles').update({ slack_webhook: slackWebhook }).eq('id', userProfile.id);
    showToast('Webhook gravado!');
  };

  const handleGenerateKey = async () => { 
      if (!userProfile?.id) return; 
      const newKey = 'sk_live_' + Math.random().toString(36).substring(2);
      await supabase.from('api_keys').insert({ user_id: userProfile.id, key_value: newKey }); 
      showToast('Chave gerada!'); refreshData(userProfile.id);
  };
  
  const handleDeleteUser = async (id, email) => { 
      if (!isAdmin) { showToast('Apenas Admins.', 'error'); return; }
      if (confirm(`Remover?`)) { 
          const { error } = await supabase.from('profiles').delete().eq('id', id); 
          if(!error) { showToast('Removido.'); refreshData(userProfile.id); } 
      }
  };

  const generatePDF = () => {
    if (!latestScan) return;
    const doc = new jsPDF();
    doc.text(`Sentinel Report - ${orgData?.name || 'Enterprise'}`, 14, 20);
    autoTable(doc, { startY: 30, head: [['Issue', 'Severity']], body: latestScan.issues.map(i => [i.name, i.severity]) });
    doc.save(`sentinel-report.pdf`);
  };

  if (loading) return <div className={`flex h-screen items-center justify-center ${theme.bg}`}><Loader2 className="animate-spin w-12 h-12 text-indigo-600"/></div>;
  const emptyState = !latestScan;
  const isCritical = latestScan?.summary.critical > 0;
  const filteredIssues = latestScan?.issues.filter(i => !ignoredIssues.includes(i.name)).filter(i => (filterSeverity === 'ALL' || i.severity === filterSeverity) && (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.file.toLowerCase().includes(searchTerm.toLowerCase()))) || [];
  const securityScore = latestScan ? Math.max(0, 100 - (latestScan.summary.critical * 20) - (latestScan.summary.high * 10)) : 100;

  return (
    <div className={`min-h-screen ${theme.bg} flex font-sans ${theme.text} transition-colors duration-300`}>
      <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={(email) => {showToast('Agente registado!'); logAction('USER_ADD', `Adicionou ${email}`); refreshData(userProfile.id)}} isDark={darkMode} />
      <AiFixModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} issue={selectedIssueForAi} isDark={darkMode} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".zip,.rar,.7z" />

      <aside className={`w-64 ${theme.sidebar} text-white flex flex-col fixed h-full z-20 shadow-2xl hidden md:flex border-r border-white/10`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-indigo-600 p-2 rounded-xl"><Shield className="w-6 h-6 text-white" /></div>
          <div><span className="font-bold text-lg block">Sentinel</span><span className="text-[10px] text-indigo-300 uppercase">Enterprise</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <MenuButton icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MenuButton icon={<List size={18}/>} label="Vulnerabilidades" active={activeTab === 'vulnerabilities'} onClick={() => setActiveTab('vulnerabilities')} />
          <MenuButton icon={<ShieldCheck size={18}/>} label="Compliance" active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} />
          <MenuButton icon={<Activity size={18}/>} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          <MenuButton icon={<Building2 size={18}/>} label="Organização" active={activeTab === 'org'} onClick={() => setActiveTab('org')} />
          <MenuButton icon={<Settings size={18}/>} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-4 border-t border-white/10 bg-black/20 text-center">
            <p className="font-bold text-sm">{userProfile?.full_name}</p>
            <p className="text-[10px] text-slate-400 uppercase">{userRole}</p>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-slate-400 hover:text-white text-xs mt-2 flex justify-center w-full gap-2"><LogOut size={14}/> Sair</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
           <div><h1 className="text-3xl font-extrabold capitalize tracking-tight">{activeTab === 'org' ? 'Organização' : activeTab === 'dashboard' ? 'Overview' : activeTab}</h1><p className={`text-sm mt-1 ${theme.muted}`}>Plataforma de Segurança Corporativa</p></div>
           <div className="flex gap-4 items-center">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl border ${theme.card} ${theme.border}`}>{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
              
              <div className="relative" ref={notifRef}>
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-indigo-600 text-white' : `${theme.card} ${theme.border} border text-slate-500 hover:text-indigo-600`}`}>
                      <Bell size={20}/>
                      {isCritical && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>}
                  </button>
                  {isNotifOpen && (
                      <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in slide-in-from-top-2 ${theme.card} ${theme.border}`}>
                          <div className={`p-4 border-b flex justify-between items-center ${theme.border}`}><h4 className="font-bold text-sm">Notificações</h4><span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">Recentes</span></div>
                          <div className="max-h-64 overflow-y-auto">
                              {auditLogs.slice(0, 3).map(log => (<div key={log.id} className={`p-4 border-b border-white/5 ${theme.hover} transition-colors flex gap-3`}><div className="bg-indigo-500/20 p-2 rounded-full h-fit"><Activity size={16} className="text-indigo-500"/></div><div><p className="text-xs font-bold">{log.action}</p><p className={`text-[10px] ${theme.muted} mt-0.5`}>{log.details}</p><p className="text-[9px] opacity-50 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p></div></div>))}
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex gap-2">
                  <button onClick={handleScanClick} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md transition-all active:scale-95"><Play size={16}/> Novo Scan</button>
                  {activeTab === 'dashboard' && <button onClick={generatePDF} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border ${theme.card} ${theme.border} hover:bg-slate-100 dark:hover:bg-white/10`}><Download size={18}/></button>}
              </div>
           </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            {/* KPI ROW */}
            {latestScan && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <KPICard title="Vulnerabilidades" value={latestScan.total_issues} icon={<AlertTriangle className="text-white"/>} color="bg-indigo-500" theme={theme} />
                   <KPICard title="Risco Crítico" value={latestScan.summary.critical} icon={<Shield className="text-white"/>} color="bg-red-500" theme={theme} />
                   <KPICard title="Score" value={`${securityScore}%`} icon={<ShieldCheck className="text-white"/>} color={securityScore > 80 ? "bg-emerald-500" : "bg-orange-500"} theme={theme} />
                   <KPICard title="Ficheiros" value={latestScan.total_issues * 4} icon={<List className="text-white"/>} color="bg-blue-500" theme={theme} />
                </div>
            )}
            
            {/* TERMINAL WIDGET (NOVO) */}
            <div className={`rounded-xl overflow-hidden border font-mono text-xs ${darkMode ? 'border-white/10 bg-black' : 'border-slate-800 bg-slate-900'} shadow-2xl`}>
                <div className="bg-white/5 p-2 px-4 border-b border-white/5 flex items-center gap-2">
                    <Terminal size={14} className="text-emerald-500"/> <span className="text-slate-400">Sentinel Core Terminal</span>
                </div>
                <div className="p-4 h-40 overflow-y-auto space-y-1 text-emerald-400/90">
                    {terminalLogs.map((log, i) => (
                        <div key={i} className="animate-in fade-in slide-in-from-left-2">{log}</div>
                    ))}
                    <div className="animate-pulse">_</div>
                </div>
            </div>

            {latestScan && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className={`lg:col-span-2 p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                       <h3 className="text-lg font-bold mb-6 flex gap-2 items-center"><TrendingUp className="text-indigo-500" size={20}/> Tendência</h3>
                       <div className="h-[280px]"><ResponsiveContainer><AreaChart data={historyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#f1f5f9'}/><XAxis dataKey="date" /><YAxis /><Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: darkMode ? '#1e1035' : '#fff', color: darkMode ? '#fff' : '#000'}}/><Area type="monotone" dataKey="total" stroke="#6366f1" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-sm border flex flex-col ${theme.card} ${theme.border}`}>
                        <h3 className="text-lg font-bold mb-6 flex gap-2 items-center"><BarChart3 className="text-indigo-500" size={20}/> Distribuição</h3>
                        <div className="h-[200px] flex-1">
                            <ResponsiveContainer><BarChart data={severityData}><XAxis dataKey="name" /><Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: darkMode ? '#1e1035' : '#fff', color: darkMode ? '#fff' : '#000'}}/><Bar dataKey="count"><Cell fill="#EF4444"/><Cell fill="#F59E0B"/><Cell fill="#3B82F6"/></Bar></BarChart></ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* ... OUTRAS TABS (Mantêm-se iguais) ... */}
        {activeTab === 'compliance' && <div className="space-y-6 animate-in fade-in"><div className={`p-8 rounded-2xl shadow-sm border ${theme.card} ${theme.border} flex justify-between`}><div><h2 className="text-2xl font-bold">Relatório de Conformidade</h2></div><div className="text-4xl font-black text-emerald-500">98%</div></div><div className="grid grid-cols-3 gap-6"><ComplianceCard title="GDPR" status="Compliant" desc="Dados pessoais protegidos." passed={true} theme={theme} /><ComplianceCard title="SOC 2" status="Compliant" desc="Auditoria ativa." passed={true} theme={theme} /></div></div>}
        
        {activeTab === 'vulnerabilities' && <div className="space-y-6 animate-in fade-in"><div className={`p-4 rounded-xl shadow-sm border flex gap-4 ${theme.card} ${theme.border}`}><input placeholder="Pesquisar..." className={`flex-1 p-2 bg-transparent outline-none ${theme.text}`} onChange={e => setSearchTerm(e.target.value)}/></div><div className={`rounded-2xl border overflow-hidden ${theme.card} ${theme.border}`}>{filteredIssues.map((issue, idx) => (<div key={idx} className={`p-6 flex justify-between border-b ${theme.border} ${theme.hover}`}><div><h4 className="font-bold">{issue.name}</h4><p className={`text-xs ${theme.muted}`}>{issue.file}</p></div><button onClick={() => handleAiFix(issue)} className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded text-xs font-bold">Fix AI</button></div>))}</div></div>}

        {activeTab === 'org' && <div className="space-y-6 animate-in fade-in"><div className={`p-8 rounded-2xl border ${theme.card} ${theme.border}`}><h2 className="text-xl font-bold mb-4">Organização: {orgData?.name}</h2><p className={theme.muted}>Membros: {users.length}</p></div></div>}
        
        {activeTab === 'users' && <div className="space-y-6 animate-in fade-in"><div className={`rounded-2xl border overflow-hidden ${theme.card} ${theme.border}`}><table className="w-full text-left"><thead className={`border-b ${theme.border}`}><tr><th className="p-5">Nome</th><th className="p-5">Email</th><th className="p-5">Cargo</th><th className="p-5 text-right">Ações</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className={`border-b ${theme.border} ${theme.hover}`}><td className="p-5 font-bold">{u.full_name}</td><td className={`p-5 ${theme.muted}`}>{u.email}</td><td className="p-5"><span className="border px-2 py-1 rounded text-xs font-bold">{u.role}</span></td><td className="p-5 text-right">{isAdmin && u.id !== userProfile.id && <button onClick={() => handleDeleteUser(u.id)} className="text-red-500"><Trash2 size={16}/></button>}</td></tr>))}</tbody></table></div></div>}

        {activeTab === 'settings' && <div className="max-w-4xl space-y-8 animate-in fade-in"><div className={`p-8 rounded-2xl border ${theme.card} ${theme.border}`}><h3 className="font-bold text-lg mb-6">Policy Manager</h3><div className="space-y-4"><Toggle label="Docker Scan" active={policies.dockerScan} onToggle={() => handleTogglePolicy('dockerScan')} theme={theme} disabled={!isAdmin}/><Toggle label="Active Validation" active={policies.activeValidation} onToggle={() => handleTogglePolicy('activeValidation')} theme={theme} disabled={!isAdmin}/></div></div><div className={`p-8 rounded-2xl border ${theme.card} ${theme.border}`}><h3 className="font-bold text-lg mb-4">Integrações</h3><div className="flex gap-4"><input type="password" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} disabled={!isAdmin} className={`flex-1 p-3 border rounded-lg bg-transparent ${theme.border}`}/><button onClick={handleSaveWebhook} className="bg-slate-900 text-white px-6 rounded-lg font-bold text-sm">Salvar</button></div></div></div>}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTES ---
const MenuButton = ({ icon, label, active, onClick }) => (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}><div className={active ? '' : 'opacity-70'}>{icon}</div><span className="text-sm">{label}</span></button>);
const KPICard = ({ title, value, icon, color, theme }) => (<div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${theme.card} ${theme.border}`}><div className={`${color} p-3 rounded-xl shadow-lg shadow-indigo-100/50`}>{icon}</div><div><p className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>{title}</p><p className="text-2xl font-extrabold mt-0.5">{value}</p></div></div>);
const ComplianceCard = ({ title, status, desc, passed, theme }) => (<div className={`p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}><div className="flex justify-between items-start mb-4"><h4 className="font-bold">{title}</h4>{passed ? <CheckCircle2 size={16} className="text-emerald-500"/> : <AlertTriangle size={16} className="text-red-500"/>}</div><p className={`text-xs h-8 ${theme.muted}`}>{desc}</p><div className={`mt-4 text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>Status: {status}</div></div>);
const SystemStatusItem = ({ label, status, theme }) => (<div className={`flex justify-between items-center p-3 rounded-xl ${theme.hover} border ${theme.border}`}><div className="flex items-center gap-3"><Globe size={16} className="text-indigo-500"/><span className="text-sm font-medium">{label}</span></div><span className={`text-xs ${theme.muted}`}>{status}</span></div>);
const Toggle = ({ label, active, onToggle, theme, disabled }) => (<div className={`flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}><div><p className="font-bold text-sm">{label}</p></div><button onClick={onToggle} className={`w-11 h-6 rounded-full p-1 transition-colors ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>);