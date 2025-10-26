import { supabase } from '../src/config/supabaseClient';
import auditService from './auditService';
import authService from './authService';

class ProjectsService {
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user ? user.id : null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  async getAllProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          assigned_member:members!assigned_member_id(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch projects');
    }
  }

  async getProjectById(id) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          assigned_member:members!assigned_member_id(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch project');
    }
  }

  async createProject(projectData) {
    try {
      const userId = await this.getCurrentUserId();
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          category: projectData.category,
          description: projectData.description,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          status: projectData.status,
          assigned_member_id: projectData.assignedMemberId,
          progress_percentage: projectData.progressPercentage || 0,
          initial_investment: projectData.initialInvestment || 0,
          monthly_revenue: projectData.monthlyRevenue || 0,
          created_by: userId
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (projectData.involvedMemberIds && projectData.involvedMemberIds.length > 0) {
        await this.updateProjectMembers(data.id, projectData.involvedMemberIds);
      }
      
      if (userId && data) {
        await auditService.logAction(userId, 'CREATE', 'projects', data.id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create project');
    }
  }

  async updateProject(id, projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          category: projectData.category,
          description: projectData.description,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          status: projectData.status,
          assigned_member_id: projectData.assignedMemberId,
          progress_percentage: projectData.progressPercentage,
          initial_investment: projectData.initialInvestment || 0,
          monthly_revenue: projectData.monthlyRevenue || 0
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (projectData.involvedMemberIds !== undefined) {
        await this.updateProjectMembers(id, projectData.involvedMemberIds);
      }
      
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logAction(userId, 'UPDATE', 'projects', id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update project');
    }
  }

  async deleteProject(id) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const userId = await this.getCurrentUserId();
      if (userId) {
        await auditService.logAction(userId, 'DELETE', 'projects', id, null);
      }
      
      return { message: 'Project deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete project');
    }
  }

  // Project Investments
  async getProjectInvestments(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_investments')
        .select(`
          *,
          member:members(id, name, share_amount)
        `)
        .eq('project_id', projectId)
        .order('investment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch project investments');
    }
  }

  async getProjectMembers(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          member:members(id, name, share_amount)
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch project members');
    }
  }

  async updateProjectMembers(projectId, memberIds) {
    try {
      await supabase.from('project_members').delete().eq('project_id', projectId);
      
      if (memberIds && memberIds.length > 0) {
        const inserts = memberIds.map(memberId => ({
          project_id: projectId,
          member_id: memberId
        }));
        
        const { error } = await supabase.from('project_members').insert(inserts);
        if (error) throw error;
      }
      
      return { message: 'Project members updated successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to update project members');
    }
  }

  async addProjectInvestment(investmentData) {
    try {
      const { data, error } = await supabase
        .from('project_investments')
        .insert([{
          project_id: investmentData.projectId,
          member_id: investmentData.memberId,
          amount: investmentData.amount,
          investment_date: investmentData.investmentDate
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add investment');
    }
  }

  // Project Revenues
  async getProjectRevenues(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_revenues')
        .select('*')
        .eq('project_id', projectId)
        .order('revenue_date', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch project revenues');
    }
  }

  async addProjectRevenue(revenueData) {
    try {
      const { data, error } = await supabase
        .from('project_revenues')
        .insert([{
          project_id: revenueData.projectId,
          amount: revenueData.amount,
          revenue_date: revenueData.revenueDate,
          description: revenueData.description
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add revenue');
    }
  }

  // Project Milestones
  async getProjectMilestones(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch project milestones');
    }
  }

  async addProjectMilestone(milestoneData) {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .insert([{
          project_id: milestoneData.projectId,
          title: milestoneData.title,
          description: milestoneData.description,
          target_date: milestoneData.targetDate,
          status: milestoneData.status || 'Pending'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add milestone');
    }
  }

  async updateMilestoneStatus(id, status, completedDate = null) {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .update({
          status,
          completed_date: completedDate
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update milestone');
    }
  }

  // Project Expenses
  async getProjectExpenses(projectId) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch project expenses');
    }
  }

  // Calculate Project Financials
  async getProjectFinancials(projectId) {
    try {
      const [investments, revenues, expenses] = await Promise.all([
        this.getProjectInvestments(projectId),
        this.getProjectRevenues(projectId),
        this.getProjectExpenses(projectId)
      ]);

      const totalInvestment = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const totalRevenue = revenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const profitLoss = totalRevenue - totalExpenses;
      const roi = totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100).toFixed(2) : 0;

      return {
        totalInvestment,
        totalRevenue,
        totalExpenses,
        profitLoss,
        roi,
        investments,
        revenues,
        expenses
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to calculate project financials');
    }
  }
}

const projectsService = new ProjectsService();
export default projectsService;
