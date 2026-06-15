// src/utils/permissions.js

export const ROLE_PERMISSIONS = {
  Admin: {
    allowedViews: ["dashboard", "analyzer", "history", "reports", "splunk-mcp", "settings", "detail"],
    actions: {
      createIncident: true,
      editStatus: true,
      assignAnalyst: true,
      deleteIncident: true,
      exportReport: true,
      chatCoprocessor: true,
      scanLogs: true,
      togglePlaybook: true,
      configureAI: true,
      configureSplunk: true
    }
  },
  "Security Analyst": {
    allowedViews: ["dashboard", "analyzer", "history", "reports", "detail"],
    actions: {
      createIncident: true,
      editStatus: true,
      assignAnalyst: false,
      deleteIncident: false,
      exportReport: true,
      chatCoprocessor: true,
      scanLogs: true,
      togglePlaybook: true,
      configureAI: false,
      configureSplunk: false
    }
  },
  Viewer: {
    allowedViews: ["dashboard", "history", "reports", "detail"],
    actions: {
      createIncident: false,
      editStatus: false,
      assignAnalyst: false,
      deleteIncident: false,
      exportReport: false,
      chatCoprocessor: false,
      scanLogs: false,
      togglePlaybook: false,
      configureAI: false,
      configureSplunk: false
    }
  }
};

export function canView(role, view) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return perms.allowedViews.includes(view);
}

export function canCreateIncident(role) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return !!perms.actions.createIncident;
}

export function canUpdateStatus(role) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return !!perms.actions.editStatus;
}

export function canDeleteIncident(role) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return !!perms.actions.deleteIncident;
}

export function canDownloadPDF(role) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return !!perms.actions.exportReport;
}

export function canAccessSettings(role) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return !!perms.actions.configureAI;
}

export function canAccessSplunk(role) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return !!perms.actions.configureSplunk;
}

export function canUseChat(role) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return !!perms.actions.chatCoprocessor;
}
