import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const DatabaseTest = () => {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data);
    } catch (error) {
      setMessage(`Error fetching members: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .insert([{ name, email }])
        .select();

      if (error) throw error;
      setMembers([data[0], ...members]);
      setName('');
      setEmail('');
      setMessage('Member added successfully!');
    } catch (error) {
      setMessage(`Error adding member: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMembers(members.filter(member => member.id !== id));
      setMessage('Member deleted successfully!');
    } catch (error) {
      setMessage(`Error deleting member: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Supabase Database Test</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '4px',
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          color: message.includes('Error') ? '#c62828' : '#2e7d32'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={addMember} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              flex: 1
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              flex: 1
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>

      <div>
        <h3>Members ({members.length})</h3>
        {loading && <p>Loading...</p>}
        {members.length === 0 && !loading && <p>No members found</p>}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '15px' 
        }}>
          {members.map((member) => (
            <div 
              key={member.id} 
              style={{ 
                border: '1px solid #eee', 
                borderRadius: '4px', 
                padding: '15px',
                backgroundColor: '#fafafa'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0' }}>{member.name}</h4>
              <p style={{ margin: '5px 0', color: '#666' }}>{member.email}</p>
              <p style={{ margin: '5px 0', fontSize: '0.8em', color: '#999' }}>
                Created: {new Date(member.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => deleteMember(member.id)}
                disabled={loading}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8em'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseTest;