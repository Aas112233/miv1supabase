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

  async checkProjectDependencies(projectId) {
    try {
      const [investments, revenues, expenses, monthlyData] = await Promise.all([
        this.getProjectInvestments(projectId),
        this.getProjectRevenues(projectId),
        this.getProjectExpenses(projectId),
        this.getMonthlyFinancials(projectId)
      ]);

      const dependencies = [];
      if (investments.length > 0) dependencies.push(`${investments.length} investment(s)`);
      if (revenues.length > 0) dependencies.push(`${revenues.length} revenue(s)`);
      if (expenses.length > 0) dependencies.push(`${expenses.length} expense(s)`);
      if (monthlyData.length > 0) dependencies.push(`${monthlyData.length} monthly update(s)`);

      return {
        canDelete: dependencies.length === 0,
        dependencies,
        counts: {
          investments: investments.length,
          revenues: revenues.length,
          expenses: expenses.length,
          monthlyUpdates: monthlyData.length
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to check project dependencies');
    }
  }

  async deleteProject(id) {
    try {
      // Check dependencies first
      const check = await this.checkProjectDependencies(id);
      if (!check.canDelete) {
        throw new Error(`Cannot delete project. Please delete all related data first: ${check.dependencies.join(', ')}`);
      }

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

  async deleteProjectInvestment(id) {
    try {
      const { error } = await supabase
        .from('project_investments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { message: 'Investment deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete investment');
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

  async deleteProjectRevenue(id) {
    try {
      const { error } = await supabase
        .from('project_revenues')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { message: 'Revenue deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete revenue');
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

  // Monthly Financials
  async getMonthlyFinancials(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_monthly_financials')
        .select('*')
        .eq('project_id', projectId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch monthly financials');
    }
  }

  async addMonthlyFinancial(data) {
    try {
      const { data: result, error } = await supabase
        .from('project_monthly_financials')
        .insert([{
          project_id: data.projectId,
          month: data.month,
          year: data.year,
          revenue: data.revenue,
          expenses: data.expenses,
          notes: data.notes
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      throw new Error(error.message || 'Failed to add monthly financial');
    }
  }

  async updateMonthlyFinancial(id, data) {
    try {
      const { data: result, error } = await supabase
        .from('project_monthly_financials')
        .update({
          revenue: data.revenue,
          expenses: data.expenses,
          notes: data.notes
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      throw new Error(error.message || 'Failed to update monthly financial');
    }
  }

  async deleteMonthlyFinancial(id) {
    try {
      const { error } = await supabase
        .from('project_monthly_financials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { message: 'Monthly financial deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete monthly financial');
    }
  }

  // Project Calculator
  async calculateProjectMetrics(projectId) {
    try {
      const [project, investments, revenues, expenses, monthlyData] = await Promise.all([
        this.getProjectById(projectId),
        this.getProjectInvestments(projectId),
        this.getProjectRevenues(projectId),
        this.getProjectExpenses(projectId),
        this.getMonthlyFinancials(projectId)
      ]);

      const totalInvestment = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const totalRevenue = revenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const netProfitLoss = totalRevenue - totalExpenses;
      const roi = totalInvestment > 0 ? ((netProfitLoss / totalInvestment) * 100).toFixed(2) : 0;
      
      // Calculate member-wise distribution based on investment percentage
      const memberDistribution = investments.reduce((acc, inv) => {
        const memberId = inv.member_id;
        if (!acc[memberId]) {
          acc[memberId] = {
            member: inv.member,
            totalInvestment: 0,
            investmentPercentage: 0,
            profitLossShare: 0
          };
        }
        acc[memberId].totalInvestment += parseFloat(inv.amount);
        return acc;
      }, {});

      // Calculate percentages and profit/loss share
      Object.keys(memberDistribution).forEach(memberId => {
        const member = memberDistribution[memberId];
        member.investmentPercentage = totalInvestment > 0 
          ? ((member.totalInvestment / totalInvestment) * 100).toFixed(2)
          : 0;
        member.profitLossShare = totalInvestment > 0
          ? ((member.totalInvestment / totalInvestment) * netProfitLoss).toFixed(2)
          : 0;
      });

      // Monthly trend analysis
      const monthlyTrend = monthlyData.map(m => ({
        month: m.month,
        year: m.year,
        revenue: parseFloat(m.revenue),
        expenses: parseFloat(m.expenses),
        netProfitLoss: parseFloat(m.net_profit_loss)
      }));

      return {
        project,
        totalInvestment,
        totalRevenue,
        totalExpenses,
        netProfitLoss,
        roi,
        memberDistribution: Object.values(memberDistribution),
        monthlyTrend,
        breakEvenPoint: totalRevenue > 0 && netProfitLoss < 0 
          ? Math.abs(netProfitLoss / (totalRevenue / monthlyData.length || 1)).toFixed(1)
          : 0,
        investmentCount: investments.length,
        memberCount: Object.keys(memberDistribution).length
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to calculate project metrics');
    }
  }

  // Generate Project Completion Report
  async generateCompletionReport(projectId) {
    try {
      const metrics = await this.calculateProjectMetrics(projectId);
      const [investments, revenues, expenses] = await Promise.all([
        this.getProjectInvestments(projectId),
        this.getProjectRevenues(projectId),
        this.getProjectExpenses(projectId)
      ]);

      return {
        ...metrics,
        detailedInvestments: investments.map(inv => ({
          member: inv.member?.name || 'N/A',
          amount: parseFloat(inv.amount),
          date: inv.investment_date,
          percentage: inv.investment_percentage || 0
        })),
        detailedRevenues: revenues.map(rev => ({
          amount: parseFloat(rev.amount),
          date: rev.revenue_date,
          description: rev.description
        })),
        detailedExpenses: expenses.map(exp => ({
          reason: exp.reason,
          amount: parseFloat(exp.amount),
          date: exp.expense_date,
          expenseBy: exp.expense_by
        })),
        reportGeneratedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to generate completion report');
    }
  }
}

const projectsService = new ProjectsService();
export default projectsService;
