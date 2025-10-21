// src/config/apiConfig.js
const API_CONFIG = {
  // Replace with your actual Google Apps Script Web App URL
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxDPCZ8SQL1B6xfNUSU6dUwybjS-fekO_Jnnh0hQICi8HJReg1-9_4AgMH_HvlHdSJg/exec',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout'
    },
    USERS: {
      GET_ALL: '/api/users',
      GET_BY_ID: (id) => `/api/users/${id}`,
      CREATE: '/api/users',
      UPDATE: (id) => `/api/users/${id}`,
      DELETE: (id) => `/api/users/${id}`
    },
    MEMBERS: {
      GET_ALL: '/api/members',
      GET_BY_ID: (id) => `/api/members/${id}`,
      CREATE: '/api/members',
      UPDATE: (id) => `/api/members/${id}`,
      DELETE: (id) => `/api/members/${id}`
    },
    PAYMENTS: {
      GET_ALL: '/api/payments',
      GET_BY_ID: (id) => `/api/payments/${id}`,
      CREATE: '/api/payments',
      UPDATE: (id) => `/api/payments/${id}`,
      DELETE: (id) => `/api/payments/${id}`
    },
    REQUESTS: {
      GET_ALL: '/api/requests',
      GET_BY_ID: (id) => `/api/requests/${id}`,
      CREATE: '/api/requests',
      UPDATE: (id) => `/api/requests/${id}`,
      DELETE: (id) => `/api/requests/${id}`
    },
    DIVIDENDS: {
      GET_ALL: '/api/dividends',
      GET_BY_ID: (id) => `/api/dividends/${id}`,
      CREATE: '/api/dividends',
      UPDATE: (id) => `/api/dividends/${id}`,
      DELETE: (id) => `/api/dividends/${id}`
    },
    GOALS: {
      GET_ALL: '/api/goals',
      GET_BY_ID: (id) => `/api/goals/${id}`,
      CREATE: '/api/goals',
      UPDATE: (id) => `/api/goals/${id}`,
      DELETE: (id) => `/api/goals/${id}`
    },
    PERMISSIONS: {
      GET_ALL: '/api/permissions',
      GET_BY_ID: (id) => `/api/permissions/${id}`,
      CREATE: '/api/permissions',
      UPDATE: (id) => `/api/permissions/${id}`,
      DELETE: (id) => `/api/permissions/${id}`
    },
    SETTINGS: {
      GET_ALL: '/api/settings',
      GET_BY_ID: (id) => `/api/settings/${id}`,
      CREATE: '/api/settings',
      UPDATE: (id) => `/api/settings/${id}`,
      DELETE: (id) => `/api/settings/${id}`
    },
    AUDIT_LOGS: {
      GET_ALL: '/api/audit-logs',
      GET_BY_ID: (id) => `/api/audit-logs/${id}`
    }
  }
};

export default API_CONFIG;