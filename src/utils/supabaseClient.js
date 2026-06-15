// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let realClient = null;
let useMock = true;

if (supabaseUrl && supabaseAnonKey) {
  try {
    realClient = createClient(supabaseUrl, supabaseAnonKey);
    useMock = false;
    console.log('[SUPABASE] Live client successfully initialized.');
  } catch (error) {
    console.error('[SUPABASE] Failed to initialize live client, falling back to mock mode:', error);
  }
} else {
  console.log('[SUPABASE] Credentials missing. Running in Persistent Mock Mode.');
}

export const supabase = realClient;
export const isMockMode = () => useMock;

// ----------------------------------------------------
// LOCAL STORAGE MOCK DATABASE SEED & helpers
// ----------------------------------------------------

const DEMO_ADMIN_EMAIL = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@splunksentinel.local';
const DEMO_ANALYST_EMAIL = process.env.NEXT_PUBLIC_DEMO_ANALYST_EMAIL || 'analyst@splunksentinel.local';
const DEMO_VIEWER_EMAIL = process.env.NEXT_PUBLIC_DEMO_VIEWER_EMAIL || 'viewer@splunksentinel.local';

const DEFAULT_USERS = [
  { id: 'usr-1', email: DEMO_ADMIN_EMAIL, full_name: 'Devayani (Admin)', role: 'Admin' },
  { id: 'usr-2', email: DEMO_ANALYST_EMAIL, full_name: 'John Analyst', role: 'Security Analyst' },
  { id: 'usr-3', email: DEMO_VIEWER_EMAIL, full_name: 'Sarah Viewer', role: 'Viewer' }
];

const DEFAULT_INCIDENTS = [
  {
    id: 'INC-2026-1001',
    title: 'SSH Brute Force Attack',
    severity: 'CRITICAL',
    status: 'Resolved',
    raw_logs: 'Failed password for invalid user admin from 198.51.100.42 port 49218 ssh2...',
    summary: 'Brute force attempts detected on authentication endpoints originating from a known hostile subnet.',
    root_cause: 'Open public port 22 with standard administrative logins enabled.',
    remediation_plan: 'Disable root SSH login, enforce public key authentication, and rate-limit SSH traffic.',
    assigned_analyst: 'John Analyst',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() // 3 days ago
  },
  {
    id: 'INC-2026-1002',
    title: 'Web Application SQL Injection',
    severity: 'HIGH',
    status: 'Investigating',
    raw_logs: 'SELECT * FROM users WHERE username = \'admin\' AND password = \'\' OR \'1\'=\'1\'',
    summary: 'Injection parameters identified in query string fields targeting internal customer registries.',
    root_cause: 'Unsanitized database queries on public search API components.',
    remediation_plan: 'Implement parameterized SQL bindings and block SQL keywords at Web Application Firewall (WAF) layer.',
    assigned_analyst: 'John Analyst',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: 'INC-2026-1003',
    title: 'Impossible Travel Alert',
    severity: 'MEDIUM',
    status: 'Open',
    raw_logs: `User ${DEMO_ADMIN_EMAIL} logged in from New York, then 10 mins later from Tokyo.`,
    summary: 'Co-occurring logins across disparate geographic locations within an impossible physical transit window.',
    root_cause: 'Session hijacking or compromised credentials being used by automated remote botnets.',
    remediation_plan: 'Revoke active OAuth sessions, enforce multi-factor authentication (MFA), and force credential reset.',
    assigned_analyst: 'Sarah Viewer',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  },
  {
    id: 'INC-2026-1004',
    title: 'Linux Privilege Escalation',
    severity: 'HIGH',
    status: 'Contained',
    raw_logs: 'User dev-usr executed sudo /usr/bin/find -exec sh -i \\; yielding root shell access.',
    summary: 'Exploitation of weak sudoers configuration permissions to spawn interactive root shells.',
    root_cause: 'Misconfigured SUID permissions on administrative shell binary executables.',
    remediation_plan: 'Remove sudoers wildcards, restrict binary SUID flags, and audit system permission configurations.',
    assigned_analyst: 'Devayani (Admin)',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString() // 48 hours ago
  }
];

