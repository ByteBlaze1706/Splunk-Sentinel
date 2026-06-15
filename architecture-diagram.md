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
    B -->|2. POST Raw JSON Logs| C(Splunk Sentinel API)
    C -->|3. Query Prompting| D(AI Threat Analysis Engine)
    D -->|4. Structured Parsing| E(Incident Correlation Engine)
    E -->|5. Context Sync| F(Sentinel Chat Coprocessor)
    F -->|6. Containment Action Mapping| G(Remediation Recommendations)
    G -->|7. PDF Compilation| H(PDF Report Export)

    %% Styling
    classDef default fill:#0a0f1d,stroke:#1e293b,stroke-width:2px,color:#cbd5e1;
    classDef highlight fill:#00f0ff,stroke:#0077ff,stroke-width:3px,color:#040811;
    class H highlight;
```

---

## 🔬 Component Descriptions

1. **Splunk Enterprise / Splunk Cloud**: The system of record for all security telemetry. It collects and indexes system events, authorization logs, and network packets.
2. **Log Ingestion Layer**: Consumes raw log streams from Splunk dashboards, saved searches, or HEC (HTTP Event Collector) hooks, acting as the entry point for raw telemetry.
3. **Splunk Sentinel API**: Next.js App Router route `/api/analyze`. Accepts log text inputs and formats them for the cognitive completion backend.
4. **AI Threat Analysis Engine**: Leverages the OpenAI completion SDK (or local heuristics fallback) to analyze security log context, classify threat vectors, and determine severity.
5. **Incident Correlation Engine**: Parses the raw response payload to extract structured indicators of compromise (compromised accounts, source IPs, affected endpoints, signatures) and maps out a chronologically sorted event timeline.
6. **Sentinel Chat Coprocessor**: An interactive, context-aware chatbot allowing analysts to converse directly with logs, generating SPL search commands or shell block scripts.
7. **Remediation Recommendations**: Evaluates threat parameters to output a customized step-by-step mitigation and containment checklist.
8. **PDF Report Export**: Compiles all gathered forensic data and action checklists into a clean, multi-page, SOC-restricted PDF report for executive verification.
