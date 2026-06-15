# Splunk Sentinel

AI-Powered Security Operations Copilot for Threat Detection, Incident Investigation, and Automated Response.

Designed for the **Splunk Agentic Ops Hackathon 2026**.

---

## 📖 Problem Statement
Security Operations Centers (SOCs) are overwhelmed by an exponential volume of raw log data and alert fatigue. Analysts face three primary challenges:
1. **Time-to-Triage**: Reviewing thousands of lines of logs to identify the initial vector, threat category, and root cause is manually intensive.
2. **Context Fragmentation**: Moving between SIEM search heads, external reputation directories, and local checklists delays containment.
3. **Delayed Action Plans**: Translating complex logs into actionable containment playbooks or reports for executive sign-off slows down threat containment.

---

## 💡 Solution Overview
**Splunk Sentinel** acts as a cognitive co-pilot that sits alongside the analyst. By combining heuristics-based analysis (for local offline safety) and LLM analysis (for semantic reasoning), Sentinel:
- Automatically parses threat details (Attack vector, root cause, timeline).
- Recommends containment checklists with an interactive task manager.
- Provides a context-aware chat assistant that answers direct forensic questions using the logs' context.
- Exports executive-ready PDF containment reports with a single click.
- Prepares operations for the next generation of Splunk Model Context Protocol (MCP) integrations.

---

## 📸 Screenshots & Features

### 1. Security Operations Center Dashboard
![SOC Dashboard](public/screenshots/dashboard.png)
*Caption: Splunk Sentinel Security Operations Center (SOC) Dashboard showing real-time logs scanned, active threat metrics, and prioritized investigation queues.*

- **Description**: The SOC Dashboard provides a centralized command center for security analysts, displaying aggregated security telemetry, critical alert thresholds, active socket tasks, and the historical queue of incident files.
- **Key Features**:
  - Real-time heuristics monitoring and total log count counters.
  - Threat vector categorization breakdown (e.g., SQL Injection, Brute Force).
  - Live active threat tracking under investigation.
  - Mitigated incident rates linked directly to local browser database.
- **Splunk Integration**: Security telemetry originating from Splunk Enterprise and Splunk Cloud is aggregated, and critical indicator metrics are fed into the dashboard queue for rapid analyst triage.
- **AI Contribution**: The AI engine continuously evaluates incident severity, correlates active log counts, and categorizes security anomalies into actionable SOC status queues.

---

### 2. Cognitive Log Analyzer
![Log Analyzer](public/screenshots/log_analyzer.png)
*Caption: The Cognitive Log Analyzer interface featuring simulated threat presets, a log editor, and a drag-and-drop log uploader.*

- **Description**: The Log Analyzer allows analysts to paste raw text events or drag-and-drop log files (e.g., `.log`, `.txt`, `.json`, `.csv`) directly into the sandbox. It features preset templates to simulate standard enterprise attacks for immediate verification.
- **Key Features**:
  - Raw log editor and log clearing functions.
  - Preset attack log simulators (SSH Brute Force, Web SQL Injection, Linux Privilege Escalation, Impossible Travel Auth).
  - Drag-and-drop drag-over highlighted file dropzone.
  - Automatic timeline generation triggers.
- **Splunk Integration**: Logs generated from Splunk Search heads can be copied and pasted directly, or uploaded as CSV/JSON exports, allowing quick ad-hoc analysis without complex API routing.
- **AI Contribution**: Automated heuristics match raw logs against common vulnerability patterns before sending them to the LLM core for advanced semantic classification and contextual extraction.

---

### 3. AI Incident Investigation Report
![AI Incident Investigation Report](public/screenshots/forensics_report.png)
*Caption: Forensic Detail View displaying the executive summary, technical root cause analysis, and extracted indicators of compromise (IOCs).*

- **Description**: The Forensic Report converts raw, unreadable system log dumps into structured, readable intelligence briefs. It details the threat vector, scope classification, and technical root cause of the compromise.
- **Key Features**:
  - Executive summaries translated into natural language.
  - Context-rich technical root cause explanations.
  - Structured Indicators of Compromise (IOCs) including source IPs, compromised accounts, affected assets, and signature flags.
  - Real-time status update toggle (Triage, Investigating, Resolved).
- **Splunk Integration**: Ingested Splunk log fields are parsed to automatically map target endpoints and attacking IPs back to original Splunk network nodes.
- **AI Contribution**: The LLM acts as a forensic scientist, reading raw log stacks to infer the attacker's path, deduce intent, identify system vulnerabilities, and catalog key indicators.

---

### 4. Sentinel Chat Coprocessor
![Sentinel Chat Coprocessor](public/screenshots/forensics_report.png)
*Caption: The Sentinel Chat Coprocessor panel allowing analysts to query log context, request SPL queries, and brainstorm block rules.*

