// src/app/page.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  RefreshCw,
  UserCheck,
  LogOut,
  Search,
  SlidersHorizontal,
  BookOpen,
  Clock
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from "recharts";
import { PRESETS } from "@/utils/presets";
import { jsPDF } from "jspdf";
import { 
  supabase, 
  isMockMode, 
  getSessionUser, 
  signOutUser, 
  getIncidents, 
  createIncident, 
  updateIncident, 
  deleteIncident, 
  getReports, 
  createReport, 
  getChats, 
  saveChat, 
  getAuditLogs, 
  createAuditLog 
} from "@/utils/supabaseClient";

// Severity Palette for Recharts Pie Chart
const SEVERITY_COLORS = {
  CRITICAL: "#f87171", // Light Red
  HIGH: "#fb923c",     // Orange
  MEDIUM: "#f59e0b",   // Amber
  LOW: "#38bdf8"       // Light Blue
};

// Generate unique incident IDs outside of component render scope
const generateIncidentId = () => {
  return `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export default function Home() {
  const router = useRouter();
  
  // Auth & Session States
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Layout View States
  const [activeView, setActiveView] = useState("dashboard");
  const [incidents, setIncidents] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Recharts Chart Telemetry State Arrays
  const [trendsData, setTrendsData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [resolutionData, setResolutionData] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  // Detailed State Management
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
  const [openaiKey, setOpenaiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  // Notifications
  const [alertBanner, setAlertBanner] = useState(null);

  // Create Incident Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncTitle, setNewIncTitle] = useState("");
  const [newIncSeverity, setNewIncSeverity] = useState("MEDIUM");
  const [newIncLogs, setNewIncLogs] = useState("");

  // Report Center Filters
  const [reportSearch, setReportSearch] = useState("");
  const [reportSeverityFilter, setReportSeverityFilter] = useState("ALL");
  const [reportAnalystFilter, setReportAnalystFilter] = useState("ALL");
  const [reportSort, setReportSort] = useState("desc");

  // Splunk HEC / Streaming Mock Config State
  const [splunkHost, setSplunkHost] = useState("https://splunk-mcp.corp.local:8089");
  const [splunkToken, setSplunkToken] = useState("••••••••••••••••••••");
  const [splunkIndex, setSplunkIndex] = useState("security");
  const [hecToken, setHecToken] = useState("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d");
  const [hecEnabled, setHecEnabled] = useState(false);
  const [mcpStatus, setMcpStatus] = useState("idle");
  const [mcpLogs, setMcpLogs] = useState([]);

  // Retrieve current database metrics
  const refreshTelemetry = async () => {
    const { data: incs } = await getIncidents();
    if (incs) setIncidents(incs);

    const { data: reps } = await getReports();
    if (reps) setReports(reps);

    const { data: logs } = await getAuditLogs();
    if (logs) setAuditLogs(logs);
  };

  // Load and check credentials/session on mount
  useEffect(() => {
    const session = getSessionUser();
    if (!session) {
      router.push("/login");
    } else {
      // Async state initialization to avoid synchronous cascading renders
      setTimeout(() => {
        setCurrentUser(session);
        setAuthLoading(false);
        
        if (typeof window !== "undefined") {
          setOpenaiKey(localStorage.getItem("sentinel_openai_key") || "");
          setSelectedModel(localStorage.getItem("sentinel_model") || "gpt-4o-mini");
        }

        refreshTelemetry();
        setIsMounted(true);
      }, 0);
    }
  }, [router]);

  // Reactive Recharts Data Computations (Asynchronous to avoid synchronous cascading render warnings)
  useEffect(() => {
    if (incidents.length === 0) return;

    // 1. Trends Data (Volume last 6 days)
    const dates = {};
    const nowMs = Date.now();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(nowMs - 3600000 * 24 * i).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      dates[d] = 0;
    }
    incidents.forEach(inc => {
      const dStr = new Date(inc.created_at || inc.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (dates[dStr] !== undefined) {
        dates[dStr]++;
      }
    });

    // 2. Severity Data
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    incidents.forEach(inc => {
      const sev = String(inc.severity || "MEDIUM").toUpperCase();
      if (counts[sev] !== undefined) counts[sev]++;
    });
    const total = incidents.length || 1;

    // 3. Resolution Data
    let resolved = 0;
    let active = 0;
    incidents.forEach(inc => {
      if (inc.status === "Resolved") {
        resolved++;
      } else {
        active++;
      }
    });

    // 4. Workload Data
    const analysts = {};
    incidents.forEach(inc => {
      const analyst = inc.assigned_analyst || "Unassigned";
      analysts[analyst] = (analysts[analyst] || 0) + 1;
    });

    // 5. Threat Categories
    const cats = {};
    incidents.forEach(inc => {
      const cat = inc.threatType || "Other Alerts";
      cats[cat] = (cats[cat] || 0) + 1;
    });

    // Dispatch states asynchronously in a macro-task
    setTimeout(() => {
      setTrendsData(Object.entries(dates).map(([date, count]) => ({ date, count })));
      
      setSeverityData(Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100)
      })));
      
      setResolutionData([
        { name: "Resolved", count: resolved },
        { name: "Active", count: active }
      ]);
      
      setWorkloadData(Object.entries(analysts).map(([name, count]) => ({ name, count })));
      
      setCategoryData(Object.entries(cats).map(([name, count]) => ({ name, count })).slice(0, 5));
    }, 0);
  }, [incidents]);

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

  // Log Analyst Activity
  const logSOCActivity = async (actionText, incidentId = null) => {
    if (currentUser) {
      await createAuditLog(currentUser.full_name, currentUser.role, actionText, incidentId);
      const { data: logs } = await getAuditLogs();
      if (logs) setAuditLogs(logs);
    }
  };

  const handleLogout = async () => {
    await logSOCActivity(`${currentUser?.full_name} logged out from the SOC terminal`);
    await signOutUser();
    router.push("/login");
  };

  // Incident Lifecycle Operations
  const handleCreateManualIncident = async (e) => {
    e.preventDefault();
    if (!newIncTitle || !newIncLogs) return;

    if (currentUser?.role === "Viewer") {
      triggerToast("Viewer profile restricted from creating incidents", "error");
      return;
    }

    const incId = generateIncidentId();
    const newIncident = {
      id: incId,
      title: newIncTitle,
      severity: newIncSeverity,
      status: "Open",
      threatType: "Manual SOC Log Entry",
      raw_logs: newIncLogs,
      summary: "Manual incident entry logged by analyst.",
      rootCause: "Awaiting analyst investigation.",
      remediation_plan: "Review logs, cross-examine triggers, and document results.",
      assigned_analyst: currentUser?.full_name,
      timeline: [{ time: new Date().toLocaleTimeString(), event: "Case Opened", details: "Manual incident created in database." }],
      recommendedActions: ["Isolate target systems", "Verify access tokens", "Review firewall logging parameters"],
      completedActions: [],
      chatHistory: [{ role: "assistant", content: `Incident ${incId} logged. Please upload source logs or converse with me to build containment checklists.`, timestamp: new Date().toLocaleTimeString() }],
      mocked: true,
      modelUsed: "MOCK ENGINE"
    };

    const { data, error } = await createIncident(newIncident);
    if (error) {
      triggerToast("Failed to write to database", "error");
    } else {
      triggerToast(`Incident ${incId} successfully persisted`, "success");
      await logSOCActivity(`${currentUser?.full_name} manually created incident ${incId}`, incId);
      setShowCreateModal(false);
      setNewIncTitle("");
      setNewIncLogs("");
      refreshTelemetry();
    }
  };

  const handleUpdateStatus = async (statusVal) => {
    if (!selectedIncident) return;
    if (currentUser?.role === "Viewer") {
      triggerToast("Viewer profile restricted from editing incidents", "error");
      return;
    }

    const { data, error } = await updateIncident(selectedIncident.id, { status: statusVal });
    if (error) {
      triggerToast("Status database update failed", "error");
    } else {
      setSelectedIncident(data);
      triggerToast(`Incident status updated to ${statusVal}`, "success");
      await logSOCActivity(`${currentUser?.full_name} updated status of ${selectedIncident.id} to ${statusVal}`, selectedIncident.id);
      refreshTelemetry();
    }
  };

  const handleUpdateAssignment = async (analystName) => {
    if (!selectedIncident) return;
    if (currentUser?.role === "Viewer") {
      triggerToast("Viewer profile restricted from assigning incidents", "error");
      return;
    }

    const { data, error } = await updateIncident(selectedIncident.id, { assigned_analyst: analystName });
    if (error) {
      triggerToast("Assignment database update failed", "error");
    } else {
      setSelectedIncident(data);
      triggerToast(`Incident assigned to ${analystName}`, "success");
      await logSOCActivity(`${currentUser?.full_name} assigned ${selectedIncident.id} to ${analystName}`, selectedIncident.id);
      refreshTelemetry();
    }
  };

  const handleDeleteRecord = async (incId) => {
    if (currentUser?.role !== "Admin") {
      triggerToast("Access Denied: Only Admin role can delete incident records", "error");
      return;
    }

    const { success, error } = await deleteIncident(incId);
    if (error) {
      triggerToast("Database deletion failed", "error");
    } else {
      triggerToast(`Incident ${incId} permanently deleted`, "success");
      await logSOCActivity(`${currentUser?.full_name} deleted incident record ${incId}`);
      if (selectedIncident?.id === incId) {
        setSelectedIncident(null);
        setActiveView("history");
      }
      refreshTelemetry();
    }
  };

  // Run AI analysis pipeline
  const runAnalysis = async () => {
    if (!logsInput.trim()) return;
    if (currentUser?.role === "Viewer") {
      triggerToast("Viewer role restricted from scanning logs", "error");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisPhase("Decompressing payload namespaces...");

    const intervals = [
      { p: 25, t: "Extracting log timelines & headers...", d: 600 },
      { p: 55, t: "Comparing source IPs reputation vectors...", d: 1200 },
      { p: 80, t: "Querying Sentinel AI threat models...", d: 1800 },
      { p: 95, t: "Correlating remediation checklists...", d: 2400 }
    ];

    intervals.forEach(step => {
      setTimeout(() => {
        setAnalysisProgress(step.p);
        setAnalysisPhase(step.t);
      }, step.d);
    });

    setTimeout(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logs: logsInput,
            apiKey: openaiKey,
            model: selectedModel
          })
        });

        const data = await res.json();

        if (data.error) {
          triggerToast(data.error, "error");
          setIsAnalyzing(false);
          return;
        }

        const formattedIncident = {
          id: generateIncidentId(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          title: data.threatType || "Unclassified Threat Alert",
          severity: data.severity || "MEDIUM",
          status: "Open",
          threatType: data.threatType || "Anomalous Logs Capture",
          rootCause: data.rootCause || "Analysis completed.",
          summary: data.summary || "No description compiled.",
          keyArtifacts: data.keyArtifacts || { sourceIps: [], targetSystems: [], affectedUsers: [], signatures: [] },
          recommendedActions: data.recommendedActions || [],
          completedActions: [],
          timeline: data.timeline || [],
          logs: logsInput,
          chatHistory: [
            { role: "assistant", content: `Hello! I have completed analyzing report logs for this ${data.threatType || 'threat'}. Ask me anything to assist in mitigation.`, timestamp: new Date().toLocaleTimeString() }
          ],
          mocked: data.mocked,
          modelUsed: data.modelUsed
        };

        const { data: dbData, error } = await createIncident(formattedIncident);
        if (error) {
          triggerToast("Failed to save incident to database", "error");
        } else {
          setLogsInput("");
          setSelectedIncident(dbData);
          setActiveView("detail");
          triggerToast("Log analysis complete!", "success");
          await logSOCActivity(`${currentUser?.full_name} analyzed raw logs and generated incident ${dbData.id}`, dbData.id);
          refreshTelemetry();
        }
      } catch (err) {
        console.error(err);
        triggerToast("Failed to compile analysis payloads", "error");
      } finally {
        setIsAnalyzing(false);
      }
    }, 3200);
  };

  // Coprocessor chat submission
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedIncident) return;

    if (currentUser?.role === "Viewer") {
      triggerToast("Viewer profile restricted from chatting with logs", "error");
      return;
    }

    const userMsg = { role: "user", content: chatInput, timestamp: new Date().toLocaleTimeString() };
    const updatedHistory = [...(selectedIncident.chatHistory || []), userMsg];
    
    // Optimistic UI update
    const updatedIncident = { ...selectedIncident, chatHistory: updatedHistory };
    setSelectedIncident(updatedIncident);
    setChatInput("");
    setIsChatting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: selectedIncident.logs || "",
          messages: updatedHistory,
          apiKey: openaiKey,
          model: selectedModel
        })
      });

      const reply = await res.json();
      
      const assistantMsg = { 
        role: "assistant", 
        content: reply.content || "Sentinel completed query mapping successfully.",
        timestamp: new Date().toLocaleTimeString() 
      };

      const finalHistory = [...updatedHistory, assistantMsg];
      
      // Save Chat to DB
      const { data: savedDbInc } = await updateIncident(selectedIncident.id, { chatHistory: finalHistory });
      await saveChat(selectedIncident.id, currentUser.full_name, finalHistory);

      if (savedDbInc) {
        setSelectedIncident(savedDbInc);
      } else {
        setSelectedIncident({ ...selectedIncident, chatHistory: finalHistory });
      }
      
      await logSOCActivity(`${currentUser?.full_name} queried Sentinel Chat regarding ${selectedIncident.id}`, selectedIncident.id);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to get chat response", "error");
    } finally {
      setIsChatting(false);
    }
  };

  // Quick Chat Actions
  const triggerQuickChat = (promptText) => {
    setChatInput(promptText);
  };

  // Containment Checklist Action toggler
  const handleToggleAction = async (action) => {
    if (!selectedIncident) return;
    if (currentUser?.role === "Viewer") {
      triggerToast("Viewer profile restricted from altering containment playbooks", "error");
      return;
    }

    const completed = selectedIncident.completedActions || [];
    let updatedCompleted;

    if (completed.includes(action)) {
      updatedCompleted = completed.filter(a => a !== action);
    } else {
      updatedCompleted = [...completed, action];
    }

    const { data, error } = await updateIncident(selectedIncident.id, { completedActions: updatedCompleted });
    if (error) {
      triggerToast("Checklist database sync failed", "error");
    } else {
      setSelectedIncident(data);
      triggerToast(completed.includes(action) ? "Containment item unchecked" : "Containment item verified", "success");
      await logSOCActivity(`${currentUser?.full_name} verified remediation checklist item for ${selectedIncident.id}`, selectedIncident.id);
      refreshTelemetry();
    }
  };

  // Compile PDF Report
  const handleDownloadPDF = async (incident) => {
    try {
      const doc = new jsPDF();
      
      // Page 1 Background
      doc.setFillColor(8, 12, 24); // slate-950
      doc.rect(0, 0, 210, 297, "F");
      
      // Top header glow line
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
      doc.text(`Severity: ${(incident.severity || "MEDIUM").toUpperCase()}`, 115, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text(`Threat Category: ${incident.threatType}`, 22, 58);
      doc.text(`Timestamp: ${incident.created_at || incident.timestamp}`, 115, 58);
      doc.text(`Current Status: ${incident.status}`, 22, 66);
      doc.text(`Assigned Owner: ${incident.assigned_analyst || "Unassigned"}`, 115, 66);

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
      doc.text(`Generated by analyst ${currentUser?.full_name}`, 115, 280);
      
      // Trigger download
      doc.save(`Splunk_Sentinel_Report_${incident.id}.pdf`);
      triggerToast(`PDF exported for incident: ${incident.id}`, "success");

      // Save report record log to Supabase
      const newReportData = {
        incident_id: incident.id,
        name: `Forensic Report - ${incident.title}`,
        pdf_size_bytes: 48000 + Math.floor(Math.random() * 20000),
        generated_by: currentUser?.full_name
      };
      await createReport(newReportData);
      await logSOCActivity(`${currentUser?.full_name} generated and downloaded PDF report for ${incident.id}`, incident.id);
      refreshTelemetry();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to compile and export PDF report.", "error");
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (currentUser?.role === "Viewer") {
      triggerToast("Viewer profile restricted from saving core settings", "error");
      return;
    }
    localStorage.setItem("sentinel_openai_key", openaiKey);
    localStorage.setItem("sentinel_model", selectedModel);
    triggerToast("Core settings saved locally", "success");
    logSOCActivity(`${currentUser?.full_name} updated LLM settings models to ${selectedModel}`);
  };

  const loadPreset = (presetKey) => {
    const prs = PRESETS[presetKey];
    if (prs) {
      setLogsInput(prs.logs);
      triggerToast(`Preset '${presetKey}' loaded. Ready for analysis.`, "success");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogsInput(event.target.result);
        triggerToast(`Successfully loaded file: ${file.name}`, "success");
      };
      reader.readAsText(file);
    }
  };

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
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogsInput(event.target.result);
        triggerToast(`Successfully loaded file: ${file.name}`, "success");
      };
      reader.readAsText(file);
    }
  };

  // Search & Filtered Reports for Report Center
  const getFilteredReports = () => {
    return reports
      .filter(rep => {
        const matchesSearch = rep.incident_id.toLowerCase().includes(reportSearch.toLowerCase()) || 
                             rep.name.toLowerCase().includes(reportSearch.toLowerCase());
        const matchesAnalyst = reportAnalystFilter === "ALL" || rep.generated_by === reportAnalystFilter;
        
        // Match severity by joining back to incidents table
        const matchingInc = incidents.find(inc => inc.id === rep.incident_id);
        const matchesSeverity = reportSeverityFilter === "ALL" || 
                               (matchingInc && matchingInc.severity.toUpperCase() === reportSeverityFilter);

        return matchesSearch && matchesAnalyst && matchesSeverity;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return reportSort === "desc" ? dateB - dateA : dateA - dateB;
      });
  };

  // Get active status badge color
  const getSeverityBadge = (sev) => {
    const colors = {
      critical: "bg-cyber-red/10 border-cyber-red/30 text-cyber-red",
      high: "bg-cyber-amber/10 border-cyber-amber/30 text-cyber-amber",
      medium: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
      low: "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan"
    };
    const s = String(sev).toLowerCase();
    return (
      <span className={`px-2 py-0.5 border rounded text-[10px] font-mono font-bold uppercase tracking-wider ${colors[s] || "border-slate-400 text-slate-400"}`}>
        {sev}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      Open: "border-cyber-gray text-cyber-gray bg-cyber-card-light/20",
      Investigating: "border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10 animate-pulse",
      Contained: "border-purple-400 text-purple-400 bg-purple-400/10",
      Resolved: "border-cyber-green text-cyber-green bg-cyber-green/10"
    };
    return (
      <span className={`px-2 py-0.5 border rounded text-[10px] font-mono font-bold tracking-wider ${colors[status] || "border-slate-400 text-slate-400"}`}>
        {status}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center font-mono text-cyber-cyan text-xs">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin filter drop-shadow-[0_0_8px_#00f0ff]" />
          <span>AUTHENTICATING SOC CREDENTIALS...</span>
        </div>
      </div>
    );
  }

  // Pre-calculated Dashboard Counts
  const criticalCount = incidents.filter(inc => String(inc.severity).toLowerCase() === "critical").length;
  const activeCount = incidents.filter(inc => inc.status !== "Resolved").length;
  const resolvedCount = incidents.filter(inc => inc.status === "Resolved").length;
  const mitigationRate = incidents.length ? Math.round((resolvedCount / incidents.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-300 flex flex-col font-mono relative overflow-hidden select-none">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff03_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Temporal Toast Banner */}
      {alertBanner && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded border text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-md transition-all duration-300 animate-slideIn ${
          alertBanner.type === "success" 
            ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green shadow-green-glow" 
            : "bg-cyber-red/10 border-cyber-red/40 text-cyber-red shadow-red-glow"
        }`}>
          <ShieldAlert className="w-4 h-4" />
          <span>{alertBanner.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="border-b border-cyber-border bg-cyber-card/60 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-cyber-cyan/30 bg-cyber-cyan/5 rounded-lg shadow-cyan-glow">
            <ShieldAlert className="w-5 h-5 text-cyber-cyan animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white flex items-center gap-2">
              SPLUNK <span className="text-cyber-cyan">SENTINEL</span>
            </h1>
            <p className="text-[9px] text-cyber-gray tracking-wider uppercase mt-0.5">
              AI-Powered Incident Response Copilot
            </p>
          </div>
        </div>

        {/* Global Live Badges */}
        <div className="flex flex-wrap items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-cyber-green/20 bg-cyber-green/5 text-cyber-green rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-ping"></span>
            <span className="font-bold uppercase text-[9px]">HEURISTIC ENGINE: ACTIVE</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded ${
            openaiKey || !isMockMode()
              ? "border-cyber-green/20 bg-cyber-green/5 text-cyber-green"
              : "border-yellow-500/20 bg-yellow-500/5 text-yellow-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${openaiKey || !isMockMode() ? "bg-cyber-green" : "bg-yellow-500 animate-pulse"}`}></span>
            <span className="font-bold uppercase text-[9px]">{openaiKey || !isMockMode() ? "OPENAI CONNECTED" : "AI ENGINE: MOCK MODE"}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (currentUser?.role === "Viewer") {
                  triggerToast("Viewer profile restricted from creating incidents", "error");
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="px-3 py-1 bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan rounded hover:bg-cyber-cyan hover:text-cyber-bg text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1 uppercase"
            >
              <Plus className="w-3 h-3" /> New Incident
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row relative">

        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-cyber-border bg-cyber-card/40 flex flex-row md:flex-col p-4 gap-2 z-10 overflow-x-auto md:overflow-x-visible whitespace-nowrap md:whitespace-normal scrollbar-none flex-shrink-0">
          <div className="hidden md:block px-3 py-2 text-[10px] font-mono text-cyber-gray tracking-wider uppercase mb-2">SOC Navigation</div>
          
          <button 
            onClick={() => { setActiveView("dashboard"); setSelectedIncident(null); }}
            className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "dashboard" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>DASHBOARD</span>
          </button>
          
          <button 
            onClick={() => { setActiveView("analyzer"); }}
            className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "analyzer" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span>LOG ANALYZER</span>
          </button>

          <button 
            onClick={() => { setActiveView("history"); }}
            className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "history" || activeView === "detail"
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <History className="w-4 h-4" />
            <span>INCIDENT HISTORY</span>
          </button>

          <button 
            onClick={() => { setActiveView("reports"); }}
            className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "reports" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>REPORT CENTER</span>
          </button>

          <button 
            onClick={() => { setActiveView("splunk-mcp"); }}
            className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "splunk-mcp" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>SPLUNK INTEGRATION</span>
          </button>

          <button 
            onClick={() => { setActiveView("settings"); }}
            className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded text-xs font-mono transition-all border ${
              activeView === "settings" 
                ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-cyber-card-light/50"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>SYSTEM SETTINGS</span>
          </button>

          {/* User profile & Logout Box */}
          {currentUser && (
            <div className="hidden md:flex flex-col mt-auto border-t border-cyber-border pt-4 gap-3">
              <div className="px-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/5 flex items-center justify-center text-cyber-cyan text-xs font-bold font-mono">
                  {currentUser.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{currentUser.full_name}</div>
                  <div className={`text-[8px] font-bold uppercase inline-block border px-1 rounded ${
                    currentUser.role === 'Admin' ? 'border-cyber-red/40 bg-cyber-red/5 text-cyber-red' :
                    currentUser.role === 'Security Analyst' ? 'border-cyber-cyan/40 bg-cyber-cyan/5 text-cyber-cyan' :
                    'border-slate-500 bg-slate-500/5 text-slate-400'
                  }`}>
                    {currentUser.role}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-cyber-red/10 border border-cyber-red/30 hover:bg-cyber-red/20 text-cyber-red rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> LOG OUT TERMINAL
              </button>
            </div>
          )}
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 p-6 overflow-y-auto z-10">

          {/* VIEW: DASHBOARD */}
          {activeView === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Row 1: Header */}
              <div className="border-b border-cyber-border/40 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-cyber-cyan" /> SECURITY OPERATIONS CENTER DASHBOARD
                  </h2>
                  <p className="text-xs text-cyber-gray mt-1">Real-time database analytics, active investigation logs, and workload metrics.</p>
                </div>
                <div className="text-xs text-cyber-gray font-mono">
                  ACTIVE DEPLOYMENT PORT: <span className="text-cyber-cyan">localhost:3000</span>
                </div>
              </div>

              {/* Row 2: Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-4 border border-cyber-border bg-cyber-card/40 rounded flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[10px] text-cyber-gray font-mono tracking-wider uppercase block">Total Scanned Events</span>
                    <span className="text-3xl font-bold text-white font-mono">{incidents.length}</span>
                    <span className="text-[9px] text-cyber-cyan font-mono block">Persistent DB Sync Active</span>
                  </div>
                  <Database className="w-10 h-10 text-cyber-cyan/15 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>

                <div className="p-4 border border-cyber-border bg-cyber-card/40 rounded flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[10px] text-cyber-gray font-mono tracking-wider uppercase block">Critical Alerts</span>
                    <span className="text-3xl font-bold text-cyber-red font-mono">{criticalCount}</span>
                    <span className="text-[9px] text-cyber-red font-mono block">Requires Immediate Triage</span>
                  </div>
                  <ShieldAlert className="w-10 h-10 text-cyber-red/15 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>

                <div className="p-4 border border-cyber-border bg-cyber-card/40 rounded flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[10px] text-cyber-gray font-mono tracking-wider uppercase block">Active Investigations</span>
                    <span className="text-3xl font-bold text-cyber-cyan font-mono">{activeCount}</span>
                    <span className="text-[9px] text-cyber-cyan font-mono block">Under Containment Operations</span>
                  </div>
                  <Activity className="w-10 h-10 text-cyber-cyan/15 absolute right-4 top-1/2 -translate-y-1/2 animate-pulse" />
                </div>

                <div className="p-4 border border-cyber-border bg-cyber-card/40 rounded flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[10px] text-cyber-gray font-mono tracking-wider uppercase block">Mitigation Rate</span>
                    <span className="text-3xl font-bold text-cyber-green font-mono">{mitigationRate}%</span>
                    <span className="text-[9px] text-cyber-green font-mono block">{resolvedCount} Cases Contained</span>
                  </div>
                  <CheckCircle className="w-10 h-10 text-cyber-green/15 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>

              </div>

              {/* Row 3: Recharts Analytics */}
              {isMounted && incidents.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Incident Trends */}
                  <div className="lg:col-span-2 p-5 border border-cyber-border bg-cyber-card/40 rounded flex flex-col h-80">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider mb-4 uppercase flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyber-cyan" /> Incident Volume Trends (Last 6 Days)
                    </h3>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendsData}>
                          <defs>
                            <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                          <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#fff', fontSize: 10, fontFamily: 'monospace' }} />
                          <Area type="monotone" dataKey="count" stroke="#00f0ff" fillOpacity={1} fill="url(#colorIncidents)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Severity Distribution */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded flex flex-col h-80">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider mb-4 uppercase flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-cyber-red" /> Severity Spread
                    </h3>
                    <div className="flex-1 w-full flex flex-col items-center justify-center">
                      <div className="w-full h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={severityData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={50}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {severityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#64748b'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#fff', fontSize: 10, fontFamily: 'monospace' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full grid grid-cols-2 gap-2 mt-4 font-mono text-[9px]">
                        {severityData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SEVERITY_COLORS[entry.name] }}></span>
                            <span className="text-cyber-gray truncate">{entry.name}:</span>
                            <span className="text-white font-bold">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Row 4: Side-by-Side (Workloads & Threat Categories & Resolutions) */}
              {isMounted && incidents.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Resolution Rates (BarChart) */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded flex flex-col h-80">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider mb-4 uppercase flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-cyber-green" /> Resolution Efficiency
                    </h3>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={resolutionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                          <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#fff', fontSize: 10, fontFamily: 'monospace' }} />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                            {resolutionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === 'Resolved' ? '#10b981' : '#fb923c'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Workload distributions (BarChart) */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded flex flex-col h-80">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider mb-4 uppercase flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-cyber-cyan" /> Analyst Workloads
                    </h3>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} width={80} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#fff', fontSize: 10, fontFamily: 'monospace' }} />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Threat Categories (BarChart) */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded flex flex-col h-80">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider mb-4 uppercase flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-cyber-cyan" /> Threat Categories
                    </h3>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 8, fontFamily: 'monospace' }} tickFormatter={(val) => val.split(' ')[0]} />
                          <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#fff', fontSize: 9, fontFamily: 'monospace' }} />
                          <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              )}

              {/* Row 5: Audit Timeline Feed */}
              <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded flex flex-col h-96">
                <h3 className="font-mono text-xs font-bold text-white tracking-wider mb-2 uppercase flex items-center gap-1.5">
                  <History className="w-4 h-4 text-cyber-cyan" /> Analyst Activity Timeline
                </h3>
                <p className="text-[10px] text-cyber-gray mb-4 font-mono">LIVE SOAR AUDIT LOG TRAIL</p>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-cyber-bg/40 border border-cyber-border/40 rounded flex items-start justify-between gap-3 text-[10px] font-mono hover:bg-cyber-card-light/10 transition-colors">
                        <div className="space-y-1">
                          <p className="text-slate-300 font-bold leading-relaxed">{log.action}</p>
                          <div className="flex items-center gap-2 text-[8px]">
                            <span className="text-cyber-cyan font-bold">{log.user_name}</span>
                            <span className="text-cyber-gray">|</span>
                            <span className="text-cyber-gray uppercase">{log.user_role}</span>
                            {log.incident_id && (
                              <>
                                <span className="text-cyber-gray">|</span>
                                <span className="text-cyber-red font-bold">{log.incident_id}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-cyber-gray text-[8px] flex-shrink-0 flex items-center gap-1 uppercase">
                          <Clock className="w-3 h-3 text-cyber-cyan" />
                          {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-xs text-cyber-gray font-mono">No activity logged in audit tables.</div>
                  )}
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

                  {currentUser?.role === "Viewer" && (
                    <div className="p-3 border border-yellow-500/20 bg-yellow-500/10 rounded text-yellow-500 text-xs font-mono flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      <span>Viewer Role Locked: You can browse presets but cannot trigger live heuristics calculations.</span>
                    </div>
                  )}

                  {/* Preset quick buttons */}
                  <div className="bg-cyber-card/30 p-4 rounded border border-cyber-border/60">
                    <p className="text-[10px] font-mono text-cyber-gray tracking-wider uppercase mb-2">Simulate Specific Attack Logs (Demo Mode)</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => loadPreset("bruteForce")} className="px-3 py-1.5 bg-cyber-red/10 border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/20 transition-all rounded text-xs font-mono cursor-pointer">
                        SSH Brute Force
                      </button>
                      <button onClick={() => loadPreset("sqlInjection")} className="px-3 py-1.5 bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber hover:bg-cyber-amber/20 transition-all rounded text-xs font-mono cursor-pointer">
                        Web SQL Injection
                      </button>
                      <button onClick={() => loadPreset("privilegeEscalation")} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all rounded text-xs font-mono cursor-pointer">
                        Linux privilege escalation
                      </button>
                      <button onClick={() => loadPreset("suspiciousAuth")} className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 transition-all rounded text-xs font-mono cursor-pointer">
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
                        disabled={currentUser?.role === "Viewer"}
                        className="w-full h-96 p-4 rounded border border-cyber-border bg-cyber-bg text-cyber-cyan font-mono text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow resize-y leading-relaxed"
                      ></textarea>

                      <button
                        onClick={runAnalysis}
                        disabled={!logsInput.trim() || currentUser?.role === "Viewer"}
                        className={`w-full py-4 text-sm font-mono font-bold border rounded flex items-center justify-center gap-2 transition-all tracking-wider ${
                          logsInput.trim() && currentUser?.role !== "Viewer"
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
                        <label className={`px-4 py-2 border border-cyber-cyan/50 text-cyber-cyan rounded text-xs font-mono font-bold cursor-pointer transition-colors ${currentUser?.role === 'Viewer' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-cyber-cyan hover:text-cyber-bg'}`}>
                          BROWSE FILES
                          <input
                            type="file"
                            className="hidden"
                            disabled={currentUser?.role === 'Viewer'}
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
                  <p className="text-xs text-cyber-gray mt-1">Review, delete or reopen persistent forensic cases in database.</p>
                </div>
              </div>

              {/* Incidents Table */}
              <div className="border border-cyber-border bg-cyber-card/40 rounded p-4">
                {incidents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-cyber-border/60 text-cyber-gray uppercase text-[10px]">
                          <th className="py-3 px-2">ID</th>
                          <th className="py-3 px-2">Threat Vector Category</th>
                          <th className="py-3 px-2">Severity</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2">Owner Analyst</th>
                          <th className="py-3 px-2">Intel Source</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/40 text-slate-300">
                        {incidents.map(inc => (
                          <tr key={inc.id} className="hover:bg-cyber-card-light/30 transition-colors">
                            <td className="py-4 px-2 font-bold text-cyber-cyan">{inc.id}</td>
                            <td className="py-4 px-2 font-bold max-w-[200px] truncate" title={inc.title}>{inc.title}</td>
                            <td className="py-4 px-2">{getSeverityBadge(inc.severity)}</td>
                            <td className="py-4 px-2">{getStatusBadge(inc.status)}</td>
                            <td className="py-4 px-2 text-white">{inc.assigned_analyst || "Unassigned"}</td>
                            <td className="py-4 px-2 text-[10px] text-cyber-cyan">{inc.mocked ? "Local Simulation" : "OpenAI Backend"}</td>
                            <td className="py-4 px-2 text-right space-x-2">
                              <button 
                                onClick={() => { setSelectedIncident(inc); setActiveView("detail"); }}
                                className="px-2.5 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded hover:bg-cyber-cyan/20 transition-all cursor-pointer"
                              >
                                View Forensic
                              </button>
                              {currentUser?.role === "Admin" && (
                                <button 
                                  onClick={() => handleDeleteRecord(inc.id)}
                                  className="px-2 py-1 text-cyber-red/80 hover:text-cyber-red hover:bg-cyber-red/5 rounded transition-all cursor-pointer"
                                  title="Delete record from database"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" />
                                </button>
                              )}
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
                      className="px-4 py-2 border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-bg text-xs font-mono font-bold rounded cursor-pointer"
                    >
                      Analyze raw logs
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW: REPORT CENTER */}
          {activeView === "reports" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header */}
              <div className="border-b border-cyber-border/40 pb-4">
                <h2 className="text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-cyber-cyan" /> REPORT CENTER
                </h2>
                <p className="text-xs text-cyber-gray mt-1">Search, sort, filter, and download compiled PDF security reports from database records.</p>
              </div>

              {/* Filter Panel */}
              <div className="p-4 border border-cyber-border bg-cyber-card/30 rounded grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-xs font-mono">
                
                {/* Search */}
                <div className="space-y-1">
                  <label className="text-[10px] text-cyber-gray uppercase">Search Reports</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="INC-2026 or Title..." 
                      className="w-full p-2 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan focus:outline-none focus:border-cyber-cyan text-xs"
                    />
                    <Search className="w-3.5 h-3.5 text-cyber-gray absolute right-2 top-2.5" />
                  </div>
                </div>

                {/* Severity */}
                <div className="space-y-1">
                  <label className="text-[10px] text-cyber-gray uppercase">Severity Filter</label>
                  <select
                    value={reportSeverityFilter}
                    onChange={(e) => setReportSeverityFilter(e.target.value)}
                    className="w-full p-2 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan text-xs"
                  >
                    <option value="ALL">ALL SEVERITIES</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                {/* Analyst */}
                <div className="space-y-1">
                  <label className="text-[10px] text-cyber-gray uppercase">Compiled Analyst</label>
                  <select
                    value={reportAnalystFilter}
                    onChange={(e) => setReportAnalystFilter(e.target.value)}
                    className="w-full p-2 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan text-xs"
                  >
                    <option value="ALL">ALL ANALYSTS</option>
                    <option value="Devayani (Admin)">Devayani (Admin)</option>
                    <option value="John Analyst">John Analyst</option>
                    <option value="Sarah Viewer">Sarah Viewer</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="space-y-1">
                  <label className="text-[10px] text-cyber-gray uppercase">Sort Date</label>
                  <select
                    value={reportSort}
                    onChange={(e) => setReportSort(e.target.value)}
                    className="w-full p-2 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan text-xs"
                  >
                    <option value="desc">NEWEST COMPILED</option>
                    <option value="asc">OLDEST COMPILED</option>
                  </select>
                </div>

                {/* Clear */}
                <button
                  onClick={() => {
                    setReportSearch("");
                    setReportSeverityFilter("ALL");
                    setReportAnalystFilter("ALL");
                    setReportSort("desc");
                  }}
                  className="p-2 border border-cyber-border hover:bg-cyber-card-light/40 text-white rounded text-xs tracking-wider transition-all cursor-pointer text-center font-bold"
                >
                  RESET FILTERS
                </button>

              </div>

              {/* Reports List */}
              <div className="border border-cyber-border bg-cyber-card/40 rounded p-4">
                {getFilteredReports().length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-cyber-border/60 text-cyber-gray uppercase text-[10px]">
                          <th className="py-3 px-2">Report ID</th>
                          <th className="py-3 px-2">Case ID</th>
                          <th className="py-3 px-2">Report Title</th>
                          <th className="py-3 px-2">Analyst</th>
                          <th className="py-3 px-2">PDF Size</th>
                          <th className="py-3 px-2">Date Generated</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/40 text-slate-300">
                        {getFilteredReports().map(rep => {
                          const matchingInc = incidents.find(inc => inc.id === rep.incident_id);
                          return (
                            <tr key={rep.id} className="hover:bg-cyber-card-light/30 transition-colors">
                              <td className="py-4 px-2 text-cyber-gray">{rep.id}</td>
                              <td className="py-4 px-2 font-bold text-cyber-cyan">{rep.incident_id}</td>
                              <td className="py-4 px-2 font-bold">{rep.name}</td>
                              <td className="py-4 px-2 text-white">{rep.generated_by || "System"}</td>
                              <td className="py-4 px-2 text-cyber-gray">{Math.round((rep.pdf_size_bytes || 45000) / 1024)} KB</td>
                              <td className="py-4 px-2 text-cyber-gray">{new Date(rep.created_at).toLocaleDateString()} {new Date(rep.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="py-4 px-2 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    if (matchingInc) {
                                      setSelectedIncident(matchingInc);
                                      setActiveView("detail");
                                    } else {
                                      triggerToast("Original case logs missing.", "error");
                                    }
                                  }}
                                  className="px-2 py-1 bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan rounded hover:bg-cyber-cyan/30 text-[10px] transition-all cursor-pointer font-bold"
                                >
                                  Inspect Case
                                </button>
                                <button
                                  onClick={() => {
                                    if (matchingInc) {
                                      handleDownloadPDF(matchingInc);
                                    } else {
                                      triggerToast("Original case logs missing.", "error");
                                    }
                                  }}
                                  className="px-2 py-1 border border-cyber-green/40 bg-cyber-green/5 text-cyber-green hover:bg-cyber-green/20 rounded text-[10px] transition-all cursor-pointer font-bold"
                                  title="Download PDF report copy"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 text-xs text-cyber-gray font-mono">
                    No compiled report logs match the active filter criteria.
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

              {/* HEC Placeholder Configuration & Verification */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* HEC Config Form (7 cols) */}
                <div className="lg:col-span-7 p-6 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                  
                  <h3 className="text-sm font-mono font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2 flex items-center justify-between">
                    <span>Splunk HTTP Event Collector (HEC) Setup</span>
                    <span className="text-[9px] text-cyber-gray uppercase">Architecture Template</span>
                  </h3>

                  <div className="space-y-2 font-mono text-xs">
                    <label className="text-white font-bold block">Splunk HEC Ingestion Endpoint</label>
                    <input
                      type="text"
                      value="https://splunk-hec.corp.local:8088/services/collector/event"
                      disabled
                      className="w-full p-2.5 bg-cyber-bg border border-cyber-border/50 rounded text-cyber-gray/70 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-white font-bold block">HEC Token ID</label>
                      <input
                        type="password"
                        value={hecToken}
                        onChange={(e) => setHecToken(e.target.value)}
                        className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan font-mono text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-white font-bold block">Telemetry Source Type</label>
                      <input
                        type="text"
                        value="json_syslog"
                        disabled
                        className="w-full p-2.5 bg-cyber-bg border border-cyber-border/50 rounded text-cyber-gray/70 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 border border-cyber-border bg-cyber-bg/40 rounded flex items-center justify-between">
                    <div className="space-y-1 font-mono text-xs pr-4">
                      <span className="text-white font-bold block">Real-Time Log Ingestion Stream</span>
                      <span className="text-[10px] text-cyber-gray leading-relaxed">Establish active telemetry socket listener hooks.</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setHecEnabled(!hecEnabled);
                        triggerToast(hecEnabled ? "HEC Streaming Disabled" : "HEC Real-time Streaming Active", "success");
                        logSOCActivity(`${currentUser?.full_name} toggled HEC Ingestion Streaming to ${!hecEnabled}`);
                      }}
                      className={`px-3 py-1.5 border rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        hecEnabled 
                          ? "bg-cyber-green/10 border-cyber-green/50 text-cyber-green shadow-green-glow" 
                          : "bg-cyber-card border-cyber-border text-slate-400"
                      }`}
                    >
                      {hecEnabled ? "ACTIVE STREAM" : "ACTIVATE"}
                    </button>
                  </div>

                  {/* Connect Parameters Form (7 cols) */}
                  <form onSubmit={(e) => { e.preventDefault(); testMcpConnection(); }} className="space-y-4 pt-4 border-t border-cyber-border/40">
                    <h3 className="text-sm font-mono font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2">
                      Splunk Daemon MCP Bridge parameters
                    </h3>

                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-white font-bold block">Splunk REST Host URL (Port 8089)</label>
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
                          className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan font-mono text-xs focus:outline-none"
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

                </div>

                {/* Console Log Logins (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="flex-1 border border-cyber-border bg-black/80 rounded p-4 h-64 overflow-y-auto text-[10px] text-cyber-green font-mono leading-relaxed space-y-1 relative shadow-inner">
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

                  {/* Architecture Ready block */}
                  <div className="p-4 border border-cyber-cyan/20 bg-cyber-cyan/5 rounded text-xs font-mono leading-relaxed text-slate-400 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Network className="w-4 h-4 text-cyber-cyan" />
                      <span>HEC Ingestion Pipeline Flow</span>
                    </div>
                    <p className="text-[10px]">
                      The HTTP Event Collector (HEC) allows secure telemetry forwarding from remote Splunk indexer systems to Splunk Sentinel endpoints. Active tokens route raw payload logs directly to `/api/analyze` serverless functions for autonomous incident classification and containment mapping.
                    </p>
                  </div>
                </div>

              </div>

              {/* Splunk Real-time Ingestion & Integration Roadmap */}
              <div className="p-6 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                <h3 className="text-sm font-mono font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyber-cyan" />
                  Splunk MCP Integration Roadmap
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
                      <span className="text-cyber-cyan font-bold block text-[11px] uppercase">3. Real-Time Log Streaming</span>
                      <p className="text-slate-400 text-[10px] leading-relaxed mt-1.5">
                        Streams security alerts directly from the Splunk HTTP Event Collector (HEC) into the Sentinel priority triage queue.
                      </p>
                    </div>
                    <span className="text-[9px] text-cyber-cyan bg-cyber-cyan/10 px-1 rounded self-start mt-2 border border-cyber-cyan/20">ROADMAP</span>
                  </div>

                  <div className="p-4 bg-cyber-bg/50 rounded border border-cyber-border/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-cyber-cyan font-bold block text-[11px] uppercase">4. Agentic Security Operations</span>
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

              {currentUser?.role === "Viewer" && (
                <div className="p-3 border border-yellow-500/20 bg-yellow-500/10 rounded text-yellow-500 text-xs font-mono flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Viewer Role Locked: Settings configuration updates restricted.</span>
                </div>
              )}

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
                    disabled={currentUser?.role === "Viewer"}
                    placeholder="sk-proj-........................................"
                    className="w-full p-3 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan font-mono focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
                  />
                  {openaiKey && currentUser?.role !== "Viewer" && (
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
                    disabled={currentUser?.role === "Viewer"}
                    className="w-full p-3 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan font-mono focus:outline-none focus:border-cyber-cyan"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Recommended - Fast & Cost-Effective)</option>
                    <option value="gpt-4o">gpt-4o (Premium - Deep Logical Reasoning)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="submit"
                    disabled={currentUser?.role === "Viewer"}
                    className={`px-6 py-2.5 font-mono font-bold text-xs rounded border transition-all ${
                      currentUser?.role === "Viewer"
                        ? "bg-cyber-card border-cyber-border text-cyber-gray cursor-not-allowed"
                        : "bg-cyber-cyan text-cyber-bg border-cyber-cyan hover:bg-transparent hover:text-cyber-cyan hover:shadow-cyan-glow cursor-pointer"
                    }`}
                  >
                    SAVE CONFIGURATION
                  </button>
                </div>

              </form>

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
                    <p className="text-[10px] font-mono text-cyber-gray">SCANNED AT: {selectedIncident.created_at || selectedIncident.timestamp} | CORE ENGINE: {selectedIncident.modelUsed || "Sentinel"}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5 border border-cyber-border rounded px-2.5 py-1.5 bg-cyber-card">
                    <span className="text-cyber-gray text-[9px] uppercase font-bold">STATUS:</span>
                    <select
                      value={selectedIncident.status}
                      disabled={currentUser?.role === "Viewer"}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="bg-transparent text-white focus:outline-none text-xs font-mono uppercase font-bold"
                    >
                      <option value="Open">Open</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Contained">Contained</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Owner Dropdown */}
                  <div className="flex items-center gap-1.5 border border-cyber-border rounded px-2.5 py-1.5 bg-cyber-card">
                    <span className="text-cyber-gray text-[9px] uppercase font-bold">OWNER:</span>
                    <select
                      value={selectedIncident.assigned_analyst || "Unassigned"}
                      disabled={currentUser?.role === "Viewer"}
                      onChange={(e) => handleUpdateAssignment(e.target.value)}
                      className="bg-transparent text-white focus:outline-none text-xs font-mono"
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="Devayani (Admin)">Devayani (Admin)</option>
                      <option value="John Analyst">John Analyst</option>
                      <option value="Sarah Viewer">Sarah Viewer</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => handleDownloadPDF(selectedIncident)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan rounded hover:bg-cyber-cyan/25 hover:shadow-cyan-glow transition-all text-xs font-mono cursor-pointer font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> EXPORT PDF REPORT
                  </button>

                  {currentUser?.role === "Admin" && (
                    <button 
                      onClick={() => handleDeleteRecord(selectedIncident.id)}
                      className="p-1.5 border border-cyber-red/30 bg-cyber-red/5 hover:bg-cyber-red/15 text-cyber-red rounded transition-all cursor-pointer"
                      title="Delete record from database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
                          <User className="w-3 h-3" /> Targeted Accounts
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
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                          <Terminal className="w-3 h-3" /> Heuristic Signatures
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedIncident.keyArtifacts?.signatures?.length > 0 ? (
                            selectedIncident.keyArtifacts.signatures.map(sig => (
                              <span key={sig} className="px-2 py-0.5 bg-black/40 border border-cyber-border rounded font-mono text-[9px] text-white truncate max-w-[170px]" title={sig}>{sig}</span>
                            ))
                          ) : (
                            <span className="text-cyber-gray font-mono text-[10px]">None parsed</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Incident Timeline */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-3">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyber-cyan" /> 4. INCIDENT TIMELINE CORRELATION
                    </h3>
                    
                    <div className="relative border-l border-cyber-border/80 ml-3 space-y-6 py-2">
                      {selectedIncident.timeline && selectedIncident.timeline.length > 0 ? (
                        selectedIncident.timeline.map((event, idx) => (
                          <div key={idx} className="relative pl-6">
                            <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-cyber-cyan border border-cyber-bg shadow-cyan-glow"></span>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan text-[8px] font-bold rounded font-mono">
                                {event.time}
                              </span>
                              <span className="text-white font-bold text-xs">{event.event}</span>
                            </div>
                            <p className="text-[10px] text-cyber-gray mt-1 leading-relaxed">{event.details}</p>
                          </div>
                        ))
                      ) : (
                        <div className="pl-6 text-xs text-cyber-gray">No chronological logs timeline mapped.</div>
                      )}
                    </div>
                  </div>

                  {/* Remediation & Containment */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-4">
                    
                    {/* Resolution Progress */}
                    <div className="flex items-center justify-between border-b border-cyber-border/40 pb-2">
                      <h3 className="font-mono text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-cyber-green" /> 5. REMEDIATION & CONTAINMENT ROADMAP
                      </h3>
                      
                      {(() => {
                        const total = selectedIncident.recommendedActions?.length || 0;
                        const completed = selectedIncident.completedActions?.length || 0;
                        const pct = total ? Math.round((completed / total) * 100) : 0;
                        return (
                          <span className={`text-xs font-bold font-mono ${pct === 100 ? "text-cyber-green" : "text-cyber-cyan"}`}>
                            {pct}% Resolved
                          </span>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      {selectedIncident.recommendedActions && selectedIncident.recommendedActions.length > 0 ? (
                        selectedIncident.recommendedActions.map((action, idx) => {
                          const isCompleted = selectedIncident.completedActions?.includes(action);
                          return (
                            <div 
                              key={idx}
                              onClick={() => handleToggleAction(action)}
                              className={`p-3 border rounded text-xs font-mono cursor-pointer transition-all flex items-start gap-3 ${
                                isCompleted 
                                  ? "border-cyber-green/45 bg-cyber-green/5 text-cyber-green/80" 
                                  : "border-cyber-border bg-cyber-bg hover:border-cyber-cyan/60 text-slate-300"
                              }`}
                            >
                              <span className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${isCompleted ? "border-cyber-green text-cyber-green bg-cyber-green/20" : "border-cyber-gray"}`}>
                                {isCompleted && "✓"}
                              </span>
                              <p className="leading-relaxed">{action}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-xs text-cyber-gray font-mono">No containment rules generated.</div>
                      )}
                    </div>
                  </div>

                  {/* Raw Logs Area */}
                  <div className="p-5 border border-cyber-border bg-cyber-card/40 rounded space-y-3">
                    <h3 className="font-mono text-xs font-bold text-white tracking-wider border-b border-cyber-border/40 pb-2">
                      RAW SCAN RECORDED LOG PAYLOAD
                    </h3>
                    <pre className="p-4 rounded border border-cyber-border bg-black/60 text-[10px] text-cyber-cyan overflow-x-auto leading-relaxed max-h-60 overflow-y-auto scrollbar-none font-mono">
                      {selectedIncident.logs || "No raw logs captured."}
                    </pre>
                  </div>

                </div>

                {/* RIGHT: Sentinel AI Copilot V2 (5 cols) */}
                <div className="lg:col-span-5 p-5 border border-cyber-border bg-cyber-card/65 rounded flex flex-col h-[600px] relative">
                  
                  {/* Title */}
                  <div className="border-b border-cyber-border/40 pb-3 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan animate-pulse"></span>
                      <h3 className="font-mono text-xs font-bold text-white tracking-wider">SENTINEL CHAT COPROCESSOR V2</h3>
                    </div>
                    <span className="text-[8px] font-mono text-cyber-cyan border border-cyber-cyan/40 px-1 bg-cyber-cyan/10">ACTIVE CONTEXT</span>
                  </div>

                  {/* Chat bubbles list */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-none">
                    {(selectedIncident.chatHistory || []).map((msg, idx) => (
                      <div key={idx} className={`flex items-start gap-2.5 text-xs font-mono ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role !== 'user' && (
                          <div className="w-6 h-6 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/5 flex items-center justify-center text-cyber-cyan text-[10px] font-bold flex-shrink-0">
                            SE
                          </div>
                        )}
                        <div className={`p-3 rounded max-w-[85%] leading-relaxed whitespace-pre-wrap relative ${
                          msg.role === 'user'
                            ? 'bg-cyber-cyan/10 border border-cyber-cyan/35 text-slate-200'
                            : 'bg-cyber-card border border-cyber-border text-slate-300'
                        }`}>
                          <p>{msg.content}</p>
                          <span className="text-[7px] text-cyber-gray block text-right mt-1.5 uppercase tracking-wider">{msg.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex items-start gap-2.5 text-xs font-mono justify-start">
                        <div className="w-6 h-6 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/5 flex items-center justify-center text-cyber-cyan text-[10px] font-bold flex-shrink-0">
                          SE
                        </div>
                        <div className="p-3 rounded border border-cyber-border bg-cyber-card text-cyber-cyan/80 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sentinel mapping query payload...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef}></div>
                  </div>

                  {/* Quick Coprocessor Prompts */}
                  <div className="border-t border-cyber-border/40 py-3 space-y-1.5">
                    <span className="text-[8px] text-cyber-gray uppercase font-bold block">Quick AI Copilot Actions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button 
                        onClick={() => triggerQuickChat("Provide a detailed technical breakdown of this security incident based on the log entries.")}
                        disabled={currentUser?.role === 'Viewer'}
                        className="px-2 py-1 bg-cyber-bg border border-cyber-border text-[9px] text-slate-300 rounded hover:border-cyber-cyan transition-all cursor-pointer font-mono"
                      >
                        Explain Incident
                      </button>
                      <button 
                        onClick={() => triggerQuickChat("Write a high-level executive briefing summarizing the scope, impact, and mitigation status.")}
                        disabled={currentUser?.role === 'Viewer'}
                        className="px-2 py-1 bg-cyber-bg border border-cyber-border text-[9px] text-slate-300 rounded hover:border-cyber-cyan transition-all cursor-pointer font-mono"
                      >
                        Executive Summary
                      </button>
                      <button 
                        onClick={() => triggerQuickChat("Give step-by-step instructions to contain this attack immediately.")}
                        disabled={currentUser?.role === 'Viewer'}
                        className="px-2 py-1 bg-cyber-bg border border-cyber-border text-[9px] text-slate-300 rounded hover:border-cyber-cyan transition-all cursor-pointer font-mono"
                      >
                        Suggest Containment
                      </button>
                      <button 
                        onClick={() => triggerQuickChat("Write a Splunk SPL search query to find other instances of this threat pattern.")}
                        disabled={currentUser?.role === 'Viewer'}
                        className="px-2 py-1 bg-cyber-bg border border-cyber-border text-[9px] text-slate-300 rounded hover:border-cyber-cyan transition-all cursor-pointer font-mono"
                      >
                        Generate SPL
                      </button>
                      <button 
                        onClick={() => triggerQuickChat("Recommend firewall block rules (iptables/WAF) to filter the attacking traffic.")}
                        disabled={currentUser?.role === 'Viewer'}
                        className="px-2 py-1 bg-cyber-bg border border-cyber-border text-[9px] text-slate-300 rounded hover:border-cyber-cyan transition-all cursor-pointer font-mono"
                      >
                        Firewall Rules
                      </button>
                      <button 
                        onClick={() => triggerQuickChat("Detail a forensic investigation checklist for validating similar breaches.")}
                        disabled={currentUser?.role === 'Viewer'}
                        className="px-2 py-1 bg-cyber-bg border border-cyber-border text-[9px] text-slate-300 rounded hover:border-cyber-cyan transition-all cursor-pointer font-mono"
                      >
                        Investigation Workflow
                      </button>
                    </div>
                  </div>

                  {/* Input Chat form */}
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={currentUser?.role === 'Viewer' ? 'Chat locked for Viewer role' : 'Ask Sentinel about this incident...'}
                      disabled={isChatting || currentUser?.role === 'Viewer'}
                      className="flex-1 p-2 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan font-mono focus:outline-none focus:border-cyber-cyan"
                    />
                    <button
                      type="submit"
                      disabled={isChatting || !chatInput.trim() || currentUser?.role === 'Viewer'}
                      className={`p-2 border rounded transition-colors ${
                        chatInput.trim() && !isChatting && currentUser?.role !== 'Viewer'
                          ? 'border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/15 cursor-pointer'
                          : 'border-cyber-border text-cyber-gray cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-cyber-border bg-cyber-card/60 px-6 py-3 flex items-center justify-between text-[8px] font-mono text-cyber-gray tracking-wider z-10 flex-shrink-0">
        <div>SPLUNK SENTINEL INCIDENT RESPONSE SYSTEM // RELEASE v2.0.0 // SOC HARDENED</div>
        <div className="flex items-center gap-4">
          <span>CLOUD MATRIX: ACTIVE</span>
          <span>DEPLOYMENT PORT: 3000</span>
        </div>
      </footer>

      {/* MODAL: CREATE INCIDENT */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm font-mono animate-fadeIn">
          <div className="w-full max-w-lg bg-cyber-card border border-cyber-border p-6 rounded-lg space-y-4 shadow-lg">
            
            <div className="border-b border-cyber-border/40 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-widest flex items-center gap-1.5 uppercase">
                <Plus className="w-4 h-4 text-cyber-cyan" /> Manual Incident logger
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-cyber-red hover:underline text-xs cursor-pointer"
              >
                Close [X]
              </button>
            </div>

            <form onSubmit={handleCreateManualIncident} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-cyber-gray uppercase font-bold block">Incident Title / Threat Profile</label>
                <input 
                  type="text" 
                  value={newIncTitle}
                  onChange={(e) => setNewIncTitle(e.target.value)}
                  placeholder="e.g. Host Privilege Escalation Alert"
                  className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan focus:outline-none focus:border-cyber-cyan"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-cyber-gray uppercase font-bold block">Initial Severity Level</label>
                <select
                  value={newIncSeverity}
                  onChange={(e) => setNewIncSeverity(e.target.value)}
                  className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-cyber-gray uppercase font-bold block">Source Syslogs Payload</label>
                <textarea 
                  value={newIncLogs}
                  onChange={(e) => setNewIncLogs(e.target.value)}
                  placeholder="Paste log dump entries here..."
                  className="w-full h-36 p-3 bg-cyber-bg border border-cyber-border rounded text-cyber-cyan focus:outline-none focus:border-cyber-cyan resize-none leading-relaxed"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyber-cyan text-cyber-bg border border-cyber-cyan font-bold text-xs rounded hover:bg-transparent hover:text-cyber-cyan hover:shadow-cyan-glow transition-all uppercase cursor-pointer"
              >
                Submit Incident Case Record
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
