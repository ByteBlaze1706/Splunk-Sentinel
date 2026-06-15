# Splunk Sentinel Architecture Flow

This document details the data and service architecture flow of **Splunk Sentinel**, tracing how raw security logs are ingested, analyzed, and mitigated.

## 🗺️ Visual Architecture Diagram

Here is the visual diagram for the system:

![Splunk Sentinel System Flow](architecture-diagram.png)

---

## 🔁 Chronological Data Flow

```mermaid
graph TD
    %% Nodes
    A[Splunk Enterprise / Splunk Cloud] -->|1. Event Generation & Storage| B(Log Ingestion Layer)
    B -->|2. POST Raw JSON Logs| C(Splunk Sentinel Analysis API)
    C -->|3. Query Prompting| D(AI Threat Analysis Engine)
    D -->|4. Structured Parsing| E(Incident Correlation Engine)
    E -->|5. Context Sync| F(Sentinel Chat Coprocessor)
    F -->|6. containment Action Mapping| G(Remediation Recommendations)
    G -->|7. PDF Compilation| H(PDF Report Export)

    %% Styling
    classDef default fill:#0a0f1d,stroke:#1e293b,stroke-width:2px,color:#cbd5e1;
    classDef highlight fill:#00f0ff,stroke:#0077ff,stroke-width:3px,color:#040811;
    class H highlight;
```

---

## 🔬 Component Descriptions

1. **Splunk Enterprise / Splunk Cloud**: The system of record for all security telemetry. It collects and indexes system events, auth triggers, and network packets.
2. **Log Ingestion Layer**: Consumes raw log streams from Splunk dashboards, saved searches, or HEC (HTTP Event Collector) hooks.
3. **Splunk Sentinel Analysis API**: Next.js App Router route `/api/analyze`. Accepts log text and targets them for analysis.
4. **AI Threat Analysis Engine**: Leverages the OpenAI SDK (or local heuristics fallback) to analyze security context.
5. **Incident Correlation Engine**: Parses the AI's output to extract severity badges, target endpoints, attacking source IPs, and chronological timelines.
6. **Sentinel Chat Coprocessor**: An interactive, context-aware chatbot allowing analysts to converse directly with logs.
7. **Remediation Recommendations**: Evaluates threat parameters to output a containment checklist.
8. **PDF Report Export**: compiles all forensically gathered data into a secure PDF report.
