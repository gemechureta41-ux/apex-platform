import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, BookOpen,
  ChevronDown, CircleHelp, Clock3, CreditCard, LayoutDashboard, LogOut,
  Menu, Search, Settings, ShieldCheck, TrendingUp, Users, Wallet, X
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const chartData = [
  { time: '09:00', price: 1.0821 }, { time: '10:00', price: 1.0834 },
  { time: '11:00', price: 1.0818 }, { time: '12:00', price: 1.0852 },
  { time: '13:00', price: 1.0841 }, { time: '14:00', price: 1.0870 },
  { time: '15:00', price: 1.0861 }, { time: '16:00', price: 1.0892 },
  { time: '17:00', price: 1.0884 }, { time: '18:00', price: 1.0910 }
];

const demoMarkets = [
  { pair: 'EUR/USD', name: 'Euro / US Dollar', price: '1.09100', change: '+0.42%', up: true },
  { pair: 'GBP/USD', name: 'British Pound / US Dollar', price: '1.27420', change: '+0.18%', up: true },
  { pair: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: '153.820', change: '-0.31%', up: false },
  { pair: 'XAU/USD', name: 'Gold / US Dollar', price: '2,684.50', change: '+0.76%', up: true },
  { pair: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: '0.65420', change: '-0.12%', up: false }
];

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!supabase) return setMessage('Connect Supabase first. Follow SETUP.md.');
    setBusy(true); setMessage('');
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        if (data.session) onAuth(data.session.user);
        else setMessage('Registration received. Check your email to confirm your account, then sign in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      }
    } catch (err) { setMessage(err.message || 'Authentication failed.'); }
    finally { setBusy(false); }
  }

  return <div className="auth-wrap">
    <div className="auth-card">
      <div className="brand-mark">A<span>FX</span></div>
      <div className="eyebrow">APEX FOREX TRADING</div>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="muted">Access your trading workspace and market watchlist.</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'register' && <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder="Your name" /></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@example.com" /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" /></label>
        <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      {message && <div className="notice">{message}</div>}
      <div className="auth-switch">{mode === 'login' ? "Don't have an account?" : 'Already registered?'}
        <button onClick={()=>{setMode(mode==='login'?'register':'login');setMessage('')}}>{mode==='login'?'Create account':'Sign in'}</button>
      </div>
      <div className="auth-foot"><ShieldCheck size={14}/> Secure authentication powered by Supabase</div>
    </div>
  </div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [section, setSection] = useState('Overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null); setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !supabase) { setProfile(null); return; }
    supabase.from('profiles').select('id, full_name, role').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (data) setProfile(data);
        else if (error) setNotice('Profile is not ready. Run the SQL setup and refresh.');
      });
  }, [user]);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setProfile(null);
  }

  const isAdmin = profile?.role === 'admin';
  const nav = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Markets', icon: Activity },
    { label: 'Analysis', icon: BarChart3 },
    { label: 'Education', icon: BookOpen },
    { label: 'Wallet', icon: Wallet }
  ];
  if (isAdmin) nav.push({ label: 'Admin Panel', icon: ShieldCheck });

  if (loading) return <div className="loading">Loading APEX workspace…</div>;
  if (!user) return <AuthScreen onAuth={setUser} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'open':''}`}>
      <div className="side-brand"><div className="brand-mark small">A<span>FX</span></div><div><b>APEX</b><small>FOREX TRADING</small></div><button className="mobile-close" onClick={()=>setMobileOpen(false)}><X/></button></div>
      <div className="side-label">WORKSPACE</div>
      {nav.map(item => <button key={item.label} className={`nav-item ${section===item.label?'active':''}`} onClick={()=>{setSection(item.label);setMobileOpen(false)}}><item.icon size={18}/>{item.label}</button>)}
      <div className="side-label bottom-label">PREFERENCES</div>
      <button className="nav-item" onClick={()=>setNotice('Settings panel is planned for the next iteration.')}><Settings size={18}/>Settings</button>
      <button className="nav-item" onClick={()=>setNotice('Help center will be connected here.')}><CircleHelp size={18}/>Help center</button>
      <div className="sidebar-bottom"><div className="profile-mini"><div className="avatar">{(profile?.full_name||user.email||'A').slice(0,1).toUpperCase()}</div><div className="profile-text"><b>{profile?.full_name || 'Trader'}</b><small>{user.email}</small></div></div><button className="logout" onClick={signOut} title="Sign out"><LogOut size={17}/></button></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="hamburger" onClick={()=>setMobileOpen(true)}><Menu/></button>
        <div className="breadcrumb">Workspace <span>/</span> <b>{section}</b></div>
        <div className="top-actions"><div className="market-status"><i/> Markets overview</div><button className="icon-btn" onClick={()=>setNotice('You are all caught up.')}><Bell size={18}/></button><div className="top-avatar">{(profile?.full_name||user.email||'A').slice(0,1).toUpperCase()}</div></div>
      </header>

      <div className="content">
        {notice && <div className="notice dismiss"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
        {section === 'Admin Panel' ? <AdminPanel /> :
        section === 'Overview' ? <Overview profile={profile} user={user} setSection={setSection}/> :
        section === 'Markets' ? <Markets/> :
        section === 'Analysis' ? <Analysis/> :
        section === 'Education' ? <Placeholder title="Forex Education" text="Your structured Forex learning modules can be added here." icon={BookOpen}/> :
        <Placeholder title="Wallet" text="Connect a payment provider before enabling deposits, withdrawals or subscriptions." icon={CreditCard}/>}
      </div>
      <footer className="footer">© {new Date().getFullYear()} APEX Forex Trading <span>Educational platform · Trading involves risk</span></footer>
    </main>
  </div>;
}

function Overview({ profile, user, setSection }) {
  return <>
    <div className="welcome-row"><div><div className="eyebrow">TRADING WORKSPACE</div><h1>Good to see you, {profile?.full_name?.split(' ')[0] || 'Trader'}.</h1><p className="muted">Here is your market snapshot for today.</p></div><button className="outline-btn" onClick={()=>setSection('Markets')}><Activity size={16}/> Explore markets</button></div>
    <div className="stats-grid">
      <Stat title="Watchlist instruments" value="05" detail="Forex & metals" icon={Activity}/>
      <Stat title="Market direction" value="Mixed" detail="Demo snapshot" icon={TrendingUp}/>
      <Stat title="Account status" value="Active" detail="Authentication enabled" icon={ShieldCheck}/>
      <Stat title="Trading balance" value="—" detail="No broker connected" icon={Wallet}/>
    </div>
    <div className="section-heading"><div><h2>Market performance</h2><p className="muted">Illustrative chart data — not live quotes.</p></div><span className="tag">DEMO DATA</span></div>
    <div className="dashboard-grid">
      <div className="panel chart-panel"><div className="panel-head"><div><b>EUR/USD</b><small>Euro / US Dollar · Sample price series</small></div><div className="price-large">1.09100 <span className="positive">+0.42%</span></div></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d6ae55" stopOpacity={0.28}/><stop offset="95%" stopColor="#d6ae55" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#252a31" vertical={false}/><XAxis dataKey="time" stroke="#69717c" tickLine={false} axisLine={false}/><YAxis domain={['dataMin - 0.002','dataMax + 0.002']} orientation="right" stroke="#69717c" tickLine={false} axisLine={false} tickFormatter={v=>v.toFixed(3)}/><Tooltip contentStyle={{background:'#15191f',border:'1px solid #343a43',borderRadius:10}}/><Area type="monotone" dataKey="price" stroke="#d6ae55" strokeWidth={2.5} fill="url(#goldFill)"/></AreaChart></ResponsiveContainer></div><div className="chart-legend"><span><i/> Sample EUR/USD series</span><span>Illustrative only</span></div></div>
      <div className="panel watch-panel"><div className="panel-head"><div><b>Market watch</b><small>Popular instruments</small></div><button className="text-btn" onClick={()=>setSection('Markets')}>View all</button></div><MarketRows compact/></div>
    </div>
    <div className="panel quick-panel"><div><b>Keep learning</b><p className="muted">Build a repeatable process with market structure, risk management and trading psychology.</p></div><button className="outline-btn" onClick={()=>setSection('Education')}>Open education <ArrowUpRight size={16}/></button></div>
  </>;
}

function Stat({title,value,detail,icon:Icon}) {
  return <div className="stat-card"><div className="stat-top"><span>{title}</span><Icon size={18}/></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>;
}

function MarketRows({compact=false}) {
  return <div className="market-list">{demoMarkets.slice(0,compact?4:5).map(m=><div className="market-row" key={m.pair}><div className="pair-icon">{m.pair.slice(0,1)}</div><div className="pair-name"><b>{m.pair}</b><small>{m.name}</small></div><div className="pair-price"><b>{m.price}</b><small className={m.up?'positive':'negative'}>{m.change}</small></div><div className={`trend ${m.up?'up':'down'}`}>{m.up?<ArrowUpRight size={17}/>:<ArrowDownRight size={17}/>}</div></div>)}</div>;
}

function Markets() {
  const [q,setQ]=useState('');
  const rows=demoMarkets.filter(m=>(m.pair+' '+m.name).toLowerCase().includes(q.toLowerCase()));
  return <><div className="page-title"><div className="eyebrow">INSTRUMENTS</div><h1>Markets</h1><p className="muted">Explore the instruments in your sample watchlist.</p></div><div className="panel"><div className="table-toolbar"><b>Watchlist</b><div className="search-box"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search instruments"/></div></div><MarketRows/><p className="disclaimer">Prices and percentage changes shown here are illustrative demo values, not executable quotes.</p></div></>;
}

function Analysis() {
  return <><div className="page-title"><div className="eyebrow">MARKET RESEARCH</div><h1>Analysis workspace</h1><p className="muted">A structured place for your technical-analysis workflow.</p></div><div className="analysis-cards"><div className="panel"><BarChart3/><h3>Market structure</h3><p className="muted">Record swing highs/lows, BOS, CHoCH and directional bias.</p><span className="tag">WORKSPACE TEMPLATE</span></div><div className="panel"><Activity/><h3>Liquidity map</h3><p className="muted">Document equal highs/lows, session ranges and liquidity sweeps.</p><span className="tag">WORKSPACE TEMPLATE</span></div><div className="panel"><ShieldCheck/><h3>Risk checklist</h3><p className="muted">Define stop loss, position size and maximum risk before a trade.</p><span className="tag">WORKSPACE TEMPLATE</span></div></div></>;
}

function Placeholder({title,text,icon:Icon}) {
  return <div className="page-title"><div className="eyebrow">APEX WORKSPACE</div><h1>{title}</h1><div className="panel empty-state"><Icon size={30}/><h3>{title} module</h3><p className="muted">{text}</p></div></div>;
}

function AdminPanel() {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    async function load(){
      if(!supabase) return;
      const {data,error}=await supabase.from('profiles').select('id,full_name,role,created_at').order('created_at',{ascending:false}).limit(100);
      if(!active)return;
      if(error)setError(error.message); else setUsers(data||[]);
      setLoading(false);
    }
    load(); return ()=>{active=false};
  },[]);
  return <><div className="page-title"><div className="eyebrow">ADMINISTRATION</div><h1>Admin panel</h1><p className="muted">User directory and platform access overview.</p></div><div className="panel"><div className="table-toolbar"><b>Registered profiles</b><span className="tag">ADMIN ONLY</span></div>{error&&<div className="notice">{error}</div>}{loading?<p className="muted">Loading users…</p>:<div className="admin-table"><div className="admin-row admin-head"><span>Name</span><span>Role</span><span>Joined</span></div>{users.map(u=><div className="admin-row" key={u.id}><span>{u.full_name||'Unnamed user'}</span><span className="role-pill">{u.role}</span><span>{u.created_at?new Date(u.created_at).toLocaleDateString():'—'}</span></div>)}</div>}</div><p className="disclaimer">Admin access is granted only by changing a trusted account's role directly in the Supabase SQL editor. Never expose a service-role key in this website.</p></>;
}

export default App;