- **Description**: The Chat Coprocessor sits directly alongside the forensic report, acting as an interactive, context-aware cybersecurity assistant. It is pre-seeded with the raw log contents and extracted artifacts, allowing real-time follow-up questioning.
- **Key Features**:
  - Direct log context-aware query interface.
  - One-click quick action buttons (Summarize IPs, Suggest Block Rules, Escalation Vector).
  - Chat message bubble history and loading indicators.
  - Instant mitigation code block output.
- **Splunk Integration**: Analysts can ask the coprocessor to write optimized Splunk Search Processing Language (SPL) queries to hunt for similar threats across the wider Splunk Enterprise index.
- **AI Contribution**: Generates custom security insights, maps attacker behavior to the MITRE ATT&CK framework, and writes precise firewall configurations and lookup commands.

---

### 5. Timeline Correlation & Remediation
![Timeline Correlation & Remediation](public/screenshots/timeline_remediation.png)
*Caption: Incident timeline correlation details, actionable remediation roadmaps, and the raw scanned log payload.*

- **Description**: This section details the progression of the security incident from initial marker to threshold breach, alongside a checkable containment checklist that updates the overall case resolution rate.
- **Key Features**:
  - Chronologically mapped threat timeline logs.
  - Actionable, context-specific containment checklists.
  - Live resolution progress bar showing percent of mitigation complete.
  - Highlighted raw log payload reference console.
- **Splunk Integration**: Timeline events correspond to Splunk event timestamps, and remediation items are mapped to potential Splunk SOAR / Phantom API containment actions.
- **AI Contribution**: Correlates disparate log times into a logical sequence of events, and issues step-by-step containment instructions tailored to the specific type of threat detected.

---

### 6. Splunk MCP Integration Workspace
![Splunk MCP Integration Workspace](architecture-diagram.png)
*Caption: Splunk Sentinel's MCP Bridge workspace mapping remote Splunk REST daemon hosts and WebSocket JSON-RPC interfaces.*

- **Description**: The Splunk Integration workspace enables security operations to hook Sentinel's cognitive reasoning core directly to active Splunk indexes. By setting up the Model Context Protocol (MCP) parameters, analysts can establish WebSocket links to query indices in real-time.
- **Key Features**:
  - Enterprise Host URL config mapping.
  - Secure Bearer Token credential management.
  - Target security index validation checks.
  - Interactive MCP Bridge console outputting JSON-RPC protocol logs.
- **Splunk Integration**: Directly interfaces with Splunk REST endpoints (port 8089) and streams logs from indexers into the AI model's context window.
- **AI Contribution**: Translates standard natural language queries into executable Splunk Search Processing Language (SPL) commands and executes them autonomously over the MCP socket.

---

### 7. Cognitive Core Configuration
![Cognitive Core Configuration](public/screenshots/settings.png)
*Caption: Cognitive Core Configuration page for managing OpenAI API credentials, selecting logical reasoning models, and resetting databases.*

- **Description**: The Settings workspace provides control over the cognitive brains of the application. Analysts can input custom API credentials to switch from the local heuristics mock engine to live OpenAI logic engines.
- **Key Features**:
  - Secure custom OpenAI API key cache override in local browser memory.
  - LLM model dropdown selector (gpt-4o, gpt-4o-mini).
  - Local heuristics database reset button.
  - Status indicator showing MOCK MODE or OPENAI CONNECTED.
- **Splunk Integration**: Enables custom API parameters that govern how raw log context passed from Splunk queries is managed and analyzed by cognitive endpoints.
- **AI Contribution**: Allows toggling between logical processing weights (mini model for rapid triaging, full model for advanced persistent threat investigation).

---

### 8. System Architecture Overview
![System Architecture Overview](architecture-diagram.png)
*Caption: Splunk Sentinel System Data Flow Diagram detailing the ingestion, logical processing, and forensic reporting pipeline.*

- **Description**: The Splunk Sentinel architecture is engineered to run client-side, communicating with serverless Next.js API endpoints to interface with security engines and the Model Context Protocol.
- **Key Features**:
  - Local storage caching for zero-data-leak client compliance.
  - Dual-mode processing (local heuristics sandbox vs live API core).
  - Automated client-side PDF compiler (jsPDF).
  - Direct WebSocket communication schemas.
- **Splunk Integration**: Splunk Enterprise and Splunk Cloud form the absolute telemetry foundation, constantly feeding raw logs into the Sentinel ingestion interface.
- **AI Contribution**: Provides the cognitive layer that sits between raw Splunk data lakes and downstream containment playbooks, automating the triage analysis loops.

---

## 🔁 How Splunk Fits Into The Workflow
Splunk Sentinel bridges the gap between raw data collection and cognitive automated response. The step-by-step pipeline operates as follows:

```
Splunk Enterprise / Splunk Cloud
      ↓
Security Telemetry (raw web server logs, auth events, system traces)
      ↓
Splunk Sentinel Ingestion Layer (ingests logs via API or file upload)
      ↓
AI Threat Analysis Engine (LLM-driven logical reasoning mapping threat vectors)
      ↓
Incident Correlation Engine (parses and structures timelines, severities, and targets)
      ↓
Sentinel Chat Coprocessor (interactive chat interface for deep forensic queries)
      ↓
Remediation Recommendations (issues custom actionable containment checklists)
      ↓
PDF Investigation Report (downloads executive-ready forensics and containment summary)
```

