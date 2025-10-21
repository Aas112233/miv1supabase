// src/api/membersService.js
import { supabase } from '../src/config/supabaseClient';
import auditService from './auditService';
import authService from './authService';

class MembersService {
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user ? user.id : null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  // Map application field names to database column names
  mapToDatabaseFields(memberData) {
    const dbFields = {};
    
    // Direct mappings
    if (memberData.name !== undefined) dbFields.name = memberData.name;
    if (memberData.contact !== undefined) dbFields.contact = memberData.contact;
    if (memberData.shareAmount !== undefined) dbFields.share_amount = memberData.shareAmount;
    if (memberData.joinDate !== undefined) dbFields.join_date = memberData.joinDate;
    if (memberData.isActive !== undefined) dbFields.is_active = memberData.isActive;
    if (memberData.userId !== undefined) dbFields.user_id = memberData.userId;
    
    // Keep existing fields that match database column names
    if (memberData.email !== undefined) dbFields.email = memberData.email;
    if (memberData.phone !== undefined) dbFields.phone = memberData.phone;
    if (memberData.address !== undefined) dbFields.address = memberData.address;
    if (memberData.status !== undefined) dbFields.status = memberData.status;
    
    return dbFields;
  }

  // Map database column names to application field names
  mapToAppFields(memberData) {
    if (!memberData) return null;
    
    return {
      ...memberData,
      shareAmount: memberData.share_amount,
      joinDate: memberData.join_date,
      isActive: memberData.is_active,
      userId: memberData.user_id
    };
  }

  async getAllMembers() {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database fields to application fields
      return data.map(member => this.mapToAppFields(member));
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch members');
    }
  }

  async getMemberById(id) {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Map database fields to application fields
      return this.mapToAppFields(data);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch member');
    }
  }

  async createMember(memberData) {
    try {
      // Map application fields to database fields
      const dbFields = this.mapToDatabaseFields(memberData);
      
      const { data, error } = await supabase
        .from('members')
        .insert([dbFields])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the creation action
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logMemberCreation(userId, data.id, dbFields);
      }
      
      // Map database fields back to application fields
      return this.mapToAppFields(data);
    } catch (error) {
      throw new Error(error.message || 'Failed to create member');
    }
  }

  async updateMember(id, memberData) {
    try {
      // First, get the current member data for audit logging
      const currentMember = await this.getMemberById(id);
      
      // Map application fields to database fields
      const dbFields = this.mapToDatabaseFields(memberData);
      
      const { data, error } = await supabase
        .from('members')
        .update(dbFields)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the update action
      const userId = await this.getCurrentUserId();
      if (userId && data && currentMember) {
        await auditService.logMemberUpdate(userId, id, currentMember, dbFields);
      }
      
      // Map database fields back to application fields
      return this.mapToAppFields(data);
    } catch (error) {
      throw new Error(error.message || 'Failed to update member');
    }
  }

  async deleteMember(id) {
    try {
      // First, get the current member data for audit logging
      const currentMember = await this.getMemberById(id);
      
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Log the deletion action
      const userId = await this.getCurrentUserId();
      if (userId && currentMember) {
        await auditService.logMemberDeletion(userId, id, currentMember);
      }
      
      return { message: 'Member deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete member');
    }
  }
}

// Create and export a singleton instance
const membersService = new MembersService();
export default membersService;