const DEFAULT_AUDIT_LOGS = [
  { id: 'aud-1', user_name: 'System', user_role: 'Admin', action: 'System seeded default forensic telemetry', incident_id: null, created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
  { id: 'aud-2', user_name: 'Devayani (Admin)', user_role: 'Admin', action: 'Devayani created SSH Brute Force Attack case', incident_id: 'INC-2026-1001', created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
  { id: 'aud-3', user_name: 'Devayani (Admin)', user_role: 'Admin', action: 'Devayani assigned incident INC-2026-1001 to John Analyst', incident_id: 'INC-2026-1001', created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
  { id: 'aud-4', user_name: 'John Analyst', user_role: 'Security Analyst', action: 'John Analyst updated status of INC-2026-1001 to Resolved', incident_id: 'INC-2026-1001', created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
  { id: 'aud-5', user_name: 'John Analyst', user_role: 'Security Analyst', action: 'John Analyst updated status of INC-2026-1002 to Investigating', incident_id: 'INC-2026-1002', created_at: new Date(Date.now() - 3600000 * 12).toISOString() }
];

const getLocalStorageData = (key, defaultData) => {
  if (typeof window === 'undefined') return defaultData;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(raw);
};

const setLocalStorageData = (key, data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// ----------------------------------------------------
// AUTHENTICATION WRAPPERS
// ----------------------------------------------------

export const signUpUser = async (email, password, fullName, role) => {
  if (!useMock) {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { error: authError };
    // Insert profile data into users table
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .insert([{ id: authData.user.id, email, full_name: fullName, role }]);
    if (dbError) return { error: dbError };
    return { data: { email, full_name: fullName, role } };
  }

  // Mock implementation
  const users = getLocalStorageData('sentinel_mock_users', DEFAULT_USERS);
  if (users.some(u => u.email === email)) {
    return { error: { message: 'User already exists' } };
  }
  const newUser = { id: `usr-${Date.now()}`, email, full_name: fullName, role };
  users.push(newUser);
  setLocalStorageData('sentinel_mock_users', users);
  return { data: newUser };
};

export const signInUser = async (email, password) => {
  if (!useMock) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return { error: { message: 'Invalid email or password.' } };
    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    if (profileError) return { error: { message: 'Invalid email or password.' } };
    
    // Store in session
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentinel_session', JSON.stringify(profileData));
    }
    return { data: profileData };
  }

  // Mock implementation
  const users = getLocalStorageData('sentinel_mock_users', DEFAULT_USERS);
  const foundUser = users.find(u => u.email === email);
  if (!foundUser) {
    return { error: { message: 'Invalid email or password.' } };
  }
  // Store session in localStorage
  setLocalStorageData('sentinel_session', foundUser);
  return { data: foundUser };
};

export const signInDemoUser = async (role) => {
  const emailMap = {
    admin: DEMO_ADMIN_EMAIL,
    analyst: DEMO_ANALYST_EMAIL,
    viewer: DEMO_VIEWER_EMAIL
  };
  const email = emailMap[role.toLowerCase()];
  if (!email) return { error: { message: 'Invalid email or password.' } };
  return signInUser(email, 'password123');
};

export const signOutUser = async () => {
  if (!useMock) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sentinel_session');
  }
  return { success: true };
};

export const getSessionUser = () => {
  return getLocalStorageData('sentinel_session', null);
};

// ----------------------------------------------------
// DATABASE OPERATION WRAPPERS
// ----------------------------------------------------

// 1. Incidents
export const getIncidents = async () => {
  if (!useMock) {
    const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
    if (error) return { error };
    return { data };
  }
  const data = getLocalStorageData('sentinel_mock_incidents', DEFAULT_INCIDENTS);
  return { data: [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) };
};

export const createIncident = async (incident) => {
  const newIncident = {
    ...incident,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!useMock) {
    const { data, error } = await supabase.from('incidents').insert([newIncident]).select();
    if (error) return { error };
    return { data: data[0] };
  }

  const incidents = getLocalStorageData('sentinel_mock_incidents', DEFAULT_INCIDENTS);
  incidents.push(newIncident);
  setLocalStorageData('sentinel_mock_incidents', incidents);
  return { data: newIncident };
};

export const updateIncident = async (id, updates) => {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };

  if (!useMock) {
    const { data, error } = await supabase.from('incidents').update(updatedData).eq('id', id).select();
    if (error) return { error };
    return { data: data[0] };
  }

  const incidents = getLocalStorageData('sentinel_mock_incidents', DEFAULT_INCIDENTS);
  const idx = incidents.findIndex(inc => inc.id === id);
  if (idx === -1) return { error: { message: 'Incident not found' } };
  incidents[idx] = { ...incidents[idx], ...updatedData };
  setLocalStorageData('sentinel_mock_incidents', incidents);
  return { data: incidents[idx] };
};

export const deleteIncident = async (id) => {
  if (!useMock) {
    const { error } = await supabase.from('incidents').delete().eq('id', id);
    if (error) return { error };
    return { success: true };
  }

  const incidents = getLocalStorageData('sentinel_mock_incidents', DEFAULT_INCIDENTS);
  const filtered = incidents.filter(inc => inc.id !== id);
  setLocalStorageData('sentinel_mock_incidents', filtered);
  return { success: true };
};

// 2. PDF Reports
export const getReports = async () => {
  if (!useMock) {
    const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (error) return { error };
    return { data };
  }
  const data = getLocalStorageData('sentinel_mock_reports', []);
  return { data };
};

export const createReport = async (report) => {
  const newReport = {
    id: `rep-${Date.now()}`,
    ...report,
    created_at: new Date().toISOString()
  };

  if (!useMock) {
    const { data, error } = await supabase.from('reports').insert([report]).select();
    if (error) return { error };
    return { data: data[0] };
  }

  const reports = getLocalStorageData('sentinel_mock_reports', []);
  reports.push(newReport);
  setLocalStorageData('sentinel_mock_reports', reports);
  return { data: newReport };
};

// 3. Chat sessions
export const getChats = async (incidentId) => {
  if (!useMock) {
    const { data, error } = await supabase.from('chat_sessions').select('*').eq('incident_id', incidentId).order('created_at', { ascending: true });
    if (error) return { error };
    return { data };
  }
  const chats = getLocalStorageData('sentinel_mock_chats', {});
  return { data: chats[incidentId] || [] };
};

export const saveChat = async (incidentId, userName, messagePayload) => {
  if (!useMock) {
    const { data, error } = await supabase.from('chat_sessions').insert([{ incident_id: incidentId, user_name: userName, message_payload: messagePayload }]).select();
    if (error) return { error };
    return { data: data[0] };
  }

  const chats = getLocalStorageData('sentinel_mock_chats', {});
  chats[incidentId] = messagePayload;
  setLocalStorageData('sentinel_mock_chats', chats);
  return { data: { incident_id: incidentId, user_name: userName, message_payload: messagePayload } };
};

// 4. Audit logs
export const getAuditLogs = async () => {
  if (!useMock) {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) return { error };
    return { data };
  }
  const data = getLocalStorageData('sentinel_mock_audit_logs', DEFAULT_AUDIT_LOGS);
  return { data: [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) };
};

export const createAuditLog = async (userName, userRole, action, incidentId = null) => {
  const newLog = {
    id: `aud-${Date.now()}`,
    user_name: userName,
    user_role: userRole,
    action,
    incident_id: incidentId,
    created_at: new Date().toISOString()
  };

  if (!useMock) {
    const { data, error } = await supabase.from('audit_logs').insert([newLog]).select();
    if (error) return { error };
    return { data: data[0] };
  }

  const logs = getLocalStorageData('sentinel_mock_audit_logs', DEFAULT_AUDIT_LOGS);
  logs.unshift(newLog);
  setLocalStorageData('sentinel_mock_audit_logs', logs);
  return { data: newLog };
};