### Chronological Stages

1. **Splunk Enterprise / Splunk Cloud**: The initial source of truth where all system logs, active firewall events, authorization records, and API calls are collected and indexed.
2. **Security Telemetry**: The raw files and metrics generated from Splunk indices (SSHD authentication tables, SQL queries, network captures).
3. **Splunk Sentinel Ingestion Layer**: Consumes raw security telemetry inputs via Next.js serverless API routes (`/api/analyze`) or direct file uploads.
4. **AI Threat Analysis Engine**: Runs cognitive reasoning on logs using OpenAI logical models to extract security context, calculate threat vectors, and assign a threat severity score.
5. **Incident Correlation Engine**: Automatically parses the completion payloads to extract targeted endpoint hosts, compromise signatures, timeline checkmarks, and source attacker IPs.
6. **Sentinel Chat Coprocessor**: An interactive, context-aware chatbot enabling analysts to inspect the logs further or request SPL queries to hunt for similar indicators.
7. **Remediation Recommendations**: Synthesizes threat characteristics to deliver step-by-step mitigation containment checklists.
8. **PDF Investigation Report**: Dynamically compiles all forensic evidence and checklists into a structured, executive-ready containment PDF report.

---

## 🗺️ Architecture Details
The system uses the following structural component relationship:

```mermaid
graph TD
    User([Security Analyst]) -->|1. Pastes/Uploads Logs| WebUI[Splunk Sentinel Web Interface]
    WebUI -->|Local Cache| LocalStorage[(Browser LocalStorage)]
    
    subgraph Backend Services
        WebUI -->|2. POST Raw Logs| API_Analyze[Next.js API: /api/analyze]
        WebUI -->|3. Chat Context| API_Chat[Next.js API: /api/chat]
    end
    
    subgraph Cognitive Core
        API_Analyze -->|Heuristics Match| Heuristics[Local Heuristics Sandbox]
        API_Analyze -->|Active Key| OpenAI[OpenAI API Core]
        API_Chat -->|Heuristics Match| Heuristics
        API_Chat -->|Active Key| OpenAI
    end
    
    WebUI -->|4. Compiles PDF| jsPDF[jsPDF Client-Side Compiler]
    jsPDF -->|Downloads| PDFReport[Forensic Report PDF]
```

For a comprehensive explanation of every engine component, please refer to the dedicated [architecture-diagram.md](architecture-diagram.md) documentation file in the repository root.

---

## 🚀 Installation
Follow these steps to set up Splunk Sentinel locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/ByteBlaze1706/Splunk-Sentinel.git
   cd Splunk-Sentinel
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🔑 Environment Variables
To enable live OpenAI completions, create a `.env.local` file at the root:
```env
OPENAI_API_KEY=sk-proj-your-api-key-here
```
*Note: If no API key is specified in the environment variables, the platform automatically starts in **Mock Mode**, allowing you to test all buttons, analyzers, chatbots, and PDF download functions using local heuristics presets.*

---

## 💻 Local Development
Start the Next.js development server:
```bash
npm run dev
```
Access the web interface at `http://localhost:3000`.

---

## 🌐 Deployment Guide
This project is configured for one-click deployment on **Vercel**:

### Option 1: Vercel CLI (Recommended)
1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy the project (in non-interactive mode):
   ```bash
   vercel --yes
   ```
3. Promote the build to production:
   ```bash
   vercel --prod --yes
   ```

### Option 2: GitHub Integration
1. Push this repository to your GitHub account.
2. Link the repository to your Vercel Dashboard.
3. Configure `OPENAI_API_KEY` under project environment variables if live completions are desired.
4. Trigger deployment.

---

## 🔮 Future Splunk MCP Integration
Model Context Protocol (MCP) bridges LLM models with remote server contexts. In Splunk Sentinel, an MCP integration allows direct access to search heads:

1. **Splunk Enterprise & Splunk Cloud support**: Authenticates directly with Splunk REST endpoints using secure bearer tokens.
2. **Splunk MCP Link**: Establishes a WebSocket JSON-RPC bridge between the AI model and the Splunk Daemon.
3. **Real-Time Log Streaming**: Attaches listeners directly to Splunk HEC (HTTP Event Collector) for real-time breach detection.
4. **Agentic Security Operations**: Deploys autonomous AI search agents to hunt for advanced persistent threats (APTs) using automated Splunk SPL queries.
5. **SOAR Playbooks Sync**: Automatically maps completed remediation items in the containment checklist to Splunk Phantom SOAR playbooks.

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🛡️ Built For Splunk Agentic Ops Hackathon
*Splunk Sentinel has been designed and built specifically for the Splunk Agentic Ops Hackathon 2026. The platform demonstrates how Model Context Protocols (MCP) can bridge autonomous cognitive agents directly into SIEM operations.*
