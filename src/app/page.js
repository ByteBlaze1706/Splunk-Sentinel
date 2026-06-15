"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  FileSearch, 
  History, 
  Settings, 
  Play, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Download, 
  FileText, 
  ChevronRight, 
  User, 
  Terminal, 
  Loader2, 
  KeyRound, 
  Activity, 
  Info,
  Server,
  Network,
  Lock,
  ArrowRight,
  Database,
  RefreshCw
} from "lucide-react";
import { PRESETS } from "@/utils/presets";
import { jsPDF } from "jspdf";

// Default pre-populated incidents to show on first load
const INITIAL_INCIDENTS = [
  {
    id: "INC-2026-1001",
    timestamp: "2026-06-15 14:22:32",
    title: "SSH Brute Force Attack",
    severity: "critical",
    status: "Resolved",
    threatType: "Credential Bruteforcing & Account Compromise",
    rootCause: "An external attacker at IP 198.51.100.42 targeted the server 'auth-srv-01' using a dictionary password attack against common users (admin, root, operator) before successfully guessing the password for user 'devops'. Immediately after authentication, the attacker spawned an interactive root bash shell (/bin/bash) via sudo, achieving full host compromise.",
    summary: "External entity conducted a successful SSH brute-force attack against host auth-srv-01, compromising the devops account and escalating privileges to root within 2.5 minutes.",
    keyArtifacts: {
      sourceIps: ["198.51.100.42"],
      targetSystems: ["auth-srv-01"],
      affectedUsers: ["devops", "root", "admin", "operator"],
      signatures: ["sshd: Failed password", "sshd: Accepted password", "sudo: COMMAND=/bin/bash"]
    },
    recommendedActions: [
      "Immediately revoke session for user 'devops' and terminate PID 12518.",
      "Disable password authentication in /etc/ssh/sshd_config (enforce SSH Keys only).",
      "Temporarily block source IP address 198.51.100.42 on the perimeter firewall.",
      "Force password rotation and audit SSH authorized_keys for the 'devops' account.",
      "Configure fail2ban or equivalent IPS to automatically block hosts with >5 failed logins."
    ],
    completedActions: [
      "Immediately revoke session for user 'devops' and terminate PID 12518.",
      "Disable password authentication in /etc/ssh/sshd_config (enforce SSH Keys only).",
      "Temporarily block source IP address 198.51.100.42 on the perimeter firewall.",
      "Force password rotation and audit SSH authorized_keys for the 'devops' account.",
      "Configure fail2ban or equivalent IPS to automatically block hosts with >5 failed logins."
    ],
    timeline: [
      { time: "14:20:01", event: "Attack Start", details: "Initial failed login attempt targeting user 'admin' from IP 198.51.100.42." },
      { time: "14:20:30", event: "Target Shift", details: "Attacker shifts targets to administrative accounts 'root' and 'operator'." },
      { time: "14:21:02", event: "Targeting DevOps", details: "Attacker begins targeting user 'devops', generating 3 failed passwords." },
      { time: "14:21:58", event: "Compromise", details: "Attacker guesses correct password for 'devops' and establishes active session." },
      { time: "14:22:30", event: "Privilege Escalation", details: "User 'devops' executes sudo to run /bin/bash, gaining full root privileges." }
    ],
    logs: PRESETS.bruteForce.logs,
    chatHistory: [
      { role: "assistant", content: "Hello, I am Sentinel. I have compiled the analysis for this SSH Brute Force attack. The attacker achieved root privilege via passwordless sudo find execution. How would you like to proceed with containment?", timestamp: "14:23:10" }
    ],
    mocked: true,
    modelUsed: "MOCK ENGINE"
  },
  {
    id: "INC-2026-1002",
    timestamp: "2026-06-15 15:11:30",
    title: "Web Application SQL Injection",
    severity: "high",
    status: "Investigating",
    threatType: "SQL Injection (SQLi) & Data Reconnaissance",
    rootCause: "The web application endpoint `/api/v1/products` failed to sanitize input parameter `category`. An attacker at IP 203.0.113.88 exploited this vulnerability by inserting SQL payloads (`UNION SELECT` and `pg_sleep`) to query the underlying PostgreSQL database. The attacker mapped out database column structures, found the user table `accounts`, extracted credentials (`user_name` and `password_hash`), and then leveraged an admin export route to download the database tables.",
    summary: "SQL Injection vulnerability on web application was successfully exploited by 203.0.113.88, leading to database schema mapping, table enumeration, and database backup exfiltration.",
    keyArtifacts: {
      sourceIps: ["203.0.113.88"],
      targetSystems: ["Web Gateway", "DB-SERVER-01 (PostgreSQL)"],
      affectedUsers: ["PostgreSQL App Connection", "Admin portal account"],
      signatures: ["UNION SELECT", "pg_sleep(10)", "OR 1=1", "postgresql ERROR:relation does not exist"]
    },
    recommendedActions: [
      "Implement parameterized queries or use an ORM for query construction in `/api/v1/products`.",
      "Deploy Web Application Firewall (WAF) rules targeting SQL injection patterns (e.g. UNION/SELECT regex).",
      "Enable database query parameter validation and restrict application DB user privileges (least privilege).",
      "Block IP 203.0.113.88 immediately at the application gateway / load balancer.",
      "Audit the `/api/v1/admin/exports` endpoint access control - verify why the unauthorized user could invoke it."
    ],
    completedActions: [
      "Block IP 203.0.113.88 immediately at the application gateway / load balancer."
    ],
    timeline: [
      { time: "15:10:02", event: "Reconnaissance", details: "Attacker issues standard HTTP request to inspect system behavior." },
      { time: "15:10:15", event: "SQLi Probe", details: "Attacker attempts simple tautology probe `' OR 1=1--` to bypass category filtering." },
      { time: "15:10:30", event: "Error Injection", details: "Attacker injects UNION SELECT to query user table, triggering database schema mismatch error." },
      { time: "15:10:45", event: "Data Leak", details: "Attacker successfully guesses correct table name `accounts` and retrieves credentials." },
      { time: "15:11:30", event: "Exfiltration", details: "Attacker calls backend admin export file, pulling down the full accounts table (89KB JSON)." }
    ],
    logs: PRESETS.sqlInjection.logs,
    chatHistory: [
      { role: "assistant", content: "Warning: Database exposure confirmed. The logs capture table dumps being requested from 203.0.113.88. Parameterized queries must be implemented. I can write a remediation query or configuration script for you. What language is the backend written in?", timestamp: "15:12:05" }
    ],
    mocked: true,
    modelUsed: "MOCK ENGINE"
  },
  {
    id: "INC-2026-1003",
    timestamp: "2026-06-15 14:04:45",
    title: "Impossible Travel Alert",
    severity: "medium",
    status: "Triage",
    threatType: "Credential Abuse & Impossible Travel",
    rootCause: "The user account `alice@corp.com` authenticated successfully from New York, US at 13:45:00. Just 15 minutes later, at 14:00:15, the same user authenticated from London, UK via a VPN gateway. The geographical distance between New York and London (~3,500 miles) is physically impossible to traverse in 15 minutes. The secondary session from London was immediately utilized to map corporate file shares and access highly sensitive finance and strategy documents.",
    summary: "Impossible travel alert: alice@corp.com logged on from New York and London within 15 minutes. The session in London was used to access confidential payroll and strategy files, suggesting session hijacking or credential theft.",
    keyArtifacts: {
      sourceIps: ["198.51.100.10", "203.0.113.102"],
      targetSystems: ["AD-CONTROLLER-01", "Exchange-Mail-01", "File-Share-01"],
      affectedUsers: ["alice@corp.com"],
      signatures: ["EventID=4624 (Logon Success)", "Impossible travel speed", "Access to sensitive shares"]
    },
    recommendedActions: [
      "Revoke all active tokens/sessions for `alice@corp.com` in Active Directory and Azure AD.",
      "Reset the password for user `alice@corp.com` and force re-registration of MFA devices.",
      "Block the suspicious IP `203.0.113.102` (London) on the firewall and VPN gateway.",
      "Quarantine workstation linked to IP `198.51.100.10` to scan for keyloggers or token-stealing malware.",
      "Verify if Alice is traveling or if she shared credentials/VPN configurations."
    ],
    completedActions: [],
    timeline: [
      { time: "13:45:00", event: "US Logon", details: "Success logon from workstation in New York, US (Legitimate user IP)." },
      { time: "13:52:12", event: "Mail Access", details: "Alice accesses Exchange email from the same US workstation." },
      { time: "14:00:15", event: "UK VPN Logon", details: "Successful VPN logon from London, UK using valid credentials (Session compromise)." },
      { time: "14:02:10", event: "Sensitive Access", details: "Attacker accesses Q2 Salaries spreadsheet on file share server." },
      { time: "14:03:00", event: "Strategic Access", details: "Attacker opens mergers and acquisitions document on the same file share." }
    ],
    logs: PRESETS.suspiciousAuth.logs,
    chatHistory: [
      { role: "assistant", content: "I've flagged this Impossible Travel incident. The access of '2026_Q2_Salaries.xlsx' is highly concerning. I recommend immediately locking Alice's AD account to block exfiltration.", timestamp: "14:05:00" }
    ],
    mocked: true,
    modelUsed: "MOCK ENGINE"
  }
];

// Utility function to generate unique incident IDs outside of component render scope
const generateIncidentId = () => {
  return `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  
  // Lazy state initializers to prevent setState in useEffect warning
  const [incidents, setIncidents] = useState(() => {
    if (typeof window !== "undefined") {
      const storedIncidents = localStorage.getItem("sentinel_incidents");
      if (storedIncidents) {
        try {
          return JSON.parse(storedIncidents);
        } catch (e) {
          console.error("Failed to parse stored incidents:", e);
          return INITIAL_INCIDENTS;
        }
      }
    }
    return INITIAL_INCIDENTS;
  });

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [logsInput, setLogsInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  
  // Analyzer loading phases
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // AI Chat states
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef(null);

  // Settings states with lazy initialization
  const [openaiKey, setOpenaiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sentinel_openai_key") || "";
    }
    return "";
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sentinel_model") || "gpt-4o-mini";
    }
    return "gpt-4o-mini";
  });

  // Notifications
  const [alertBanner, setAlertBanner] = useState(null);

  // Splunk MCP Integration State
  const [splunkHost, setSplunkHost] = useState("https://splunk-mcp.corp.local:8089");
  const [splunkToken, setSplunkToken] = useState("••••••••••••••••••••");
  const [splunkIndex, setSplunkIndex] = useState("security");
  const [mcpStatus, setMcpStatus] = useState("idle");
  const [mcpLogs, setMcpLogs] = useState([]);

  const testMcpConnection = () => {
    setMcpStatus("testing");
    setMcpLogs(["[MCP_INIT] Instantiating JSON-RPC over WebSockets...", "[MCP_HANDSHAKE] Sending schema verification request..."]);
    
    setTimeout(() => {
      setMcpLogs(prev => [...prev, "[MCP_SCHEMA] Schema validated successfully. Protocol Version: 1.0.0", "[SPLUNK_API] Pinging Splunk REST Daemon on host..."]);
    }, 1000);

    setTimeout(() => {
      setMcpLogs(prev => [...prev, "[SPLUNK_API] Response: 200 OK (Version: 9.2.1)", "[SPLUNK_DB] Querying index namespaces..."]);
    }, 2000);

    setTimeout(() => {
      setMcpLogs(prev => [...prev, `[SPLUNK_DB] Success: Index '${splunkIndex}' target verified.`, "[MCP_READY] Model Context Protocol Bridge Established!"]);
      setMcpStatus("success");
      triggerToast("Splunk MCP Connection Established", "success");
    }, 3000);
  };

  // Set default database on mount if missing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sentinel_incidents");
      if (!stored) {
        localStorage.setItem("sentinel_incidents", JSON.stringify(INITIAL_INCIDENTS));
      }
    }
  }, []);

  // Sync incidents with localStorage
  const saveIncidents = (updatedList) => {
    setIncidents(updatedList);
    localStorage.setItem("sentinel_incidents", JSON.stringify(updatedList));
  };

  // Scroll to chat bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedIncident?.chatHistory, isChatting]);

  // Show a temporal alert toast
  const triggerToast = (message, type = "success") => {
    setAlertBanner({ message, type });
    setTimeout(() => {
      setAlertBanner(null);
    }, 4000);
  };

  // File Upload Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      readLogFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      readLogFile(file);
    }
  };

  const readLogFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogsInput(event.target.result);
      triggerToast(`Successfully loaded file: ${file.name}`, "success");
    };
    reader.onerror = () => {
      triggerToast("Failed to read log file", "error");
    };
    reader.readAsText(file);
  };

  // Trigger preset logs loader
  const loadPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setLogsInput(preset.logs);
      triggerToast(`Loaded Demo Preset: ${preset.name}`, "success");
    }
  };

  // Run Local/OpenAI Log analysis
  const runAnalysis = async () => {
    if (!logsInput.trim()) {
      triggerToast("Please paste or upload some logs to analyze.", "error");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisPhase("Initializing Heuristics Core...");

    const phases = [
      { progress: 15, text: "Scanning Raw Payload..." },
      { progress: 35, text: "Extracting Indicators of Compromise (IPs, Ports, Accounts)..." },
      { progress: 55, text: "Correlating Chronological Incident Events..." },
      { progress: 75, text: "Running Deep AI Remediation Modeling..." },
      { progress: 90, text: "Compiling Threat Intelligence Matrix..." },
      { progress: 95, text: "Formatting Cyber Incident Report..." }
    ];

    let currentPhaseIdx = 0;
    const interval = setInterval(() => {
      if (currentPhaseIdx < phases.length) {
        setAnalysisProgress(phases[currentPhaseIdx].progress);
        setAnalysisPhase(phases[currentPhaseIdx].text);
        currentPhaseIdx++;
      }
    }, 800);

    try {
      // Call backend API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: logsInput,
          apiKey: openaiKey,
          model: selectedModel
        })
      });

      clearInterval(interval);
      setAnalysisProgress(100);
      setAnalysisPhase("Analysis Complete!");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Generate a new incident structure
      const newIncidentId = generateIncidentId();
      const title = data.threatType || "Anomaly Analysis";
      
      const newIncident = {
        id: newIncidentId,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        title: title,
        severity: data.severity || "medium",
        status: "Investigating",
        threatType: data.threatType || "Undetermined Anomaly",
        rootCause: data.rootCause || "Analysis did not yield a root cause.",
        summary: data.summary || "Summary of logs scanned.",
        keyArtifacts: {
          sourceIps: data.keyArtifacts?.sourceIps || [],
          targetSystems: data.keyArtifacts?.targetSystems || [],
          affectedUsers: data.keyArtifacts?.affectedUsers || [],
          signatures: data.keyArtifacts?.signatures || []
        },
        recommendedActions: data.recommendedActions || [],
        completedActions: [],
        timeline: data.timeline || [],
        logs: logsInput,
        chatHistory: [
          { 
            role: "assistant", 
            content: `Hello, I am Sentinel. I have successfully analyzed the logs under report ${newIncidentId}. Threat profile is identified as ${title} (${data.severity || "medium"} severity). Ask me anything to assist in containment.`, 
            timestamp: new Date().toLocaleTimeString() 
          }
        ],
        mocked: data.mocked,
        modelUsed: data.modelUsed
      };

      const updatedIncidents = [newIncident, ...incidents];
      saveIncidents(updatedIncidents);
      setSelectedIncident(newIncident);
      setLogsInput("");
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setActiveView("detail");
        triggerToast("Incident Analysis Generated!", "success");
      }, 500);

    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      triggerToast(err.message || "An error occurred during analysis", "error");
      console.error(err);
    }
  };

  // Interactive AI Chat with logs context
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedIncident) return;

    const userMsg = {
      role: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedIncident = {
      ...selectedIncident,
      chatHistory: [...selectedIncident.chatHistory, userMsg]
    };

    // Update selected incident and list
    setSelectedIncident(updatedIncident);
    const updatedIncidentsList = incidents.map(inc => 
      inc.id === selectedIncident.id ? updatedIncident : inc
    );
    saveIncidents(updatedIncidentsList);

    setChatInput("");
    setIsChatting(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: selectedIncident.logs,
          messages: updatedIncident.chatHistory.map(h => ({ role: h.role, content: h.content })),
          apiKey: openaiKey,
          model: selectedModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chat failed");
      }

      const assistantMsg = {
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString()
      };

      const finalIncident = {
        ...updatedIncident,
        chatHistory: [...updatedIncident.chatHistory, assistantMsg]
      };

      setSelectedIncident(finalIncident);
      const finalIncidentsList = incidents.map(inc => 
        inc.id === selectedIncident.id ? finalIncident : inc
      );
      saveIncidents(finalIncidentsList);
      setIsChatting(false);

    } catch (err) {
      setIsChatting(false);
      triggerToast(err.message || "Failed to send message", "error");
      
      const errorMsg = {
        role: "assistant",
        content: `Error: Could not connect to AI engine. ${err.message}. Please check your connection or OpenAI API Key in Settings.`,
        timestamp: new Date().toLocaleTimeString()
      };

      const finalIncident = {
        ...updatedIncident,
        chatHistory: [...updatedIncident.chatHistory, errorMsg]
      };

      setSelectedIncident(finalIncident);
    }
  };

  // Toggle remediation actions checklist
  const handleToggleAction = (action) => {
    const isCompleted = selectedIncident.completedActions?.includes(action);
    const newCompleted = isCompleted
      ? selectedIncident.completedActions.filter(a => a !== action)
      : [...(selectedIncident.completedActions || []), action];

    const updatedIncident = {
      ...selectedIncident,
      completedActions: newCompleted
    };

    setSelectedIncident(updatedIncident);
    const updatedList = incidents.map(inc => 
      inc.id === selectedIncident.id ? updatedIncident : inc
    );
    saveIncidents(updatedList);
  };

  // Update incident status
  const handleUpdateStatus = (status) => {
    const updatedIncident = {
      ...selectedIncident,
      status: status
    };

    setSelectedIncident(updatedIncident);
    const updatedList = incidents.map(inc => 
      inc.id === selectedIncident.id ? updatedIncident : inc
    );
    saveIncidents(updatedList);
    triggerToast(`Incident status updated to ${status}`, "success");
  };

  // Delete incident from local storage
  const handleDeleteIncident = (incidentId) => {
    if (confirm("Are you sure you want to delete this incident from the system database?")) {
      const updatedList = incidents.filter(inc => inc.id !== incidentId);
      saveIncidents(updatedList);
      
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(null);
        setActiveView("dashboard");
      }
      
      triggerToast("Incident deleted successfully", "success");
    }
  };

  // Settings configuration save
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("sentinel_openai_key", openaiKey);
    localStorage.setItem("sentinel_model", selectedModel);
    triggerToast("Settings saved successfully!", "success");
  };

  const handleClearDatabase = () => {
    if (confirm("Reset application? All incidents will be reset to default presets.")) {
      localStorage.removeItem("sentinel_incidents");
      setIncidents(INITIAL_INCIDENTS);
      localStorage.setItem("sentinel_incidents", JSON.stringify(INITIAL_INCIDENTS));
      setSelectedIncident(null);
      setActiveView("dashboard");
      triggerToast("Database reset to defaults", "success");
    }
  };

  // Export PDF Report function
  const handleDownloadPDF = (incident) => {
    try {
      const doc = new jsPDF();
      
      // Page 1 Background styling
      doc.setFillColor(8, 12, 24); // dark slate/obsidian
      doc.rect(0, 0, 210, 297, "F");
      
      // Header Accent line
      doc.setFillColor(0, 240, 255); // Cyan
      doc.rect(0, 0, 210, 4, "F");
      
      // Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(0, 240, 255);
      doc.text("SPLUNK SENTINEL", 20, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("AI-POWERED CYBERSECURITY INCIDENT INVESTIGATION REPORT", 20, 32);
      
      // Metadata Grid Card Background
      doc.setFillColor(18, 25, 41); // slate-800
      doc.rect(15, 42, 180, 42, "F");
      
      // Metadata fields
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`Incident ID: ${incident.id}`, 22, 50);
      doc.text(`Severity: ${incident.severity.toUpperCase()}`, 115, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text(`Threat Category: ${incident.threatType}`, 22, 58);
      doc.text(`Timestamp: ${incident.timestamp}`, 115, 58);
      doc.text(`Current Status: ${incident.status}`, 22, 66);
      doc.text(`Analysis Engine: ${incident.modelUsed || "Sentinel Core"}`, 115, 66);

      const completionRate = incident.recommendedActions?.length 
        ? Math.round(((incident.completedActions?.length || 0) / incident.recommendedActions.length) * 100)
        : 0;
      doc.text(`Remediation Rate: ${completionRate}% completed`, 22, 74);
      
      // 1. Executive Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 240, 255);
      doc.text("1. Executive Summary", 15, 100);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225); // slate-300
      const summaryText = doc.splitTextToSize(incident.summary || "No executive summary provided.", 180);
      doc.text(summaryText, 15, 106);
      
      // 2. Root Cause Analysis
      let y = 106 + (summaryText.length * 5) + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 240, 255);
      doc.text("2. Technical Root Cause Analysis", 15, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      const rcText = doc.splitTextToSize(incident.rootCause || "No technical root cause description.", 180);
      doc.text(rcText, 15, y + 6);
      
      // 3. Indicators of Compromise
      y = y + 6 + (rcText.length * 5) + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 240, 255);
      doc.text("3. Key Indicators of Compromise (IOCs)", 15, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      
      doc.text(`Attacking IPs: ${incident.keyArtifacts?.sourceIps?.join(", ") || "None identified"}`, 20, y + 8);
      doc.text(`Affected Workstations/Servers: ${incident.keyArtifacts?.targetSystems?.join(", ") || "None identified"}`, 20, y + 14);
      doc.text(`Targeted Users/Accounts: ${incident.keyArtifacts?.affectedUsers?.join(", ") || "None identified"}`, 20, y + 20);
      doc.text(`Heuristic Signatures: ${incident.keyArtifacts?.signatures?.join(", ") || "None identified"}`, 20, y + 26);
      
      // Add Page 2
      doc.addPage();
      
      doc.setFillColor(8, 12, 24);
      doc.rect(0, 0, 210, 297, "F");
      doc.setFillColor(0, 240, 255);
      doc.rect(0, 0, 210, 4, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 240, 255);
      doc.text(`SPLUNK SENTINEL - INCIDENT RECORD ${incident.id}`, 15, 15);
      
      let y2 = 30;
      // 4. Remediation Plan
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 240, 255);
      doc.text("4. Incident Remediation Roadmap", 15, y2);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      
      let actionY = y2 + 8;
      if (incident.recommendedActions && incident.recommendedActions.length > 0) {
        incident.recommendedActions.forEach((action, idx) => {
          const completed = incident.completedActions?.includes(action) ? "[X]" : "[  ]";
          const actionLine = `${completed}  ${idx + 1}. ${action}`;
          const wrappedAction = doc.splitTextToSize(actionLine, 180);
          
          doc.text(wrappedAction, 15, actionY);
          actionY += (wrappedAction.length * 5) + 2;
        });
      } else {
        doc.text("No remediation checklist generated.", 15, actionY);
        actionY += 8;
      }
      
      // 5. Incident Timeline
      let timelineY = actionY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 240, 255);
      doc.text("5. Chronological Incident Timeline", 15, timelineY);
      
      let timeY = timelineY + 8;
      if (incident.timeline && incident.timeline.length > 0) {
        incident.timeline.forEach((event) => {
          const timeLabel = `[${event.time}] ${event.event}`;
          const detailLabel = `Details: ${event.details}`;
          const wrappedDetail = doc.splitTextToSize(detailLabel, 175);
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 240, 255);
          doc.text(timeLabel, 15, timeY);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(203, 213, 225);
          doc.text(wrappedDetail, 20, timeY + 5);
          
          timeY += 5 + (wrappedDetail.length * 5) + 3;
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(203, 213, 225);
        doc.text("No chronological timeline recorded in raw logs.", 15, timeY);
      }
      
      // Footer text on page 2
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("CLASSIFICATION: RESTRICTED SECURITY INTEL", 15, 280);
      doc.text("Generated via Splunk Sentinel Security Operations Center.", 115, 280);
      
      doc.save(`Splunk_Sentinel_Report_${incident.id}.pdf`);
      triggerToast(`PDF exported for incident: ${incident.id}`, "success");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to compile and export PDF report.", "error");
    }
  };

  // Stats calculation
  const totalCount = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === "critical").length;
  const activeCount = incidents.filter(i => i.status !== "Resolved").length;
  const resolvedCount = incidents.filter(i => i.status === "Resolved").length;

  // Severity style mapping helper
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red/30 shadow-red-glow">CRITICAL</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30">HIGH</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyber-green/20 text-cyber-green border border-cyber-green/30">LOW</span>;
    }
  };

  // Status style mapping helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "Resolved":
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyber-green/10 text-cyber-green border border-cyber-green/20">RESOLVED</span>;
      case "Investigating":
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 animate-pulse">INVESTIGATING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyber-gray/10 text-cyber-gray border border-cyber-gray/20">TRIAGE</span>;
    }
  };

  // Threat category breakdown map
  const threatTypeCount = {};
  incidents.forEach(inc => {
    const type = inc.threatType || "Other Anomalies";
    threatTypeCount[type] = (threatTypeCount[type] || 0) + 1;
  });

  return (
    <div className="min-h-screen flex flex-col bg-cyber-bg text-cyber-text cyber-grid relative font-sans">
      
      {/* Toast Alert popup */}
      {alertBanner && (
        <div className={`fixed bottom-4 right-4 z-[99999] p-4 rounded border font-mono text-sm flex items-center gap-3 shadow-lg transition-all duration-300 ${
          alertBanner.type === "success" 
            ? "bg-cyber-bg/95 border-cyber-green text-cyber-green shadow-green-glow" 
            : "bg-cyber-bg/95 border-cyber-red text-cyber-red shadow-red-glow"
        }`}>
          <div className={`w-2 h-2 rounded-full ${alertBanner.type === "success" ? "bg-cyber-green" : "bg-cyber-red"}`}></div>
          <span>{alertBanner.message}</span>
        </div>
      )}

      {/* Cyber Top bar */}
      <header className="border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveView("dashboard"); setSelectedIncident(null); }}>
          <div className="relative flex items-center justify-center w-10 h-10 border border-cyber-cyan rounded bg-cyber-cyan/15 shadow-cyan-glow">
            <ShieldAlert className="w-6 h-6 text-cyber-cyan" />
            <div className="absolute inset-0 border border-cyber-cyan/30 rounded animate-ping pointer-events-none"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wider text-white text-shadow-cyan flex items-center gap-1.5">
              SPLUNK <span className="text-cyber-cyan">SENTINEL</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[9px] font-mono text-cyber-gray tracking-widest uppercase">AI Incident Response Intelligence</p>
              <span className="text-[8px] font-mono px-1.5 py-0.5 border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan rounded">DESIGNED FOR SPLUNK MCP INTEGRATION</span>
            </div>
          </div>
        </div>

        {/* System telemetry dashboard */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse"></span>
            <span className="text-cyber-gray">HEURISTIC ENGINE:</span>
            <span className="text-cyber-green">ACTIVE</span>
          </div>
          <div className="flex items-center gap-2 border border-cyber-border px-2.5 py-1 rounded bg-black/40">
            <span className="text-cyber-gray">AI STATUS:</span>
            {openaiKey ? (
              <span className="text-cyber-green font-bold flex items-center gap-1 shadow-green-glow">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green inline-block animate-pulse"></span>
                OPENAI CONNECTED
              </span>
            ) : (
              <span className="text-yellow-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block animate-pulse"></span>
                MOCK MODE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyber-gray">CONNECTED INCIDENTS:</span>
            <span className="text-white font-bold">{totalCount}</span>
          </div>
        </div>

        {/* Demo Mode trigger */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-cyber-cyan border border-cyber-cyan/40 bg-cyber-cyan/10 rounded hover:bg-cyber-cyan/20 hover:shadow-cyan-glow transition-all">
              <Play className="w-3.5 h-3.5" />
              <span>LOAD DEMO INCIDENT</span>
            </button>
            <div className="absolute right-0 mt-2 w-56 rounded border border-cyber-border bg-cyber-card/95 shadow-xl hidden group-hover:block hover:block z-50 overflow-hidden">
              <div className="px-3 py-2 text-[10px] font-mono text-cyber-gray border-b border-cyber-border uppercase bg-cyber-bg/50">Select Threat Logs</div>
              <button onClick={() => { loadPreset("bruteForce"); setActiveView("analyzer"); }} className="w-full text-left px-4 py-2.5 text-xs font-mono hover:bg-cyber-cyan/10 hover:text-cyber-cyan border-b border-cyber-border/40 text-left transition-colors flex items-center justify-between">
                <span>SSH Brute Force</span>
                <span className="text-[10px] text-cyber-red bg-cyber-red/10 px-1 rounded">CRITICAL</span>
              </button>
              <button onClick={() => { loadPreset("sqlInjection"); setActiveView("analyzer"); }} className="w-full text-left px-4 py-2.5 text-xs font-mono hover:bg-cyber-cyan/10 hover:text-cyber-cyan border-b border-cyber-border/40 text-left transition-colors flex items-center justify-between">
                <span>Web SQL Injection</span>
                <span className="text-[10px] text-cyber-amber bg-cyber-amber/10 px-1 rounded">HIGH</span>
              </button>
              <button onClick={() => { loadPreset("privilegeEscalation"); setActiveView("analyzer"); }} className="w-full text-left px-4 py-2.5 text-xs font-mono hover:bg-cyber-cyan/10 hover:text-cyber-cyan border-b border-cyber-border/40 text-left transition-colors flex items-center justify-between">
                <span>Linux Privilege Escalation</span>
                <span className="text-[10px] text-cyber-amber bg-cyber-amber/10 px-1 rounded">HIGH</span>
              </button>
              <button onClick={() => { loadPreset("suspiciousAuth"); setActiveView("analyzer"); }} className="w-full text-left px-4 py-2.5 text-xs font-mono hover:bg-cyber-cyan/10 hover:text-cyber-cyan text-left transition-colors flex items-center justify-between">
                <span>Impossible Travel</span>
                <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1 rounded">MEDIUM</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row relative">

        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-cyber-border bg-cyber-card/40 flex flex-row md:flex-col p-4 gap-2 z-10">
          <div className="hidden md:block px-3 py-2 text-[10px] font-mono text-cyber-gray tracking-wider uppercase mb-2">SOC Navigation</div>
          
          <button 
            onClick={() => { setActiveView("dashboard"); setSelectedIncident(null); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "dashboard" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Dashboard</span>
          </button>
          
          <button 
            onClick={() => { setActiveView("analyzer"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "analyzer" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Log Analyzer</span>
          </button>

          <button 
            onClick={() => { setActiveView("history"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "history" || activeView === "detail"
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Incident History</span>
          </button>

          <button 
            onClick={() => { setActiveView("splunk-mcp"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "splunk-mcp" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">Splunk Integration</span>
          </button>

          <button 
            onClick={() => { setActiveView("settings"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "settings" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline md:inline">System Settings</span>
          </button>

          {/* Quick-Stats inside Sidebar on Desktop */}
          <div className="hidden md:flex flex-col mt-auto border-t border-cyber-border pt-4 gap-3">
            <div className="px-3 text-[10px] font-mono text-cyber-gray tracking-wider uppercase">Active Threat Status</div>
            <div className="flex items-center justify-between px-3 text-xs font-mono">
              <span className="text-cyber-red">Critical Issues:</span>
              <span className="font-bold text-white bg-cyber-red/10 px-1.5 py-0.5 rounded border border-cyber-red/25">{criticalCount}</span>
            </div>
            <div className="flex items-center justify-between px-3 text-xs font-mono">
              <span className="text-cyber-cyan">Investigating:</span>
              <span className="font-bold text-white bg-cyber-cyan/10 px-1.5 py-0.5 rounded border border-cyber-cyan/25">{activeCount}</span>
            </div>
            <div className="flex items-center justify-between px-3 text-xs font-mono">
              <span className="text-cyber-green">Closed Cases:</span>
              <span className="font-bold text-white bg-cyber-green/10 px-1.5 py-0.5 rounded border border-cyber-green/25">{resolvedCount}</span>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-6 relative overflow-y-auto max-w-full">
          
          {/* VIEW: DASHBOARD */}
          {activeView === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border/40 pb-4">
                <div>
                  <h2 className="text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-cyber-cyan" /> SECURITY OPERATION CENTER DASHBOARD
                  </h2>
                  <p className="text-xs text-cyber-gray mt-1">Real-time heuristics monitoring, threat statistics, and active investigations log.</p>
                </div>
                
                <button 
                  onClick={() => setActiveView("analyzer")}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold text-cyber-bg bg-cyber-cyan border border-cyber-cyan rounded hover:shadow-cyan-glow hover:bg-transparent hover:text-cyber-cyan transition-all"
                >
                  <Plus className="w-4 h-4" /> NEW INCIDENT SCAN
                </button>
              </div>

              {/* 4 Glowing Statistics Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-4 rounded border border-cyber-border bg-cyber-card relative overflow-hidden flex flex-col justify-between h-28 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyber-gray tracking-wider uppercase">Total Logs Scanned</span>
                    <Database className="w-4 h-4 text-cyber-gray" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black text-white">{totalCount}</span>
                    <span className="text-[10px] text-cyber-gray font-mono">records cached</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyber-green flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-green inline-block"></span>
                    Local Storage DB Connected
                  </div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyber-cyan/5 rounded-full filter blur-xl"></div>
                </div>

                <div className="p-4 rounded border border-cyber-red/40 bg-cyber-card relative overflow-hidden flex flex-col justify-between h-28 shadow-red-glow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyber-red tracking-wider uppercase">Critical Alerts</span>
                    <ShieldAlert className="w-4 h-4 text-cyber-red" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black text-cyber-red text-shadow-red">{criticalCount}</span>
                    <span className="text-[10px] text-cyber-red font-mono">active breaches</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyber-red/80">Requires immediate containment</div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyber-red/5 rounded-full filter blur-xl"></div>
                </div>

                <div className="p-4 rounded border border-cyber-cyan/40 bg-cyber-card relative overflow-hidden flex flex-col justify-between h-28 shadow-cyan-glow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyber-cyan tracking-wider uppercase">Active Threats</span>
                    <Activity className="w-4 h-4 text-cyber-cyan" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black text-cyber-cyan text-shadow-cyan">{activeCount}</span>
                    <span className="text-[10px] text-cyber-cyan font-mono">under investigation</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyber-cyan/80">Active sockets & forensic tasks</div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyber-cyan/5 rounded-full filter blur-xl"></div>
                </div>

                <div className="p-4 rounded border border-cyber-green/40 bg-cyber-card relative overflow-hidden flex flex-col justify-between h-28 shadow-green-glow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyber-green tracking-wider uppercase">Mitigated Incidents</span>
                    <CheckCircle className="w-4 h-4 text-cyber-green" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black text-cyber-green">{resolvedCount}</span>
                    <span className="text-[10px] text-cyber-green font-mono">cases closed</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyber-green/80">Remediation checklist applied</div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyber-green/5 rounded-full filter blur-xl"></div>
                </div>

              </div>

              {/* Threat Distribution Chart & Quick Logs Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Panel: Threat breakdown */}
                <div className="lg:col-span-1 p-5 rounded border border-cyber-border bg-cyber-card/60 flex flex-col gap-4">
                  <div className="border-b border-cyber-border/40 pb-2 flex items-center justify-between">
                    <h3 className="font-mono text-sm font-bold text-white tracking-wider">THREAT VECTOR BREAKDOWN</h3>
                    <Terminal className="w-4 h-4 text-cyber-cyan" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-4 py-2">
                    {Object.keys(threatTypeCount).length > 0 ? (
                      Object.entries(threatTypeCount).map(([type, count]) => {
                        const pct = Math.round((count / totalCount) * 100);
                        return (
                          <div key={type} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-300 truncate max-w-[80%]">{type}</span>
                              <span className="text-cyber-cyan font-bold">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-cyber-bg h-2 rounded overflow-hidden border border-cyber-border/60">
                              <div 
                                className="bg-cyber-cyan h-full rounded shadow-cyan-glow transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-cyber-gray font-mono">No threat vectors logged yet.</div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Recent Incidents List */}
                <div className="lg:col-span-2 p-5 rounded border border-cyber-border bg-cyber-card/60 flex flex-col gap-4">
                  <div className="border-b border-cyber-border/40 pb-2 flex items-center justify-between">
                    <h3 className="font-mono text-sm font-bold text-white tracking-wider">RECENT INCIDENT LOGS</h3>
                    <span className="text-[10px] font-mono text-cyber-gray">FORENSIC QUEUE</span>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    {incidents.length > 0 ? (
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-cyber-border/60 text-cyber-gray uppercase text-[10px]">
                            <th className="py-2.5">ID</th>
                            <th className="py-2.5">Threat Profile</th>
                            <th className="py-2.5">Severity</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5">Time Logged</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-border/40 text-slate-300">
                          {incidents.slice(0, 5).map(inc => (
                            <tr key={inc.id} className="hover:bg-cyber-card-light/30 transition-colors">
                              <td className="py-3 font-bold text-cyber-cyan">{inc.id}</td>
                              <td className="py-3 truncate max-w-[180px]" title={inc.title}>{inc.title}</td>
                              <td className="py-3">{getSeverityBadge(inc.severity)}</td>
                              <td className="py-3">{getStatusBadge(inc.status)}</td>
                              <td className="py-3 text-[11px] text-cyber-gray">{inc.timestamp}</td>
                              <td className="py-3 text-right">
                                <button 
                                  onClick={() => { setSelectedIncident(inc); setActiveView("detail"); }}
                                  className="px-2 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded hover:bg-cyber-cyan/20 transition-all cursor-pointer"
                                >
                                  Investigate
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-12 text-xs text-cyber-gray font-mono">
                        No incidents stored. Click &quot;Load Demo Incident&quot; or analyze fresh logs.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: LOG ANALYZER */}
          {activeView === "analyzer" && (
            <div className="space-y-6 animate-fadeIn">
              
              {!isAnalyzing ? (
                <>
                  <div className="border-b border-cyber-border/40 pb-4">
                    <h2 className="text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
                      <FileSearch className="w-6 h-6 text-cyber-cyan" /> COGNITIVE LOG ANALYZER
                    </h2>
                    <p className="text-xs text-cyber-gray mt-1">Upload raw network captures, server secure logs, database audit tables or auth logs for deep AI forensic analysis.</p>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="bg-cyber-card/30 p-4 rounded border border-cyber-border/60">
                    <p className="text-[10px] font-mono text-cyber-gray tracking-wider uppercase mb-2">Simulate Specific Attack Logs (Demo Mode)</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => loadPreset("bruteForce")} className="px-3 py-1.5 bg-cyber-red/10 border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/20 transition-all rounded text-xs font-mono">
                        SSH Brute Force
                      </button>
                      <button onClick={() => loadPreset("sqlInjection")} className="px-3 py-1.5 bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber hover:bg-cyber-amber/20 transition-all rounded text-xs font-mono">
                        Web SQL Injection
                      </button>
                      <button onClick={() => loadPreset("privilegeEscalation")} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all rounded text-xs font-mono">
                        Linux privilege escalation
                      </button>
                      <button onClick={() => loadPreset("suspiciousAuth")} className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 transition-all rounded text-xs font-mono">
                        Impossible Travel Auth
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left: Input Textarea */}
                    <div className="lg:col-span-2 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <Terminal className="w-4 h-4 text-cyber-cyan" /> PASTE RAW INCIDENT LOGS
                        </span>
                        {logsInput && (
                          <button onClick={() => setLogsInput("")} className="text-cyber-red hover:underline cursor-pointer">
                            Clear Editor
                          </button>
                        )}
                      </div>
                      
                      <textarea
                        value={logsInput}
                        onChange={(e) => setLogsInput(e.target.value)}
                        placeholder={`# Paste raw text events here. Example:\n\nJun 15 14:20:01 auth-srv-01 sshd[12450]: Failed password for invalid user admin from 198.51.100.42 port 49218 ssh2...`}
                        className="w-full h-96 p-4 rounded border border-cyber-border bg-cyber-bg text-cyber-cyan font-mono text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow resize-y leading-relaxed"
                      ></textarea>

                      <button
                        onClick={runAnalysis}
                        disabled={!logsInput.trim()}
                        className={`w-full py-4 text-sm font-mono font-bold border rounded flex items-center justify-center gap-2 transition-all tracking-wider ${
                          logsInput.trim() 
                            ? "bg-cyber-cyan text-cyber-bg border-cyber-cyan hover:shadow-cyan-glow hover:bg-transparent hover:text-cyber-cyan cursor-pointer"
                            : "bg-cyber-card border-cyber-border text-cyber-gray cursor-not-allowed"
                        }`}
                      >
                        <Play className="w-4 h-4" /> DEPLOY HEURISTICS & RUN AI ANALYSIS
                      </button>
                    </div>

                    {/* Right: File Upload Box */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                      <div className="text-xs font-mono text-white font-bold flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-cyber-cyan" /> OR UPLOAD LOG FILE
                      </div>

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 h-64 text-center transition-all ${
                          dragOver 
                            ? "border-cyber-cyan bg-cyber-cyan/10 shadow-cyan-glow" 
                            : "border-cyber-border bg-cyber-card hover:border-cyber-cyan/60"
                        }`}
                      >
                        <FileText className={`w-12 h-12 ${dragOver ? "text-cyber-cyan animate-bounce" : "text-cyber-gray"}`} />
                        <div className="space-y-1 font-mono">
                          <p className="text-xs text-white">Drag & drop raw log file here</p>
                          <p className="text-[10px] text-cyber-gray">Supports .log, .txt, .json, .csv</p>
                        </div>
                        <span className="text-[10px] font-mono text-cyber-gray">-- OR --</span>
                        <label className="px-4 py-2 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-bg rounded text-xs font-mono font-bold cursor-pointer transition-colors">
                          BROWSE FILES
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".txt,.log,.json,.csv"
                          />
                        </label>
                      </div>

                      {/* Info Panel */}
                      <div className="p-4 rounded border border-cyber-border bg-cyber-card/40 font-mono text-xs text-slate-400 space-y-3 leading-relaxed">
                        <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-2 text-white font-bold">
                          <Info className="w-4 h-4 text-cyber-cyan" />
                          <span>Forensic Scopes</span>
                        </div>
                        <p>Our cognitive engine will automatically trace chronologies, identify anomalies, tag compromised accounts, trace source IPs, and issue an executive threat severity rating.</p>
                        <p className="text-[10px] text-cyber-cyan">Ensure logs have timestamps for timeline correlation.</p>
                      </div>

                    </div>

                  </div>
                </>
              ) : (
                /* Scanning Screen overlay */
                <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto space-y-8 font-mono relative">
                  
                  {/* Radar Sweeping element */}
                  <div className="relative w-48 h-48 border border-cyber-cyan/30 rounded-full flex items-center justify-center bg-cyber-cyan/5 overflow-hidden">
                    <div className="absolute inset-0 border-2 border-dashed border-cyber-cyan/25 rounded-full animate-ping pointer-events-none"></div>
                    <div className="absolute inset-4 border border-cyber-cyan/20 rounded-full"></div>
                    <div className="absolute inset-12 border border-cyber-cyan/15 rounded-full"></div>
                    
                    {/* Sweep element */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyber-cyan/20 to-transparent rounded-full animate-sweep origin-center"></div>
                    
                    <ShieldAlert className="w-16 h-16 text-cyber-cyan animate-pulse z-10" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white text-shadow-cyan uppercase tracking-widest">Incident Scanners Deploying</h3>
                    <p className="text-xs text-cyber-cyan flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {analysisPhase}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-cyber-card border border-cyber-border p-1 rounded-full relative overflow-hidden h-8">
                    <div 
                      className="bg-cyber-cyan h-full rounded-full shadow-cyan-glow transition-all duration-300 flex items-center justify-end pr-3 text-[10px] text-cyber-bg font-bold"
                      style={{ width: `${analysisProgress}%` }}
                    >
                      {analysisProgress}%
                    </div>
                  </div>

                  {/* Mock scrolling log console */}
                  <div className="w-full bg-black/80 border border-cyber-border rounded p-4 h-48 overflow-hidden text-[10px] text-cyber-green leading-relaxed flex flex-col justify-end gap-1 shadow-inner relative">
                    <div className="absolute top-2 right-2 text-cyber-red/80 animate-pulse uppercase font-bold text-[8px] border border-cyber-red/20 px-1">Forensic Sandbox</div>
                    <div>[SYS_INIT] Loading forensic models... OK</div>
                    <div>[RESOLVE] Target namespace logs parsed. ({logsInput.split("\n").length} rows detected)</div>
                    <div>[PARSE] Executing regex timestamps mappings... done</div>
                    <div>[IP_REP] Validating source reputation networks...</div>
                    <div className="animate-pulse">[AI_CORE] Querying Sentinel OpenAI Threat Model...</div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-4 bg-cyber-green inline-block animate-blink"></span>
                      <span>Scanning in progress...</span>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* VIEW: INCIDENT HISTORY */}
          {activeView === "history" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border/40 pb-4">
                <div>
                  <h2 className="text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
                    <History className="w-6 h-6 text-cyber-cyan" /> COMPROMISE DATABASE RECORDS
                  </h2>
                  <p className="text-xs text-cyber-gray mt-1">Review, delete or reopen forensic cases in local storage.</p>
                </div>
                
                <button 
                  onClick={handleClearDatabase}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-cyber-red border border-cyber-red/40 bg-cyber-red/5 rounded hover:bg-cyber-red/15 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> FACTORY RESET DATABASE
                </button>
              </div>

              {/* Incidents Table */}
              <div className="border border-cyber-border bg-cyber-card/40 rounded p-4">
                {incidents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-cyber-border/60 text-cyber-gray uppercase text-[10px]">
                          <th className="py-3 px-2">ID</th>
                          <th className="py-3 px-2">Time Scanned</th>
                          <th className="py-3 px-2">Threat Vector Category</th>
                          <th className="py-3 px-2">Severity</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2">Intel Source</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/40 text-slate-300">
                        {incidents.map(inc => (
                          <tr key={inc.id} className="hover:bg-cyber-card-light/30 transition-colors">
                            <td className="py-4 px-2 font-bold text-cyber-cyan">{inc.id}</td>
                            <td className="py-4 px-2 text-cyber-gray">{inc.timestamp}</td>
                            <td className="py-4 px-2 font-bold max-w-[200px] truncate" title={inc.title}>{inc.title}</td>
                            <td className="py-4 px-2">{getSeverityBadge(inc.severity)}</td>
                            <td className="py-4 px-2">{getStatusBadge(inc.status)}</td>
                            <td className="py-4 px-2 text-[10px] text-cyber-cyan">{inc.mocked ? "Local Simulation" : "OpenAI Backend"}</td>
                            <td className="py-4 px-2 text-right space-x-2">
                              <button 
                                onClick={() => { setSelectedIncident(inc); setActiveView("detail"); }}
                                className="px-2.5 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded hover:bg-cyber-cyan/20 transition-all cursor-pointer"
                              >
                                View Forensic
                              </button>
                              <button 
                                onClick={() => handleDeleteIncident(inc.id)}
                                className="px-2 py-1 text-cyber-red/80 hover:text-cyber-red hover:bg-cyber-red/5 rounded transition-all cursor-pointer"
                                title="Delete incident record"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 text-xs text-cyber-gray font-mono space-y-4">
                    <p>Forensic database is clean. No active incident alerts cached.</p>
                    <button 
                      onClick={() => setActiveView("analyzer")}
                      className="px-4 py-2 border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-bg text-xs font-mono font-bold rounded"
                    >
                      Analyze raw logs
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW: SPLUNK MCP BRIDGE */}
          {activeView === "splunk-mcp" && (
            <div className="space-y-6 animate-fadeIn max-w-4xl">
              <div className="border-b border-cyber-border/40 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
                    <Database className="w-6 h-6 text-cyber-cyan" /> SPLUNK INTEGRATION
                  </h2>
                  <p className="text-xs text-cyber-gray mt-1 font-mono">
                    Connect Sentinel AI directly to your Splunk Indexes using the Model Context Protocol (MCP).
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 border border-cyber-green/30 bg-cyber-green/5 text-cyber-green rounded text-[9px] font-mono font-bold tracking-wider animate-pulse">
                    SPLUNK ENTERPRISE READY
                  </span>
                  <span className="px-2 py-1 border border-cyber-green/30 bg-cyber-green/5 text-cyber-green rounded text-[9px] font-mono font-bold tracking-wider animate-pulse">
                    SPLUNK CLOUD READY
                  </span>
                  <span className="px-2 py-1 border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan rounded text-[9px] font-mono font-bold tracking-wider">
                    DESIGNED FOR SPLUNK MCP
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Connection Parameters Form (7 cols) */}
                <form onSubmit={(e) => { e.preventDefault(); testMcpConnection(); }} className="lg:col-span-7 p-6 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                  <h3 className="text-sm font-mono font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2">
                    MCP Bridge Parameters
                  </h3>

                  <div className="space-y-2 font-mono text-xs">
                    <label className="text-white font-bold block">Splunk Enterprise Host URL</label>
                    <input
                      type="text"
                      value={splunkHost}
                      onChange={(e) => setSplunkHost(e.target.value)}
                      placeholder="https://splunk-prod.corp.local:8089"
                      className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan font-mono text-xs focus:outline-none focus:border-cyber-cyan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-white font-bold block">Auth Token (Bearer)</label>
                      <input
                        type="password"
                        value={splunkToken}
                        onChange={(e) => setSplunkToken(e.target.value)}
                        className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan font-mono text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-white font-bold block">Target Security Index</label>
                      <input
                        type="text"
                        value={splunkIndex}
                        onChange={(e) => setSplunkIndex(e.target.value)}
                        placeholder="security"
                        className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan font-mono text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={mcpStatus === "testing"}
                    className={`w-full py-3 text-xs font-mono font-bold border rounded transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                      mcpStatus === "testing"
                        ? "bg-cyber-card border-cyber-border text-cyber-gray cursor-not-allowed"
                        : "bg-cyber-cyan text-cyber-bg border-cyber-cyan hover:shadow-cyan-glow hover:bg-transparent hover:text-cyber-cyan"
                    }`}
                  >
                    {mcpStatus === "testing" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin animate-pulse" />
                        <span>VERIFYING CONNECTION SCHEMA...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>TEST SPLUNK MCP CONNECTION</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Console Log Logins (5 cols) */}
                <div className="lg:col-span-5 border border-cyber-border bg-black/80 rounded p-4 h-64 overflow-y-auto text-[10px] text-cyber-green font-mono leading-relaxed space-y-1 relative shadow-inner">
                  <div className="absolute top-2 right-2 text-cyber-cyan font-bold text-[8px] border border-cyber-cyan/35 px-1 py-0.5 rounded tracking-widest bg-cyber-cyan/10 uppercase animate-pulse">
                    MCP Bridge Console
                  </div>
                  {mcpLogs.length === 0 ? (
                    <div className="text-cyber-gray h-full flex flex-col justify-center items-center text-center">
                      <Terminal className="w-8 h-8 text-cyber-border mb-2" />
                      <span>Console idle. Click test to establish WebSocket.</span>
                    </div>
                  ) : (
                    mcpLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("Success") || log.includes("READY") ? "text-cyber-cyan" : ""}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Splunk Real-time Ingestion & Integration Roadmap */}
              <div className="p-6 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                <h3 className="text-sm font-mono font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyber-cyan" />
                  Real-time Ingestion & MCP Integration Roadmap
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
                  <div className="p-4 bg-cyber-bg/50 rounded border border-cyber-border/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-cyber-cyan font-bold block text-[11px] uppercase">1. Enterprise &amp; Cloud</span>
                      <p className="text-slate-400 text-[10px] leading-relaxed mt-1.5">
                        Native integrations for both Splunk Enterprise (on-prem) and Splunk Cloud REST endpoints, using token authorization.
                      </p>
                    </div>
                    <span className="text-[9px] text-cyber-green bg-cyber-green/10 px-1 rounded self-start mt-2 border border-cyber-green/20">SUPPORTED</span>
                  </div>

                  <div className="p-4 bg-cyber-bg/50 rounded border border-cyber-border/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-cyber-cyan font-bold block text-[11px] uppercase">2. Splunk MCP Link</span>
                      <p className="text-slate-400 text-[10px] leading-relaxed mt-1.5">
                        Uses Model Context Protocol JSON-RPC schemas over WebSockets to connect the Sentinel model to index schemas.
                      </p>
                    </div>
                    <span className="text-[9px] text-cyber-cyan bg-cyber-cyan/10 px-1 rounded self-start mt-2 border border-cyber-cyan/20">MCP VERSION 1.0</span>
                  </div>

                  <div className="p-4 bg-cyber-bg/50 rounded border border-cyber-border/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-cyber-cyan font-bold block text-[11px] uppercase">3. Real-Time Streaming</span>
                      <p className="text-slate-400 text-[10px] leading-relaxed mt-1.5">
                        Streams security alerts directly from the Splunk HTTP Event Collector (HEC) into the Sentinel priority triage queue.
                      </p>
                    </div>
                    <span className="text-[9px] text-cyber-cyan bg-cyber-cyan/10 px-1 rounded self-start mt-2 border border-cyber-cyan/20">ROADMAP</span>
                  </div>

                  <div className="p-4 bg-cyber-bg/50 rounded border border-cyber-border/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-cyber-cyan font-bold block text-[11px] uppercase">4. Agentic SecOps</span>
                      <p className="text-slate-400 text-[10px] leading-relaxed mt-1.5">
                        Deploys autonomous AI search agents to hunt for advanced persistent threats (APTs) using automated Splunk SPL queries.
                      </p>
                    </div>
                    <span className="text-[9px] text-cyber-cyan bg-cyber-cyan/10 px-1 rounded self-start mt-2 border border-cyber-cyan/20">ROADMAP</span>
                  </div>

                  <div className="p-4 bg-cyber-bg/50 rounded border border-cyber-border/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-cyber-cyan font-bold block text-[11px] uppercase">5. SOAR Playbooks</span>
                      <p className="text-slate-400 text-[10px] leading-relaxed mt-1.5">
                        Triggers Splunk Phantom / SOAR containment playbooks to automatically lock compromised user accounts and block IPs.
                      </p>
                    </div>
                    <span className="text-[9px] text-cyber-cyan bg-cyber-cyan/10 px-1 rounded self-start mt-2 border border-cyber-cyan/20">SOAR SYNC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SYSTEM SETTINGS */}
          {activeView === "settings" && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div className="border-b border-cyber-border/40 pb-4">
                <h2 className="text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
                  <Settings className="w-6 h-6 text-cyber-cyan" /> COGNITIVE CORE CONFIGURATION
                </h2>
                <p className="text-xs text-cyber-gray mt-1">Configure artificial intelligence backends, models, credentials and database operations.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 border border-cyber-border bg-cyber-card/40 rounded space-y-6">
                
                {/* OpenAI Key field */}
                <div className="space-y-2 font-mono">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyber-cyan" /> CUSTOM OPENAI API KEY
                  </label>
                  <p className="text-[10px] text-cyber-gray leading-relaxed">
                    By default, the platform pulls `OPENAI_API_KEY` from the server environment. Provide a custom key below to override this key securely in your browser cache.
                  </p>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-........................................"
                    className="w-full p-3 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan font-mono focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
                  />
                  {openaiKey && (
                    <button 
                      type="button" 
                      onClick={() => { setOpenaiKey(""); localStorage.removeItem("sentinel_openai_key"); triggerToast("Custom key cleared", "success"); }} 
                      className="text-[10px] text-cyber-red hover:underline block cursor-pointer"
                    >
                      Clear Saved Key Override
                    </button>
                  )}
                </div>

                {/* Model dropdown */}
                <div className="space-y-2 font-mono">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyber-cyan" /> LLM COGNITIVE MODEL SELECTOR
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-3 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan font-mono focus:outline-none focus:border-cyber-cyan"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Recommended - Fast & Cost-Effective)</option>
                    <option value="gpt-4o">gpt-4o (Premium - Deep Logical Reasoning)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-cyber-cyan text-cyber-bg border border-cyber-cyan font-mono font-bold text-xs rounded hover:bg-transparent hover:text-cyber-cyan hover:shadow-cyan-glow transition-all cursor-pointer"
                  >
                    SAVE CONFIGURATION
                  </button>

                  <button 
                    type="button" 
                    onClick={handleClearDatabase}
                    className="px-6 py-2.5 text-cyber-red border border-cyber-red/30 bg-cyber-red/5 rounded hover:bg-cyber-red/15 transition-all text-xs font-mono cursor-pointer"
                  >
                    RESET DATABASE TO DEFAULTS
                  </button>
                </div>

              </form>

              {/* Informational SOC Banner */}
              <div className="p-4 border border-cyber-cyan/20 bg-cyber-cyan/5 rounded text-xs font-mono leading-relaxed text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Info className="w-4 h-4 text-cyber-cyan" />
                  <span>Local Mock Mode Enabled by Default</span>
                </div>
                <p>
                  If no API key override is set in this settings block, and no `OPENAI_API_KEY` exists in the server environment variables, Splunk Sentinel will function in local simulation mode. This allows quick inspection of core timelines, dashboards, PDF downloads, and chatbot actions without requiring live API credits.
                </p>
              </div>

            </div>
          )}

          {/* VIEW: INCIDENT FORENSIC DETAIL VIEW & CHAT */}
          {activeView === "detail" && selectedIncident && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Back Bar & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setActiveView("history"); setSelectedIncident(null); }}
                    className="px-3 py-1.5 border border-cyber-border bg-cyber-card text-xs font-mono text-slate-400 hover:text-white rounded hover:bg-cyber-card-light transition-all cursor-pointer"
                  >
                    &larr; BACK TO RECORD LIST
                  </button>
                  <div>
                    <h2 className="text-xl font-bold font-mono text-white tracking-wide">
                      FORENSICS: <span className="text-cyber-cyan">{selectedIncident.id}</span>
                    </h2>
                    <p className="text-[10px] font-mono text-cyber-gray">SCANNED AT: {selectedIncident.timestamp} | CORE ENGINE: {selectedIncident.modelUsed || "Sentinel"}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={() => handleDownloadPDF(selectedIncident)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan rounded hover:bg-cyber-cyan/25 hover:shadow-cyan-glow transition-all text-xs font-mono cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> EXPORT PDF REPORT
                  </button>

                  <div className="flex border border-cyber-border rounded overflow-hidden">
                    <button 
                      onClick={() => handleUpdateStatus("Triage")} 
                      className={`px-3 py-1.5 text-xs font-mono transition-colors ${selectedIncident.status === "Triage" ? "bg-cyber-gray/20 text-white font-bold border-r border-cyber-border" : "text-cyber-gray hover:bg-cyber-card-light border-r border-cyber-border"}`}
                    >
                      Triage
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus("Investigating")} 
                      className={`px-3 py-1.5 text-xs font-mono transition-colors ${selectedIncident.status === "Investigating" ? "bg-cyber-cyan/20 text-cyber-cyan font-bold border-r border-cyber-border" : "text-cyber-gray hover:bg-cyber-card-light border-r border-cyber-border animate-pulse"}`}
                    >
                      Investigating
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus("Resolved")} 
                      className={`px-3 py-1.5 text-xs font-mono transition-colors ${selectedIncident.status === "Resolved" ? "bg-cyber-green/20 text-cyber-green font-bold" : "text-cyber-gray hover:bg-cyber-card-light"}`}
                    >
                      Resolved
                    </button>
                  </div>

                  <button 
                    onClick={() => handleDeleteIncident(selectedIncident.id)}
                    className="p-1.5 border border-cyber-red/30 bg-cyber-red/5 hover:bg-cyber-red/15 text-cyber-red rounded transition-all cursor-pointer"
                    title="Delete record from system"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedIncident.mocked && (
                <div className="p-2 text-center text-[10px] font-mono border border-yellow-500/20 bg-yellow-500/10 rounded text-yellow-500 flex items-center justify-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>DEMO MODE ACTIVE: Running local threat intelligence heuristics (OpenAI Key bypassed). Configure OpenAI key in settings for live analysis.</span>
                </div>
              )}

              {/* Forensic Details split grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT: Forensic analysis panels (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Executive Summary card */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-cyber-border/40 pb-2">
                      <h3 className="font-mono text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyber-cyan" /> 1. EXECUTIVE SUMMARY
                      </h3>
                      {getSeverityBadge(selectedIncident.severity)}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">{selectedIncident.summary}</p>
                    <div className="grid grid-cols-2 gap-4 pt-2 text-xs font-mono">
                      <div>
                        <span className="text-cyber-gray text-[10px] uppercase block">Threat Vector</span>
                        <span className="text-white font-bold">{selectedIncident.title}</span>
                      </div>
                      <div>
                        <span className="text-cyber-gray text-[10px] uppercase block">Scope Classification</span>
                        <span className="text-cyber-red font-bold uppercase">{selectedIncident.severity} Alert</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Root Cause */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-3">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyber-cyan" /> 2. TECHNICAL ROOT CAUSE ANALYSIS
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{selectedIncident.rootCause}</p>
                  </div>

                  {/* Indicators of Compromise (IOC) Cards */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-cyber-cyan" /> 3. FORENSIC ARTIFACTS & IOC CONTEXT
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="p-3 bg-cyber-bg/60 rounded border border-cyber-border/80 space-y-1.5">
                        <span className="text-[10px] font-mono text-cyber-red uppercase font-bold flex items-center gap-1">
                          <Network className="w-3 h-3" /> Attacking Source IPs
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedIncident.keyArtifacts?.sourceIps?.length > 0 ? (
                            selectedIncident.keyArtifacts.sourceIps.map(ip => (
                              <span key={ip} className="px-2 py-0.5 bg-black/40 border border-cyber-border rounded font-mono text-[10px] text-white">{ip}</span>
                            ))
                          ) : (
                            <span className="text-cyber-gray font-mono text-[10px]">None parsed</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-cyber-bg/60 rounded border border-cyber-border/80 space-y-1.5">
                        <span className="text-[10px] font-mono text-cyber-cyan uppercase font-bold flex items-center gap-1">
                          <Server className="w-3 h-3" /> Affected Assets
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedIncident.keyArtifacts?.targetSystems?.length > 0 ? (
                            selectedIncident.keyArtifacts.targetSystems.map(asset => (
                              <span key={asset} className="px-2 py-0.5 bg-black/40 border border-cyber-border rounded font-mono text-[10px] text-white">{asset}</span>
                            ))
                          ) : (
                            <span className="text-cyber-gray font-mono text-[10px]">None parsed</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-cyber-bg/60 rounded border border-cyber-border/80 space-y-1.5">
                        <span className="text-[10px] font-mono text-yellow-500 uppercase font-bold flex items-center gap-1">
                          <User className="w-3 h-3" /> Compromised Accounts
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedIncident.keyArtifacts?.affectedUsers?.length > 0 ? (
                            selectedIncident.keyArtifacts.affectedUsers.map(user => (
                              <span key={user} className="px-2 py-0.5 bg-black/40 border border-cyber-border rounded font-mono text-[10px] text-white">{user}</span>
                            ))
                          ) : (
                            <span className="text-cyber-gray font-mono text-[10px]">None parsed</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-cyber-bg/60 rounded border border-cyber-border/80 space-y-1.5">
                        <span className="text-[10px] font-mono text-cyber-green uppercase font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Signature Flags
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedIncident.keyArtifacts?.signatures?.length > 0 ? (
                            selectedIncident.keyArtifacts.signatures.map(sig => (
                              <span key={sig} className="px-2 py-0.5 bg-black/40 border border-cyber-border rounded font-mono text-[10px] text-white truncate max-w-full" title={sig}>{sig}</span>
                            ))
                          ) : (
                            <span className="text-cyber-gray font-mono text-[10px]">None parsed</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Incident Chronological Timeline */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-cyber-cyan" /> 4. INCIDENT TIMELINE CORRELATION
                    </h3>
                    
                    <div className="relative border-l border-cyber-border/80 pl-6 ml-2 space-y-6">
                      {selectedIncident.timeline && selectedIncident.timeline.length > 0 ? (
                        selectedIncident.timeline.map((event, idx) => (
                          <div key={idx} className="relative">
                            {/* Bullet dot */}
                            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-cyber-bg border border-cyber-cyan flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"></span>
                            </span>
                            
                            <div className="space-y-1 font-mono">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-cyber-cyan bg-cyber-cyan/10 px-1.5 py-0.5 rounded border border-cyber-cyan/25">{event.time}</span>
                                <span className="text-xs text-white font-bold">{event.event}</span>
                              </div>
                              <p className="text-[11px] text-slate-400">{event.details}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-cyber-gray font-mono pl-2">No timeline parsed.</p>
                      )}
                    </div>
                  </div>

                  {/* Containment Roadmap Checklist */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                    <div className="flex items-center justify-between border-b border-cyber-border/40 pb-2">
                      <h3 className="font-mono text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-cyber-cyan" /> 5. REMEDIATION & CONTAINMENT ROADMAP
                      </h3>
                      
                      {/* Completion rate math */}
                      <span className="text-xs font-mono font-bold text-cyber-cyan">
                        {selectedIncident.recommendedActions?.length 
                          ? Math.round(((selectedIncident.completedActions?.length || 0) / selectedIncident.recommendedActions.length) * 100) 
                          : 0}% Resolved
                      </span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full bg-cyber-bg h-1 rounded overflow-hidden">
                      <div 
                        className="bg-cyber-cyan h-full rounded shadow-cyan-glow transition-all"
                        style={{ 
                          width: `${selectedIncident.recommendedActions?.length 
                            ? ((selectedIncident.completedActions?.length || 0) / selectedIncident.recommendedActions.length) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>

                    <div className="space-y-2">
                      {selectedIncident.recommendedActions && selectedIncident.recommendedActions.length > 0 ? (
                        selectedIncident.recommendedActions.map((action, idx) => {
                          const isDone = selectedIncident.completedActions?.includes(action);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => handleToggleAction(action)}
                              className={`flex items-start gap-3 p-2.5 rounded border font-mono text-xs cursor-pointer transition-all ${
                                isDone 
                                  ? "bg-cyber-green/5 border-cyber-green/30 text-slate-400 line-through" 
                                  : "bg-cyber-bg border-cyber-border/80 text-white hover:border-cyber-cyan/50 hover:bg-cyber-card-light/20"
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${isDone ? "border-cyber-green bg-cyber-green/25 text-cyber-green" : "border-cyber-cyan/50"}`}>
                                {isDone && <CheckCircle className="w-3 h-3" />}
                              </div>
                              <span className="flex-1">{action}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-cyber-gray font-mono">No recommended actions logged.</p>
                      )}
                    </div>
                  </div>

                  {/* Raw Log payload review section */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-3">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2">
                      RAW SCAN RECORDED LOG PAYLOAD
                    </h3>
                    <pre className="p-4 bg-black/60 rounded border border-cyber-border text-[10px] text-cyan-500/80 font-mono overflow-x-auto max-h-60 leading-relaxed">
                      {selectedIncident.logs}
                    </pre>
                  </div>

                </div>

                {/* RIGHT: Sentinel AI Chat panel (5 cols) */}
                <div className="lg:col-span-5 border border-cyber-border bg-cyber-card/60 rounded flex flex-col h-[650px] sticky top-6 shadow-sm overflow-hidden">
                  
                  {/* Chat header */}
                  <div className="p-4 bg-cyber-bg/85 border-b border-cyber-border flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyber-cyan animate-pulse"></div>
                      <span className="text-xs font-bold text-white tracking-wider uppercase">SENTINEL CHAT COPROCESSOR</span>
                    </div>
                    <span className="text-[9px] text-cyber-gray font-mono">ENGINE: {openaiKey ? "OPENAI ANALYSIS" : "MOCK ENGINE"}</span>
                  </div>

                  {/* Prompt Quick Buttons */}
                  <div className="px-4 py-2 border-b border-cyber-border/40 bg-cyber-bg/40 flex gap-1.5 overflow-x-auto text-[9px] font-mono no-print">
                    <button 
                      onClick={() => setChatInput("Summarize all IP addresses in these logs.")}
                      className="px-2 py-1 bg-cyber-card border border-cyber-border text-slate-300 rounded hover:border-cyber-cyan/60 hover:text-cyber-cyan truncate whitespace-nowrap cursor-pointer"
                    >
                      Summarize IPs
                    </button>
                    <button 
                      onClick={() => setChatInput("Suggest specific command-line block rules.")}
                      className="px-2 py-1 bg-cyber-card border border-cyber-border text-slate-300 rounded hover:border-cyber-cyan/60 hover:text-cyber-cyan truncate whitespace-nowrap cursor-pointer"
                    >
                      Suggest Block Rules
                    </button>
                    <button 
                      onClick={() => setChatInput("Explain the privilege escalation vector.")}
                      className="px-2 py-1 bg-cyber-card border border-cyber-border text-slate-300 rounded hover:border-cyber-cyan/60 hover:text-cyber-cyan truncate whitespace-nowrap cursor-pointer"
                    >
                      Escalation Vector
                    </button>
                  </div>

                  {/* Dialogue screen */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                    
                    {selectedIncident.chatHistory?.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-[10px] ${
                          msg.role === "user" 
                            ? "bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan" 
                            : "bg-cyber-card border-cyber-border text-white shadow-cyan-glow"
                        }`}>
                          {msg.role === "user" ? "US" : "SE"}
                        </div>

                        {/* Content bubble */}
                        <div className={`p-3 rounded leading-relaxed border ${
                          msg.role === "user"
                            ? "bg-cyber-cyan/5 border-cyber-cyan/20 text-cyber-cyan"
                            : "bg-cyber-card-light/50 border-cyber-border/80 text-slate-200"
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-[8px] text-cyber-gray block text-right mt-1.5">{msg.timestamp}</span>
                        </div>
                      </div>
                    ))}

                    {/* Loader typing */}
                    {isChatting && (
                      <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-cyber-card border-cyber-border text-white animate-pulse">
                          SE
                        </div>
                        <div className="p-3 rounded border bg-cyber-card-light/40 border-cyber-border/60 text-cyber-cyan flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sentinel decoding event logs...</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef}></div>
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-cyber-bg/90 border-t border-cyber-border flex items-center gap-2 no-print">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask Sentinel a question about this incident..."
                      className="flex-1 p-2.5 bg-cyber-card border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isChatting}
                      className={`p-2.5 rounded border transition-colors flex items-center justify-center cursor-pointer ${
                        chatInput.trim() && !isChatting
                          ? "bg-cyber-cyan text-cyber-bg border-cyber-cyan hover:bg-transparent hover:text-cyber-cyan"
                          : "border-cyber-border bg-cyber-card text-cyber-gray cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                </div>

              </div>

            </div>
          )}

        </main>

      </div>

      {/* Footer System Telemetry info */}
      <footer className="border-t border-cyber-border py-3 px-6 bg-cyber-card/20 text-center font-mono text-[9px] text-cyber-gray flex flex-col md:flex-row items-center justify-between gap-2 z-10 no-print">
        <div>SPLUNK SENTINEL INCIDENT RESPONSE SYSTEM // RELEASE v4.1.0 // SOC HARDENED</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Server className="w-3 h-3 text-cyber-green" /> CLOUD MATRIX: ACTIVE</span>
          <span className="flex items-center gap-1.5"><Network className="w-3 h-3 text-cyber-cyan" /> DEPLOYMENT PORT: localhost:3000</span>
        </div>
      </footer>

    </div>
  );
}
