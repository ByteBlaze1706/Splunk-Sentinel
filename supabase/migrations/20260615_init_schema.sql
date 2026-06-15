-- Splunk Sentinel V2.0 Initial Schema Migration
-- Created: 2026-06-15
-- Target Database: Supabase PostgreSQL

-- 1. Users Table (RBAC Profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Security Analyst' CHECK (role IN ('Admin', 'Security Analyst', 'Viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert to profiles except admin" ON public.users FOR INSERT WITH CHECK (role != 'Admin');
CREATE POLICY "Allow users to update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Incidents Table (Compromise Cases)
CREATE TABLE IF NOT EXISTS public.incidents (
    id VARCHAR(50) PRIMARY KEY, -- e.g. INC-2026-1001
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Contained', 'Resolved')),
    raw_logs TEXT NOT NULL,
    summary TEXT,
    root_cause TEXT,
    remediation_plan TEXT,
    assigned_analyst VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read to incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update to incidents" ON public.incidents FOR ALL USING (true);

-- 3. Reports Table (PDF Forensics Export Logs)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id VARCHAR(50) REFERENCES public.incidents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    pdf_size_bytes INT,
    generated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access to reports" ON public.reports FOR ALL USING (true);

-- 4. Chat Sessions Table (Context-Aware AI Completion History)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id VARCHAR(50) REFERENCES public.incidents(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    message_payload JSONB NOT NULL, -- Array of chat messages (sender, text, time)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Chat
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access to chats" ON public.chat_sessions FOR ALL USING (true);

-- 5. Audit Logs Table (Platform Activity timeline feed)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action TEXT NOT NULL, -- e.g. "Devayani created INC-1001", "John updated status to Contained"
    incident_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated select to audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 6. Insert Default Seed Data (For clean boots)
INSERT INTO public.users (email, full_name, role) VALUES
('admin@splunksentinel.local', 'Devayani (Admin)', 'Admin'),
('analyst@splunksentinel.local', 'John Analyst', 'Security Analyst'),
('viewer@splunksentinel.local', 'Sarah Viewer', 'Viewer')
ON CONFLICT (email) DO NOTHING;
