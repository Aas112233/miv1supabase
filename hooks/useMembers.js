// src/hooks/useMembers.js
import { useState, useEffect } from 'react';
import membersService from '../api/membersService';

export const useMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await membersService.getAllMembers();
      setMembers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMember = async (memberData) => {
    setLoading(true);
    setError(null);
    try {
      const newMember = await membersService.createMember(memberData);
      setMembers(prevMembers => [...prevMembers, newMember]);
      return newMember;
    } catch (err) {
      setError(err.message);
      console.error('Error creating member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (id, memberData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMember = await membersService.updateMember(id, memberData);
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === id ? updatedMember : member
        )
      );
      return updatedMember;
    } catch (err) {
      setError(err.message);
      console.error('Error updating member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await membersService.deleteMember(id);
      setMembers(prevMembers => prevMembers.filter(member => member.id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch members when the hook is first used
  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    loading,
    error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember
  };
};