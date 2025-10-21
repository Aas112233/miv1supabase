import React, { useState, useEffect } from 'react';
import auditService from '../api/auditService';
import authService from '../api/authService';
import './AuditLogViewer.css';

const AuditLogViewer = ({ currentUser }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'user', 'members', 'payments'

  useEffect(() => {
    fetchAuditLogs();
  }, [filter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      let logs;
      if (filter === 'user' && currentUser) {
        logs = await auditService.getUserAuditLogs(currentUser.id);
      } else if (filter === 'members') {
        // This would require a different approach in a real app
        logs = await auditService.getAllAuditLogs();
        logs = logs.filter(log => log.table_name === 'members');
      } else if (filter === 'payments') {
        // This would require a different approach in a real app
        logs = await auditService.getAllAuditLogs();
        logs = logs.filter(log => log.table_name === 'payments');
      } else {
        logs = await auditService.getAllAuditLogs();
      }
      
      setAuditLogs(logs);
    } catch (err) {
      setError('Failed to fetch audit logs: ' + err.message);
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'create':
        return '#4caf50'; // green
      case 'update':
        return '#2196f3'; // blue
      case 'delete':
        return '#f44336'; // red
      case 'login':
        return '#9c27b0'; // purple
      case 'logout':
        return '#ff9800'; // orange
      default:
        return '#9e9e9e'; // grey
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Audit Logs</h2>
        <div>
          <label htmlFor="filter" style={{ marginRight: '10px' }}>Filter:</label>
          <select 
            id="filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="all">All Logs</option>
            <option value="user">My Actions</option>
            <option value="members">Member Actions</option>
            <option value="payments">Payment Actions</option>
          </select>
          <button 
            onClick={fetchAuditLogs}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {auditLogs.length === 0 ? (
        <p>No audit logs found.</p>
      ) : (
        <div style={{ 
          border: '1px solid #eee', 
          borderRadius: '4px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #eee' }}>Timestamp</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #eee' }}>User</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #eee' }}>Action</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #eee' }}>Table</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #eee' }}>Record ID</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{formatTimestamp(log.created_at)}</td>
                  <td style={{ padding: '10px' }}>
                    {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Unknown'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: getActionColor(log.action),
                      color: 'white',
                      fontSize: '0.8em'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{log.table_name || 'N/A'}</td>
                  <td style={{ padding: '10px' }}>
                    {log.record_id ? log.record_id.substring(0, 8) + '...' : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        <p>Total logs: {auditLogs.length}</p>
      </div>
    </div>
  );
};

export default AuditLogViewer;