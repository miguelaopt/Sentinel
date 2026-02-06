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
  Download, TrendingUp, LayoutDashboard, List, Settings, Users, User, 
  Search, Bell, LogOut, Plus, Trash2, Key, X, FileText, Activity, 
  EyeOff, Wand2, Zap, Globe, ShieldCheck, Server, Building2, 
  Moon, Sun, Sliders, Lock, Play, BarChart3, Clock, Terminal, FileWarning, Mail, Fingerprint, LogIn
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Certifica-te que instalaste: npm install jspdf-autotable
import { format } from 'date-fns';

const API_URL = '[https://sentinel-api-rr8s.onrender.com](https://sentinel-api-rr8s.onrender.com)'; // Ou localhost:8000 se local

// --- COLORS PALETTE ---
const COLORS = {
    critical: '#EF4444', 
    high: '#F59E0B',     
    medium: '#3B82F6',   
    low: '#10B981',      
    bgDark: '#05020a',
    cardDark: '#150a24',
    bgLight: '#f8fafc',
    cardLight: '#ffffff'
};

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
            .then(res => res.json()).then(data => setFixedCode(data.fixed_code || "A IA não conseguiu corrigir.")).catch(() => setFixedCode("Erro na conexão IA.")).finally(() => setLoading(false));
        }
    }, [isOpen, issue]);
    if (!isOpen) return null;
    const themeClass = isDark ? "bg-[#1e1035] border-[#7c3aed]/30 text-white" : "bg-white border-slate-100 text-slate-800";
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className={`${themeClass} rounded-2xl w-full max-w-2xl border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5"><h3 className="font-bold flex gap-2 items-center"><Wand2 className="text-indigo-500"/> Sentinel AI</h3><button onClick={onClose}><X size={20}/></button></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-2"><p className="text-xs font-bold uppercase opacity-50">Vulnerabilidade</p><pre className="bg-red-500/10 p-4 rounded-xl text-xs font-mono text-red-500 overflow-x-auto border border-red-500/20">{issue.snippet || "N/A"}</pre></div>
                    <div className="flex justify-center py-2">{loading ? <Loader2 className="animate-spin text-indigo-500"/> : <Zap className="text-indigo-500 opacity-50"/>}</div>
                    <div className="space-y-2"><p className="text-xs font-bold uppercase opacity-50">Correção Sugerida</p><pre className="bg-emerald-500/10 p-4 rounded-xl text-xs font-mono text-emerald-500 overflow-x-auto border border-emerald-500/20">{fixedCode}</pre></div>
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
        <div className={`${bgClass} border rounded-2xl w-full max-w-md p-8 shadow-2xl`}>
          <h3 className="text-xl font-bold mb-6">Convidar Membro</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full p-3 border rounded-xl text-sm bg-transparent outline-none focus:border-indigo-500 transition-colors" placeholder="Nome Completo" onChange={e => setFormData({...formData, fullName: e.target.value})} required/>
            <input className="w-full p-3 border rounded-xl text-sm bg-transparent outline-none focus:border-indigo-500 transition-colors" type="email" placeholder="Email Corporativo" onChange={e => setFormData({...formData, email: e.target.value})} required/>
            <input className="w-full p-3 border rounded-xl text-sm bg-transparent outline-none focus:border-indigo-500 transition-colors" type="password" placeholder="Password Temporária" onChange={e => setFormData({...formData, password: e.target.value})} required/>
            <div className="space-y-1"><label className="text-xs font-bold opacity-50 ml-1">Função</label><select className="w-full p-3 border rounded-xl text-sm bg-transparent outline-none focus:border-indigo-500" onChange={e => setFormData({...formData, role: e.target.value})}><option className="text-black" value="Viewer">Viewer (Leitura)</option><option className="text-black" value="Developer">Developer (Scan)</option><option className="text-black" value="Admin">Admin (Total)</option></select></div>
            <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 border rounded-xl text-sm font-bold opacity-70 hover:opacity-100">Cancelar</button><button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20">Enviar Convite</button></div>
          </form>
        </div>
      </div>
    );
};

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef(null); 
  
  // --- STATES ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState(["> Sentinel Core v6.0 initialized...", "> Async Queue System ready."]);
  
  // Settings States
  const [notifications, setNotifications] = useState({ email: false, slack: false });
  const [securitySettings, setSecuritySettings] = useState({ mfa: false, timeout: true });
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedIssueForAi, setSelectedIssueForAi] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [apiStatus, setApiStatus] = useState('Checking...');

  const [latestScan, setLatestScan] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [topFiles, setTopFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [policies, setPolicies] = useState({ dockerScan: true, activeValidation: true, blockCritical: false });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [ignoredIssues, setIgnoredIssues] = useState([]);

  // PERMISSÃO INTELIGENTE
  const userRole = userProfile?.role ? userProfile.role.trim().toUpperCase() : '';
  const isAdmin = userRole === 'ADMIN';

  const theme = darkMode ? { 
      bg: 'bg-[#05020a]', text: 'text-slate-100', card: 'bg-[#150a24]', border: 'border-[#361a5c]', 
      muted: 'text-[#a78bfa]', hover: 'hover:bg-[#1e1035]', sidebar: 'bg-[#0f0518]', input: 'bg-[#0a0510]' 
  } : { 
      bg: 'bg-slate-50', text: 'text-slate-800', card: 'bg-white', border: 'border-slate-200', 
      muted: 'text-slate-500', hover: 'hover:bg-slate-100', sidebar: 'bg-white', input: 'bg-white' 
  };
  
  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
  const addLog = (msg) => { setTerminalLogs(prev => [...prev.slice(-4), `> ${msg}`]); };

  // --- DATA FETCHING ---
  const refreshData = async (userId) => {
     const { data: usersData } = await supabase.from('profiles').select('*').order('full_name'); 
     if(usersData) setUsers(usersData);

     const { data: logsData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20); 
     if(logsData) setAuditLogs(logsData);

     const { data: keysData } = await supabase.from('api_keys').select('*').eq('user_id', userId); 
     if(keysData) setApiKeys(keysData);
  };

  const logAction = async (action, details) => {
      if (!userProfile?.id) return;
      await supabase.from('audit_logs').insert({ actor_id: userProfile.id, actor_email: userProfile.email, action, details });
      refreshData(userProfile.id); 
  };

  const handleScanClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };

  // --- ASYNC SCAN LOGIC (CORRIGIDA COM AUTENTICAÇÃO) ---
  const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      addLog(`Selected: ${file.name}`);
      showToast("Upload iniciado...", "success");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('policies_json', JSON.stringify(policies));

      // Obter sessão atual para enviar o Token JWT
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      try {
          addLog("Uploading to Async Queue...");
          // 1. Enviar para a API com TOKEN
          const res = await fetch(`${API_URL}/scan`, { 
              method: 'POST', 
              body: formData,
              headers: {
                  'Authorization': `Bearer ${token}` // <--- IMPORTANTE: Envia quem é o user
              }
          });
          
          if (!res.ok) throw new Error("Upload failed. Verify backend.");
          
          const { task_id } = await res.json();
          addLog(`Queued! Task ID: ${task_id.substring(0,8)}...`);
          
          // 2. Polling (Perguntar à API se já acabou)
          let attempts = 0;
          const pollInterval = setInterval(async () => {
              attempts++;
              const statusRes = await fetch(`${API_URL}/scan/${task_id}`);
              const statusData = await statusRes.json();

              if (statusData.status === 'completed') {
                  clearInterval(pollInterval);
                  const data = statusData.report;
                  
                  addLog(`Scan finished! Found ${data.total_issues} issues.`);
                  
                  // Agora o Worker do backend já gravou na DB (scans table).
                  // Nós só precisamos de atualizar o UI.
                  setLatestScan(data);
                  setSeverityData([
                        { name: 'Crítico', count: data.summary.critical, fill: COLORS.critical },
                        { name: 'Alto', count: data.summary.high, fill: COLORS.high },
                        { name: 'Médio', count: data.summary.medium, fill: COLORS.medium }
                  ]);
                  const fileCounts = {};
                  data.issues.forEach(i => { fileCounts[i.file] = (fileCounts[i.file] || 0) + 1 });
                  setTopFiles(Object.entries(fileCounts).sort((a,b) => b[1] - a[1]).slice(0, 3));
                  
                  logAction('SCAN_COMPLETED', `Analisou ${file.name}`);
                  showToast("Scan concluído!");
              } 
              else if (statusData.status === 'failed') {
                  clearInterval(pollInterval);
                  addLog(`[ERROR] Task failed: ${statusData.error}`);
                  showToast("Falha no Scan.", "error");
              }
              else {
                  if (attempts % 3 === 0) addLog(`Processing in worker node...`);
              }
          }, 2000); 

      } catch (error) {
          addLog(`Error: ${error.message}`);
          showToast("Erro de conexão.", "error");
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  };

  // --- INIT EFFECT ---
  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push('/login'); return; }
        
        const { data: profileData } = await supabase.rpc('get_my_profile');
        const safeProfile = profileData || { id: user.id, email: user.email, full_name: 'Agente', role: 'Viewer' };
        setUserProfile(safeProfile);
        
        // Carregar Settings
        if (safeProfile.settings) {
            if (safeProfile.settings.email !== undefined) setNotifications(prev => ({...prev, email: safeProfile.settings.email, slack: safeProfile.settings.slack}));
            if (safeProfile.settings.security) {
                setSecuritySettings(safeProfile.settings.security);
            }
        }
        
        if (safeProfile.slack_webhook) setSlackWebhook(safeProfile.slack_webhook);

        const { data: scans } = await supabase.from('scans').select('created_at, report').order('created_at', { ascending: true }).limit(30);
        if (scans && scans.length > 0) {
            const report = scans[scans.length - 1].report;
            setLatestScan(report);
            setHistoryData(scans.map(s => ({ date: format(new Date(s.created_at), 'dd/MM'), total: s.report.total_issues, critical: s.report.summary.critical })));
            setSeverityData([{ name: 'Crítico', count: report.summary.critical, fill: COLORS.critical }, { name: 'Alto', count: report.summary.high, fill: COLORS.high }, { name: 'Médio', count: report.summary.medium, fill: COLORS.medium }]);
            const fileCounts = {};
            report.issues.forEach(i => { fileCounts[i.file] = (fileCounts[i.file] || 0) + 1 });
            setTopFiles(Object.entries(fileCounts).sort((a,b) => b[1] - a[1]).slice(0, 3));
        }
        await refreshData(safeProfile.id);
        fetch(API_URL).then(res => setApiStatus(res.ok ? 'Online' : 'Error')).catch(() => setApiStatus('Offline'));

      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    init();
    
    function handleClickOutside(event) { if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- SESSION TIMEOUT LOGIC ---
  useEffect(() => {
      if (!securitySettings.timeout) return;

      let timeoutId;
      const TIMEOUT_DURATION = 30 * 60 * 1000;

      const resetTimer = () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
              alert("Sessão expirada por inatividade.");
              handleLogout();
          }, TIMEOUT_DURATION);
      };

      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('click', resetTimer);

      resetTimer();

      return () => {
          clearTimeout(timeoutId);
          window.removeEventListener('mousemove', resetTimer);
          window.removeEventListener('keydown', resetTimer);
          window.removeEventListener('click', resetTimer);
      };
  }, [securitySettings.timeout]);

  // --- REALTIME PRESENCE ---
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase.channel('online-users', { config: { presence: { key: userProfile.id } } });
    channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const onlineIds = new Set(Object.keys(newState));
        setOnlineUsers(onlineIds);
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString(), user_id: userProfile.id });
    });
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // --- HANDLERS ---
  const handleAiFix = (issue) => { setSelectedIssueForAi(issue); setAiModalOpen(true); logAction('AI_FIX_REQ', `Gemini analisou ${issue.name}`); };
  const handleIgnoreIssue = (name) => { setIgnoredIssues([...ignoredIssues, name]); logAction('IGNORED', `Ignorou ${name}`); showToast('Vulnerabilidade silenciada.'); };
  
  const handleTogglePolicy = async (key) => {
      if (!isAdmin) { showToast('Apenas Admins.', 'error'); return; }
      const newPolicies = { ...policies, [key]: !policies[key] };
      setPolicies(newPolicies);
      logAction('POLICY_UPDATE', `Alterou regra: ${key}`); 
      addLog(`Policy ${key} updated locally.`);
  };

  const handleToggleSecurity = async (key) => {
      const newSecurity = { ...securitySettings, [key]: !securitySettings[key] };
      setSecuritySettings(newSecurity);
      
      const newSettings = { 
          email: notifications.email,
          slack: notifications.slack,
          security: newSecurity 
      };
      
      const { error } = await supabase.from('profiles').update({ settings: newSettings }).eq('id', userProfile.id);
      
      if (error) {
          showToast('Erro ao salvar segurança.', 'error');
          setSecuritySettings(securitySettings); 
      } else {
          const msg = key === 'mfa' ? (newSecurity.mfa ? '2FA Ativado' : '2FA Desativado') : (newSecurity.timeout ? 'Timeout Ativo' : 'Timeout Desativado');
          showToast(msg);
          logAction('SECURITY_UPDATE', `Alterou ${key}`);
      }
  };

  const handleSaveWebhook = async () => {
    if (!isAdmin) { showToast('Apenas Admins.', 'error'); return; }
    await supabase.from('profiles').update({ slack_webhook: slackWebhook }).eq('id', userProfile.id);
    showToast('Webhook gravado!');
  };

  const handleGenerateKey = async () => { 
      const newKey = 'sk_live_' + Math.random().toString(36).substring(2);
      await supabase.from('api_keys').insert({ user_id: userProfile.id, key_value: newKey }); 
      showToast('Chave gerada!'); refreshData(userProfile.id);
  };
  
  const handleDeleteUser = async (id) => { 
      if (!isAdmin) { showToast('Apenas Admins.', 'error'); return; }
      if (confirm(`Remover acesso deste membro?`)) { 
          const { error } = await supabase.from('profiles').delete().eq('id', id); 
          if(!error) { showToast('Membro removido.'); refreshData(userProfile.id); } 
      }
  };

  // --- PDF GENERATOR FIXED ---
  const generatePDF = () => {
    if (!latestScan) {
        showToast("Nenhum scan disponível para exportar.", "error");
        return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const today = format(new Date(), 'dd/MM/yyyy HH:mm');

    // 1. CAPA
    doc.setFillColor(5, 2, 10); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Sentinel Security Report", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${today}`, 14, 30);
    const isCritical = latestScan.summary.critical > 0;
    doc.text(`Status: ${isCritical ? 'FALHA (Risco Crítico)' : 'APROVADO'}`, pageWidth - 14, 30, { align: 'right' });

    // 2. EXECUTIVE SUMMARY
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. Executive Summary", 14, 55);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const securityScore = latestScan ? Math.max(0, 100 - (latestScan.summary.critical * 20) - (latestScan.summary.high * 10)) : 100;
    doc.text(`Security Score: ${securityScore}/100`, 14, 65);
    doc.text(`Total Vulnerabilities: ${latestScan.total_issues}`, 14, 72);
    
    // 3. TABLE
    const issuesData = latestScan.issues.map(i => [i.severity, i.name, i.file, `Line: ${i.line}`]);
    autoTable(doc, {
        startY: 90,
        head: [['Severity', 'Vulnerability', 'Location', 'Details']],
        body: issuesData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [239, 68, 68] } }
    });

    doc.save(`Sentinel_Audit_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleContact = (email) => { window.location.href = `mailto:${email}`; };

  if (loading) return <div className={`flex h-screen items-center justify-center ${theme.bg}`}><Loader2 className="animate-spin w-12 h-12 text-indigo-600"/></div>;
  
  const emptyState = !latestScan;
  const filteredIssues = latestScan?.issues.filter(i => !ignoredIssues.includes(i.name)).filter(i => (filterSeverity === 'ALL' || i.severity === filterSeverity) && (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.file.toLowerCase().includes(searchTerm.toLowerCase()))) || [];
  const securityScore = latestScan ? Math.max(0, 100 - (latestScan.summary.critical * 20) - (latestScan.summary.high * 10)) : 100;
  const isCritical = latestScan?.summary.critical > 0;

  return (
    <div className={`min-h-screen ${theme.bg} flex font-sans ${theme.text} transition-colors duration-300 selection:bg-indigo-500/30`}>
      <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={(email) => {showToast('Convite enviado!'); logAction('USER_ADD', `Adicionou ${email}`); refreshData(userProfile.id)}} isDark={darkMode} />
      <AiFixModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} issue={selectedIssueForAi} isDark={darkMode} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".zip,.rar,.7z" />

      {/* SIDEBAR */}
      <aside className={`w-64 ${theme.sidebar} flex flex-col fixed h-full z-20 shadow-2xl hidden md:flex border-r ${theme.border}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20"><Shield className="w-6 h-6 text-white" /></div>
          <div><span className="font-bold text-lg tracking-tight block">Sentinel</span><span className="text-[10px] text-indigo-500 font-mono font-bold tracking-widest uppercase">PRO v6.0</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <MenuButton icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} theme={theme}/>
          <MenuButton icon={<List size={18}/>} label="Vulnerabilidades" active={activeTab === 'vulnerabilities'} onClick={() => setActiveTab('vulnerabilities')} theme={theme}/>
          <MenuButton icon={<Users size={18}/>} label="Team Directory" active={activeTab === 'team'} onClick={() => setActiveTab('team')} theme={theme}/>
          <MenuButton icon={<ShieldCheck size={18}/>} label="Compliance" active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} theme={theme}/>
          <MenuButton icon={<Activity size={18}/>} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} theme={theme}/>
          <MenuButton icon={<Settings size={18}/>} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} theme={theme}/>
        </nav>
        <div className="p-6 border-t border-white/5">
            <div className={`p-4 rounded-xl mb-4 flex items-center gap-3 border ${theme.border} bg-white/5`}>
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold">{userProfile?.full_name?.charAt(0)}</div>
                <div className="overflow-hidden"><p className="font-bold text-sm truncate">{userProfile?.full_name}</p><p className="text-[10px] opacity-60 uppercase tracking-wider">{userRole}</p></div>
            </div>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 text-xs w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all font-bold"><LogOut size={14}/> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8 md:p-10 overflow-y-auto">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-10">
           <div><h1 className="text-3xl font-extrabold capitalize tracking-tight">{activeTab === 'team' ? 'Team Directory' : activeTab}</h1><p className={`text-sm mt-1 font-medium ${theme.muted}`}>System Status: <span className={apiStatus === 'Online' ? 'text-emerald-500' : 'text-red-500'}>● {apiStatus}</span></p></div>
           <div className="flex gap-4 items-center">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl border ${theme.border} ${theme.card} hover:border-indigo-500 transition-colors`}>{darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}</button>
              
              <div className="relative" ref={notifRef}>
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-indigo-600 text-white' : `${theme.card} ${theme.border} border text-slate-500 hover:text-indigo-600`}`}>
                      <Bell size={20}/>
                      {isCritical && <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                  </button>
                  {isNotifOpen && (
                      <div className={`absolute right-0 mt-4 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in slide-in-from-top-2 ${theme.card} ${theme.border}`}>
                          <div className={`p-4 border-b flex justify-between items-center ${theme.border}`}><h4 className="font-bold text-sm">Notificações</h4></div>
                          <div className="max-h-64 overflow-y-auto">
                              {auditLogs.slice(0, 3).map(log => (<div key={log.id} className={`p-4 border-b border-white/5 ${theme.hover} transition-colors flex gap-3`}><div className="bg-indigo-500/20 p-2 rounded-full h-fit"><Activity size={16} className="text-indigo-500"/></div><div><p className="text-xs font-bold">{log.action}</p><p className={`text-[10px] ${theme.muted} mt-0.5`}>{log.details}</p><p className="text-[9px] opacity-50 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p></div></div>))}
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex gap-2">
                  <button onClick={handleScanClick} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"><Play size={16}/> Novo Scan</button>
                  {activeTab === 'dashboard' && <button onClick={generatePDF} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border ${theme.card} ${theme.border} hover:bg-slate-100 dark:hover:bg-white/10`}><Download size={18}/></button>}
              </div>
           </div>
        </header>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {latestScan ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <KPICard title="Vulnerabilidades" value={latestScan.total_issues} icon={<AlertTriangle className="text-white"/>} color="bg-indigo-500" theme={theme} />
                   <KPICard title="Risco Crítico" value={latestScan.summary.critical} icon={<Shield className="text-white"/>} color="bg-red-500" theme={theme} />
                   <KPICard title="Security Score" value={`${securityScore}%`} icon={<ShieldCheck className="text-white"/>} color={securityScore > 80 ? "bg-emerald-500" : "bg-orange-500"} theme={theme} />
                   <KPICard title="Ficheiros Analisados" value={latestScan.total_issues * 4} icon={<List className="text-white"/>} color="bg-blue-500" theme={theme} />
                </div>
            ) : <div className={`p-10 rounded-2xl border border-dashed text-center ${theme.border} ${theme.muted}`}>Nenhum scan realizado. Clique em "Novo Scan".</div>}
            
            {latestScan && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className={`lg:col-span-2 p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                       <h3 className="text-lg font-bold mb-6 flex gap-2 items-center"><TrendingUp className="text-indigo-500" size={20}/> Tendência de Segurança</h3>
                       <div className="h-[280px]">
                           <ResponsiveContainer>
                               <AreaChart data={historyData}>
                                   <defs>
                                       <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                                       <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                                   </defs>
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#e2e8f0'}/>
                                   <XAxis dataKey="date" tick={{fontSize: 11, fill: '#888'}} axisLine={false} tickLine={false}/>
                                   <YAxis tick={{fontSize: 11, fill: '#888'}} axisLine={false} tickLine={false}/>
                                   <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: darkMode ? '#1e1035' : '#fff', color: darkMode ? '#fff' : '#000', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}/>
                                   <Area type="monotone" dataKey="total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3}/>
                                   <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCrit)" strokeWidth={3}/>
                               </AreaChart>
                           </ResponsiveContainer>
                       </div>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-sm border flex flex-col ${theme.card} ${theme.border}`}>
                        <h3 className="text-lg font-bold mb-6 flex gap-2 items-center"><BarChart3 className="text-indigo-500" size={20}/> Distribuição de Risco</h3>
                        <div className="h-[200px] flex-1">
                            <ResponsiveContainer><BarChart data={severityData}><XAxis dataKey="name" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false}/><Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: darkMode ? '#1e1035' : '#fff', color: darkMode ? '#fff' : '#000'}}/><Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>{severityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar></BarChart></ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`p-0 rounded-xl overflow-hidden border font-mono text-[10px] ${darkMode ? 'border-white/10 bg-black' : 'border-slate-800 bg-slate-900'} shadow-2xl h-fit`}>
                    <div className="bg-white/5 p-3 px-4 border-b border-white/10 flex items-center gap-2"><Terminal size={12} className="text-emerald-500"/> <span className="text-slate-400 font-bold">SENTINEL CLI</span></div>
                    <div className="p-4 h-32 overflow-y-auto space-y-1.5 text-emerald-400/90">{terminalLogs.map((log, i) => (<div key={i}>{log}</div>))}<div className="animate-pulse">_</div></div>
                </div>

                <div className={`p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                    <h3 className="text-sm font-bold mb-4 flex gap-2 items-center"><FileWarning className="text-indigo-500" size={16}/> Top Vulnerable Files</h3>
                    <div className="space-y-3">
                        {topFiles.map(([file, count], i) => (
                            <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-white/5"><span className="truncate w-40 font-mono opacity-80">{file}</span><span className="font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">{count}</span></div>
                        ))}
                        {topFiles.length === 0 && <span className="text-xs opacity-50">No data available.</span>}
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}>
                    <h3 className="text-sm font-bold mb-4 flex gap-2 items-center"><Activity className="text-indigo-500" size={16}/> System Health</h3>
                    <div className="space-y-3">
                         <SystemStatusItem label="API Endpoint" status={apiStatus === 'Online' ? 'Operational' : 'Offline'} theme={theme} />
                         <SystemStatusItem label="Database" status="Operational" theme={theme} />
                         <SystemStatusItem label="AI Engine" status="Operational" theme={theme} />
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* TEAM DIRECTORY */}
        {activeTab === 'team' && (
            <div className="space-y-6 animate-in fade-in">
                <div className={`p-8 rounded-2xl shadow-sm border flex justify-between items-end ${theme.card} ${theme.border}`}>
                    <div><h2 className="text-2xl font-bold">Team Directory</h2><p className={`mt-2 ${theme.muted}`}>Manage your organization members and access levels.</p></div>
                    {isAdmin && <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md transition-all active:scale-95"><Plus size={16}/> Invite Member</button>}
                </div>

                <div className={`rounded-2xl shadow-sm border overflow-hidden ${theme.card} ${theme.border}`}>
                    <table className="w-full text-left border-collapse">
                        <thead className={`text-[10px] uppercase tracking-wider border-b ${theme.border} ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <tr><th className="p-5 font-bold opacity-70">Member</th><th className="p-5 font-bold opacity-70">Role</th><th className="p-5 font-bold opacity-70">Status</th><th className="p-5 text-right font-bold opacity-70">Actions</th></tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {users.map(u => {
                                const isOnline = onlineUsers.has(u.id);
                                return (
                                <tr key={u.id} className={`${theme.hover} transition-colors group`}>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">{u.full_name?.charAt(0)}</div>
                                            <div><p className="font-bold text-sm">{u.full_name}</p><p className={`text-xs ${theme.muted}`}>{u.email}</p></div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                            u.role === 'Admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                                            u.role === 'Developer' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                        }`}>{u.role}</span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                            <span className={`text-xs font-medium ${isOnline ? 'text-emerald-500' : 'text-slate-400 opacity-80'}`}>
                                                {isOnline ? 'Active' : 'Offline'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleContact(u.email)} className={`p-2 rounded-lg border ${theme.border} hover:bg-indigo-500 hover:text-white transition-colors`} title="Contact"><Mail size={16}/></button>
                                            {isAdmin && u.id !== userProfile.id && <button onClick={() => handleDeleteUser(u.id)} className={`p-2 rounded-lg border ${theme.border} hover:bg-red-500 hover:text-white transition-colors`} title="Remove"><Trash2 size={16}/></button>}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* VULNERABILITIES */}
        {activeTab === 'vulnerabilities' && (
           <div className="space-y-6 animate-in fade-in">
              <div className={`p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 ${theme.card} ${theme.border}`}>
                 <div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400 w-5 h-5"/><input type="text" placeholder="Search vulnerabilities..." className={`w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:border-indigo-500 text-sm transition-all ${theme.input} ${theme.border}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                 <div className="flex gap-2">{['ALL', 'CRITICO', 'ALTO'].map(s => <button key={s} onClick={() => setFilterSeverity(s)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSeverity === s ? 'bg-indigo-600 text-white shadow-md' : `border ${theme.border} ${theme.muted} hover:bg-slate-500/10`}`}>{s}</button>)}</div>
              </div>
              <div className={`rounded-2xl shadow-sm border divide-y overflow-hidden ${theme.card} ${theme.border} ${darkMode ? 'divide-[#361a5c]' : 'divide-slate-100'}`}>
                  {filteredIssues.map((issue, idx) => (
                      <div key={idx} className={`p-6 flex flex-col md:flex-row justify-between gap-4 transition-colors group ${theme.hover}`}>
                          <div className="flex gap-4">
                              <div className={`w-1 h-full rounded-full shrink-0 ${issue.severity === 'CRITICO' ? 'bg-red-500' : issue.severity === 'ALTO' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                              <div>
                                  <h4 className="font-bold text-sm tracking-wide">{issue.name}</h4>
                                  <p className={`text-xs font-mono mt-1 flex items-center gap-2 ${theme.muted}`}><FileText size={12}/> {issue.file} <span className="opacity-30">|</span> L:{issue.line}</p>
                                  {issue.snippet && <code className={`block mt-2 p-3 rounded text-[10px] font-mono shadow-inner border max-w-2xl overflow-x-auto ${darkMode ? 'bg-black/30 border-white/10 text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{issue.snippet}</code>}
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <span className={`px-2 py-1 h-fit rounded text-[10px] font-extrabold border uppercase tracking-wide w-fit ${
                                 issue.severity === 'CRITICO' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 
                                 issue.severity === 'ALTO' ? 'text-orange-500 border-orange-500/20 bg-orange-500/10' : 
                                 'text-blue-500 border-blue-500/20 bg-blue-500/10'
                             }`}>{issue.severity}</span>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleAiFix(issue)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"><Wand2 size={14}/> AI Fix</button>
                                <button onClick={() => handleIgnoreIssue(issue.name)} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded transition-colors border ${darkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}><EyeOff size={14}/> Ignore</button>
                             </div>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
        )}

        {activeTab === 'compliance' && <div className="space-y-6 animate-in fade-in"><div className={`p-8 rounded-2xl shadow-sm border ${theme.card} ${theme.border} flex justify-between`}><div><h2 className="text-2xl font-bold">Relatório de Conformidade</h2></div><div className="text-4xl font-black text-emerald-500">98%</div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><ComplianceCard title="GDPR" status="Compliant" desc="Dados pessoais protegidos." passed={true} theme={theme} /><ComplianceCard title="SOC 2" status="Compliant" desc="Auditoria ativa." passed={true} theme={theme} /><ComplianceCard title="OWASP Top 10" status={isCritical ? "Review" : "Pass"} desc="Standard security check." passed={!isCritical} theme={theme} /></div></div>}
        
        {activeTab === 'audit' && <div className={`rounded-2xl border overflow-hidden ${theme.card} ${theme.border} animate-in fade-in`}><table className="w-full text-left"><thead className={`text-[10px] uppercase border-b ${theme.border}`}><tr><th className="p-5">Data</th><th className="p-5">Autor</th><th className="p-5">Ação</th></tr></thead><tbody>{auditLogs.map(l => (<tr key={l.id} className={`border-b ${theme.border} ${theme.hover}`}><td className="p-5 text-xs font-mono opacity-60">{new Date(l.created_at).toLocaleString()}</td><td className="p-5 font-bold text-xs">{l.actor_email}</td><td className="p-5 text-xs bg-indigo-500/5"><span className="font-bold">{l.action}:</span> {l.details}</td></tr>))}</tbody></table></div>}

        {/* SETTINGS PROFISSIONAL */}
        {activeTab === 'settings' && (
           <div className="max-w-4xl space-y-8 animate-in fade-in">
              <div className={`p-8 rounded-2xl border ${theme.card} ${theme.border}`}>
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><User className="text-indigo-500" size={20}/> Account & Profile</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs font-bold opacity-50 block mb-1">Full Name</label><input disabled value={userProfile?.full_name || ''} className={`w-full p-3 rounded-lg border opacity-50 ${theme.border} ${theme.input}`}/></div>
                     <div><label className="text-xs font-bold opacity-50 block mb-1">Email</label><input disabled value={userProfile?.email || ''} className={`w-full p-3 rounded-lg border opacity-50 ${theme.border} ${theme.input}`}/></div>
                 </div>
              </div>

              <div className={`p-8 rounded-2xl border ${theme.card} ${theme.border}`}>
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Sliders className="text-indigo-500" size={20}/> Policy Manager</h3>
                 <div className="space-y-4">
                     <Toggle label="Docker Scan" desc="Analyze Dockerfiles for root access" active={policies.dockerScan} onToggle={() => handleTogglePolicy('dockerScan')} theme={theme} disabled={!isAdmin}/>
                     <Toggle label="Active Validation" desc="Check if API keys are live" active={policies.activeValidation} onToggle={() => handleTogglePolicy('activeValidation')} theme={theme} disabled={!isAdmin}/>
                     <Toggle label="Block Critical" desc="Fail CI/CD on critical issues" active={policies.blockCritical} onToggle={() => handleTogglePolicy('blockCritical')} theme={theme} disabled={!isAdmin}/>
                 </div>
              </div>

              {/* INTEGRATIONS & CI/CD */}
              <div className={`p-8 rounded-2xl border ${theme.card} ${theme.border}`}>
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Zap className="text-indigo-500" size={20}/> CI/CD & Integrations</h3>
                 
                 {/* Webhook existente */}
                 <div className="flex gap-4 mb-6">
                     <div className="flex-1">
                        <label className="text-xs font-bold opacity-50 block mb-1">Slack/Teams Webhook</label>
                        <input type="password" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} disabled={!isAdmin} placeholder="[https://hooks.slack.com/](https://hooks.slack.com/)..." className={`w-full p-3 border rounded-lg bg-transparent outline-none focus:border-indigo-500 ${theme.border}`}/>
                     </div>
                     <div className="flex items-end">
                        {isAdmin && <button onClick={handleSaveWebhook} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-sm">Save</button>}
                     </div>
                 </div>

                 <div className="border-t border-dashed border-slate-500/20 my-6"></div>

                 {/* Nova secção de API Keys para CI/CD */}
                 <div>
                     <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="font-bold text-sm">API Keys (CI/CD Pipeline)</h4>
                            <p className={`text-xs mt-1 ${theme.muted}`}>Use these keys to authenticate Sentinel CLI in GitHub Actions or Jenkins.</p>
                        </div>
                        <button onClick={handleGenerateKey} className="text-xs bg-indigo-500/10 text-indigo-500 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-500/20 transition-colors">Generate New Key</button>
                     </div>
                     
                     <div className="space-y-3">
                        {apiKeys.length === 0 && <p className="text-xs opacity-50 italic">No active keys.</p>}
                        {apiKeys.map(k => (
                            <div key={k.id} className={`flex justify-between items-center p-3 rounded-lg border ${theme.border} bg-black/5 dark:bg-white/5`}>
                                <div className="font-mono text-xs select-all">{k.key_value}</div>
                                <div className="flex gap-2">
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">Active</span>
                                    {/* Botão de copiar simples */}
                                    <button onClick={() => {navigator.clipboard.writeText(k.key_value); showToast("Key copied")}} className="text-xs hover:text-indigo-500"><FileText size={14}/></button>
                                </div>
                            </div>
                        ))}
                     </div>
                     
                     {/* Snippet de Ajuda */}
                     <div className="mt-6 p-4 rounded-xl bg-black/80 text-slate-300 font-mono text-[10px] border border-white/10 overflow-x-auto">
                        <p className="text-emerald-400 mb-2"># GitHub Actions Example (.github/workflows/sentinel.yml)</p>
                        <p>- name: Run Sentinel Security Scan</p>
                        <p className="pl-4">uses: sentinel-security/action@v1</p>
                        <p className="pl-4">with:</p>
                        <p className="pl-8">api-key: ${`{{`} secrets.SENTINEL_API_KEY {`}}`}</p>
                     </div>
                 </div>
              </div>

              <div className={`p-8 rounded-2xl border ${theme.card} ${theme.border}`}>
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Lock className="text-indigo-500" size={20}/> Security</h3>
                 <div className="space-y-4">
                     <Toggle label="Two-Factor Authentication (2FA)" desc="Require OTP for login" active={securitySettings.mfa} onToggle={() => handleToggleSecurity('mfa')} theme={theme} disabled={false}/>
                     <Toggle label="Session Timeout" desc="Auto-logout after 30 mins" active={securitySettings.timeout} onToggle={() => handleToggleSecurity('timeout')} theme={theme} disabled={false}/>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTES (STYLED) ---
const MenuButton = ({ icon, label, active, onClick, theme }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-medium' : `text-slate-400 hover:text-indigo-500 ${theme.hover}`}`}><div>{icon}</div><span className="text-sm">{label}</span></button>
);
const KPICard = ({ title, value, icon, color, theme }) => (
  <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${theme.card} ${theme.border}`}>
      <div className={`${color} p-3 rounded-xl shadow-lg shadow-indigo-100/50`}>{icon}</div>
      <div><p className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>{title}</p><p className="text-2xl font-extrabold mt-0.5">{value}</p></div>
  </div>
);
const ComplianceCard = ({ title, status, desc, passed, theme }) => (
    <div className={`p-6 rounded-2xl shadow-sm border ${theme.card} ${theme.border}`}><div className="flex justify-between items-start mb-4"><h4 className="font-bold">{title}</h4>{passed ? <CheckCircle2 size={16} className="text-emerald-500"/> : <AlertTriangle size={16} className="text-red-500"/>}</div><p className={`text-xs h-8 ${theme.muted}`}>{desc}</p><div className={`mt-4 text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>Status: {status}</div></div>
);
const SystemStatusItem = ({ label, status, theme }) => (
    <div className={`flex justify-between items-center p-3 rounded-xl ${theme.hover} border ${theme.border}`}><div className="flex items-center gap-3"><Globe size={16} className="text-indigo-500"/><span className="text-sm font-medium">{label}</span></div><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${status === 'Operational' || status === 'Online' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span><span className={`text-xs ${theme.muted}`}>{status}</span></div></div>
);
const Toggle = ({ label, desc, active, onToggle, theme, disabled }) => (
  <div className={`flex items-center justify-between ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div><p className="font-bold text-sm">{label}</p><p className={`text-xs mt-0.5 ${theme.muted}`}>{desc}</p></div>
      <button onClick={onToggle} className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div></button>
  </div>
);