// src/api/membersService.js
import apiClient from './apiClient';

class MembersService {
  async getAllMembers() {
    try {
      const members = await apiClient.get('/api/members');
      return members;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch members');
    }
  }

  async getMemberById(id) {
    try {
      const member = await apiClient.get(`/api/members/${id}`);
      return member;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch member');
    }
  }

  async createMember(memberData) {
    try {
      const member = await apiClient.post('/api/members', memberData);
      return member;
    } catch (error) {
      throw new Error(error.message || 'Failed to create member');
    }
  }

  async updateMember(id, memberData) {
    try {
      const member = await apiClient.put(`/api/members/${id}`, memberData);
      return member;
    } catch (error) {
      throw new Error(error.message || 'Failed to update member');
    }
  }

  async deleteMember(id) {
    try {
      await apiClient.delete(`/api/members/${id}`);
      return { message: 'Member deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete member');
    }
  }
}

// Create and export a singleton instance
const membersService = new MembersService();
export default membersService;