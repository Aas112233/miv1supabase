import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import projectsService from '../api/projectsService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Projects.css';

const Projects = ({ projects, setProjects, members, currentUser }) => {
  const { t: translations } = useLanguage();
  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Planning');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [involvedMemberIds, setInvolvedMemberIds] = useState([]);
  const [initialInvestment, setInitialInvestment] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFinancials, setProjectFinancials] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('projects');
  const [investments, setInvestments] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentDate, setInvestmentDate] = useState('');
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [revenueProjectId, setRevenueProjectId] = useState('');
  const [revenueAmount, setRevenueAmount] = useState('');
  const [revenueDate, setRevenueDate] = useState('');
  const [revenueDescription, setRevenueDescription] = useState('');
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [monthlyProjectId, setMonthlyProjectId] = useState('');
  const [monthlyMonth, setMonthlyMonth] = useState('');
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyRevenueAmount, setMonthlyRevenueAmount] = useState('');
  const [monthlyExpensesAmount, setMonthlyExpensesAmount] = useState('');
  const [monthlyNotes, setMonthlyNotes] = useState('');
  const [monthlyFinancials, setMonthlyFinancials] = useState([]);
  const [editingMonthly, setEditingMonthly] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState(null);
  const [showCompletionReport, setShowCompletionReport] = useState(false);
  const [completionReportData, setCompletionReportData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();
  const navigate = useNavigate();

  useEffect(() => {
    startLoading('projectsData');
    setTimeout(() => {
      stopLoading('projectsData');
    }, 2000);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !category || !startDate || !status) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    startLoading('addProject');
    
    try {
      const newProject = {
        name,
        category,
        description,
        startDate,
        endDate,
        status,
        assignedMemberId: assignedMemberId || null,
        progressPercentage,
        involvedMemberIds,
        initialInvestment: parseFloat(initialInvestment) || 0,
        monthlyRevenue: parseFloat(monthlyRevenue) || 0
      };
      
      const createdProject = await projectsService.createProject(newProject);
      setProjects([...projects, createdProject]);
      resetForm();
      setShowForm(false);
      addToast('Project created successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('addProject');
    }
  };

  const handleEdit = async (project) => {
    setEditingProject(project);
    setName(project.name);
    setCategory(project.category);
    setDescription(project.description || '');
    setStartDate(project.start_date);
    setEndDate(project.end_date || '');
    setStatus(project.status);
    setAssignedMemberId(project.assigned_member_id || '');
    setProgressPercentage(project.progress_percentage || 0);
    setInitialInvestment(project.initial_investment || '');
    setMonthlyRevenue(project.monthly_revenue || '');
    
    try {
      const projectMembers = await projectsService.getProjectMembers(project.id);
      setInvolvedMemberIds(projectMembers.map(pm => pm.member_id));
    } catch (error) {
      setInvolvedMemberIds([]);
    }
    
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !category || !startDate || !status) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    startLoading('editProject');
    
    try {
      const updatedProject = {
        name,
        category,
        description,
        startDate,
        endDate,
        status,
        assignedMemberId: assignedMemberId || null,
        progressPercentage,
        involvedMemberIds,
        initialInvestment: parseFloat(initialInvestment) || 0,
        monthlyRevenue: parseFloat(monthlyRevenue) || 0
      };
      
      await projectsService.updateProject(editingProject.id, updatedProject);
      
      const updatedProjects = projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, ...updatedProject, start_date: startDate, end_date: endDate, assigned_member_id: assignedMemberId, progress_percentage: progressPercentage }
          : p
      );
      
      setProjects(updatedProjects);
      resetForm();
      setShowEditForm(false);
      setEditingProject(null);
      addToast('Project updated successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('editProject');
    }
  };

  const handleDelete = async (projectId) => {
    try {
      startLoading('checkDependencies');
      const check = await projectsService.checkProjectDependencies(projectId);
      stopLoading('checkDependencies');

      if (!check.canDelete) {
        const message = `Cannot delete this project. Please delete the following first:\n\n${check.dependencies.join('\n')}\n\nGo to respective tabs to delete these records.`;
        addToast(message, 'error');
        return;
      }

      if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        startLoading('deleteProject');
        await projectsService.deleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
        addToast('Project deleted successfully!', 'success');
      }
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('deleteProject');
      stopLoading('checkDependencies');
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setStatus('Planning');
    setAssignedMemberId('');
    setProgressPercentage(0);
    setInvolvedMemberIds([]);
    setInitialInvestment('');
    setMonthlyRevenue('');
  };

  const toggleMemberSelection = (memberId) => {
    setInvolvedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAllMembers = () => {
    if (involvedMemberIds.length === members.length) {
      setInvolvedMemberIds([]);
    } else {
      setInvolvedMemberIds(members.map(m => m.id));
    }
  };

  const handleViewDetails = async (project) => {
    setSelectedProject(project);
    startLoading('projectDetails');
    
    try {
      const [financials, projectMembersList] = await Promise.all([
        projectsService.getProjectFinancials(project.id),
        projectsService.getProjectMembers(project.id)
      ]);
      
      setProjectFinancials(financials);
      setProjectMembers(projectMembersList);
      setShowDetailsModal(true);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('projectDetails');
    }
  };

  const handleOpenCalculator = async (project) => {
    setSelectedProject(project);
    startLoading('calculator');
    try {
      const metrics = await projectsService.calculateProjectMetrics(project.id);
      setCalculatorData(metrics);
      setShowCalculator(true);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('calculator');
    }
  };

  const handleGenerateReport = async (project) => {
    setSelectedProject(project);
    startLoading('report');
    try {
      const report = await projectsService.generateCompletionReport(project.id);
      setCompletionReportData(report);
      setShowCompletionReport(true);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('report');
    }
  };

  const calculateMemberShare = (member) => {
    if (!projectFinancials || !member.member) return { amount: 0, percentage: 0 };
    
    const totalShares = projectMembers.reduce((sum, pm) => sum + (pm.member?.share_amount || 0), 0);
    const memberShares = member.member?.share_amount || 0;
    const percentage = totalShares > 0 ? (memberShares / totalShares) * 100 : 0;
    const profitLoss = projectFinancials.profitLoss;
    const memberAmount = totalShares > 0 ? (profitLoss * memberShares) / totalShares : 0;
    
    return { amount: memberAmount, percentage };
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'info',
      'Active': 'success',
      'On Hold': 'warning',
      'Completed': 'primary',
      'Cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  };

  useEffect(() => {
    if (activeTab === 'investments') {
      loadInvestments();
    } else if (activeTab === 'revenues') {
      loadRevenues();
    } else if (activeTab === 'monthly') {
      loadMonthlyFinancials();
    } else if (activeTab === 'expenses') {
      loadExpenses();
    }
  }, [activeTab]);

  const loadInvestments = async () => {
    startLoading('loadInvestments');
    try {
      const allInvestments = [];
      for (const project of projects) {
        const projectInvestments = await projectsService.getProjectInvestments(project.id);
        allInvestments.push(...projectInvestments.map(inv => ({ ...inv, project_name: project.name })));
      }
      setInvestments(allInvestments);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('loadInvestments');
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment? Investment percentages will be recalculated.')) {
      try {
        await projectsService.deleteProjectInvestment(id);
        await loadInvestments();
        addToast('Investment deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      }
    }
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === parseInt(projectId));
    if (project) {
      setInvestmentAmount(project.initial_investment || '');
    }
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedMemberId || !investmentAmount || !investmentDate) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    startLoading('addInvestment');
    try {
      await projectsService.addProjectInvestment({
        projectId: parseInt(selectedProjectId),
        memberId: parseInt(selectedMemberId),
        amount: parseFloat(investmentAmount),
        investmentDate
      });
      await loadInvestments();
      setSelectedProjectId('');
      setSelectedMemberId('');
      setInvestmentAmount('');
      setInvestmentDate('');
      setShowInvestmentForm(false);
      addToast('Investment added successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('addInvestment');
    }
  };

  const handleAddRevenue = async (e) => {
    e.preventDefault();
    if (!revenueProjectId || !revenueAmount || !revenueDate) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    startLoading('addRevenue');
    try {
      await projectsService.addProjectRevenue({
        projectId: parseInt(revenueProjectId),
        amount: parseFloat(revenueAmount),
        revenueDate,
        description: revenueDescription
      });
      await loadRevenues();
      setRevenueProjectId('');
      setRevenueAmount('');
      setRevenueDate('');
      setRevenueDescription('');
      setShowRevenueForm(false);
      addToast('Revenue added successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('addRevenue');
    }
  };

  const loadRevenues = async () => {
    startLoading('loadRevenues');
    try {
      const allRevenues = [];
      for (const project of projects) {
        const projectRevenues = await projectsService.getProjectRevenues(project.id);
        allRevenues.push(...projectRevenues.map(rev => ({ ...rev, project_name: project.name })));
      }
      setRevenues(allRevenues);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('loadRevenues');
    }
  };

  const handleDeleteRevenue = async (id) => {
    if (window.confirm('Are you sure you want to delete this revenue record?')) {
      try {
        await projectsService.deleteProjectRevenue(id);
        await loadRevenues();
        addToast('Revenue deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      }
    }
  };

  const loadExpenses = async () => {
    startLoading('loadExpenses');
    try {
      const allExpenses = [];
      for (const project of projects) {
        const projectExpenses = await projectsService.getProjectExpenses(project.id);
        allExpenses.push(...projectExpenses.map(exp => ({ ...exp, project_name: project.name })));
      }
      setExpenses(allExpenses);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('loadExpenses');
    }
  };

  const loadMonthlyFinancials = async () => {
    startLoading('loadMonthly');
    try {
      const allMonthly = [];
      for (const project of projects) {
        const projectMonthly = await projectsService.getMonthlyFinancials(project.id);
        allMonthly.push(...projectMonthly.map(m => ({ ...m, project_name: project.name })));
      }
      setMonthlyFinancials(allMonthly);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('loadMonthly');
    }
  };

  const handleAddMonthly = async (e) => {
    e.preventDefault();
    if (!monthlyProjectId || !monthlyMonth || !monthlyYear) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    startLoading('addMonthly');
    try {
      if (editingMonthly) {
        await projectsService.updateMonthlyFinancial(editingMonthly.id, {
          revenue: parseFloat(monthlyRevenueAmount) || 0,
          expenses: parseFloat(monthlyExpensesAmount) || 0,
          notes: monthlyNotes
        });
        addToast('Monthly financial updated successfully!', 'success');
      } else {
        await projectsService.addMonthlyFinancial({
          projectId: parseInt(monthlyProjectId),
          month: parseInt(monthlyMonth),
          year: parseInt(monthlyYear),
          revenue: parseFloat(monthlyRevenueAmount) || 0,
          expenses: parseFloat(monthlyExpensesAmount) || 0,
          notes: monthlyNotes
        });
        addToast('Monthly financial added successfully!', 'success');
      }
      await loadMonthlyFinancials();
      resetMonthlyForm();
      setShowMonthlyForm(false);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('addMonthly');
    }
  };

  const handleEditMonthly = (monthly) => {
    setEditingMonthly(monthly);
    setMonthlyProjectId(monthly.project_id);
    setMonthlyMonth(monthly.month);
    setMonthlyYear(monthly.year);
    setMonthlyRevenueAmount(monthly.revenue);
    setMonthlyExpensesAmount(monthly.expenses);
    setMonthlyNotes(monthly.notes || '');
    setShowMonthlyForm(true);
  };

  const handleDeleteMonthly = async (id) => {
    if (window.confirm('Are you sure you want to delete this monthly record?')) {
      try {
        await projectsService.deleteMonthlyFinancial(id);
        await loadMonthlyFinancials();
        addToast('Monthly financial deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      }
    }
  };

  const resetMonthlyForm = () => {
    setMonthlyProjectId('');
    setMonthlyMonth('');
    setMonthlyYear(new Date().getFullYear());
    setMonthlyRevenueAmount('');
    setMonthlyExpensesAmount('');
    setMonthlyNotes('');
    setEditingMonthly(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        return renderProjectsTab();
      case 'investments':
        return renderInvestmentsTab();
      case 'revenues':
        return renderRevenuesTab();
      case 'expenses':
        return renderExpensesTab();
      case 'monthly':
        return renderMonthlyTab();
      case 'analysis':
        return renderAnalysisTab();
      default:
        return renderProjectsTab();
    }
  };

  const renderProjectsTab = () => {
    const filteredProjects = projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
      <div className="projects-list">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t('members.name')}</th>
            <th>{t('projects.category')}</th>
            <th>{t('projects.status')}</th>
            <th>{t('projects.progress')}</th>
            <th>{t('projects.startDate')}</th>
            <th>{t('projects.endDate')}</th>
            <th>{t('projects.assignedTo')}</th>
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project.id}>
              <td>{project.id}</td>
              <td>
                <span 
                  className="project-name-link" 
                  onClick={() => handleViewDetails(project)}
                >
                  {project.name}
                </span>
              </td>
              <td>{project.category}</td>
              <td>
                <span className={`status-badge status-badge--${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </td>
              <td>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress_percentage}%` }}></div>
                  <span className="progress-text">{project.progress_percentage}%</span>
                </div>
              </td>
              <td>{project.start_date}</td>
              <td>{project.end_date || 'N/A'}</td>
              <td>{project.assigned_member?.name || 'Unassigned'}</td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="btn btn--icon btn--info" 
                    title="Calculator"
                    onClick={() => handleOpenCalculator(project)}
                  >
                    <span>Calc</span>
                  </button>
                  {project.status === 'Completed' && (
                    <button 
                      className="btn btn--icon btn--primary" 
                      title="Completion Report"
                      onClick={() => handleGenerateReport(project)}
                    >
                      <span>Report</span>
                    </button>
                  )}
                  {hasWritePermission(currentUser, 'projects') && (
                    <>
                      <button 
                        className="btn btn--icon btn--secondary" 
                        title="Edit Project"
                        onClick={() => handleEdit(project)}
                      >
                        <span>Edit</span>
                      </button>
                      <button 
                        className="btn btn--icon btn--danger" 
                        title="Delete Project"
                        onClick={() => handleDelete(project.id)}
                      >
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    );
  };

  const renderInvestmentsTab = () => {
    const filteredInvestments = investments.filter(inv => 
      inv.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.member?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
      <div className="investments-tab">
        {hasWritePermission(currentUser, 'projects') && (
          <div className="tab-actions">
            <button className="btn btn--primary" onClick={() => setShowInvestmentForm(true)}>Add Investment</button>
          </div>
        )}
        <div className="investments-list">
          {isLoading('loadInvestments') ? (
            <LoadingSpinner />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Percentage</th>
                  {hasWritePermission(currentUser, 'projects') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInvestments.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.project_name}</td>
                    <td>{inv.member?.name || 'N/A'}</td>
                    <td>৳{parseFloat(inv.amount).toFixed(2)}</td>
                    <td>{inv.investment_date}</td>
                    <td>{inv.investment_percentage ? `${parseFloat(inv.investment_percentage).toFixed(2)}%` : 'N/A'}</td>
                    {hasWritePermission(currentUser, 'projects') && (
                      <td>
                        <button 
                          className="btn btn--icon btn--danger" 
                          onClick={() => handleDeleteInvestment(inv.id)}
                          title="Delete Investment"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderRevenuesTab = () => {
    const filteredRevenues = revenues.filter(rev => 
      rev.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.description && rev.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return (
      <div className="revenues-tab">
        {hasWritePermission(currentUser, 'projects') && (
          <div className="tab-actions">
            <button className="btn btn--primary" onClick={() => setShowRevenueForm(true)}>Add Revenue</button>
          </div>
        )}
        <div className="revenues-list">
          {isLoading('loadRevenues') ? (
            <LoadingSpinner />
          ) : (
            <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Description</th>
                {hasWritePermission(currentUser, 'projects') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRevenues.map((rev) => (
                <tr key={rev.id}>
                  <td>{rev.project_name}</td>
                  <td>৳{parseFloat(rev.amount).toFixed(2)}</td>
                  <td>{rev.revenue_date}</td>
                  <td>{rev.description || 'N/A'}</td>
                  {hasWritePermission(currentUser, 'projects') && (
                    <td>
                      <button 
                        className="btn btn--icon btn--danger" 
                        onClick={() => handleDeleteRevenue(rev.id)}
                        title="Delete Revenue"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    );
  };

  const renderExpensesTab = () => {
    const filteredExpenses = expenses.filter(exp => 
      exp.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.reason && exp.reason.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return (
      <div className="expenses-tab">
        {hasWritePermission(currentUser, 'expenses') && (
          <div className="tab-actions">
            <button 
              className="btn btn--primary" 
              onClick={() => navigate('/expenses')}
            >
              Add Expense
            </button>
          </div>
        )}
        <div className="expenses-list">
          {isLoading('loadExpenses') ? (
            <LoadingSpinner />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Expense By</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{exp.project_name}</td>
                      <td>{exp.reason}</td>
                      <td className="text-danger">৳{parseFloat(exp.amount).toFixed(2)}</td>
                      <td>{exp.expense_date}</td>
                      <td>{exp.expense_by}</td>
                      <td>{exp.category || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      No project expenses found. Expenses are managed from the Expenses page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: 0, color: '#1e40af' }}>
            <strong>Note:</strong> To add or manage project expenses, please go to the Expenses page and link them to a project.
          </p>
        </div>
      </div>
    );
  };

  const renderMonthlyTab = () => {
    const filteredMonthly = monthlyFinancials.filter(m => 
      m.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return (
      <div className="monthly-tab">
        {hasWritePermission(currentUser, 'projects') && (
          <div className="tab-actions">
            <button className="btn btn--primary" onClick={() => { resetMonthlyForm(); setShowMonthlyForm(true); }}>Add Monthly Update</button>
          </div>
        )}
        <div className="monthly-list">
          {isLoading('loadMonthly') ? (
            <LoadingSpinner />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Period</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Net Profit/Loss</th>
                  <th>Notes</th>
                  {hasWritePermission(currentUser, 'projects') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMonthly.map((m) => (
                  <tr key={m.id}>
                    <td>{m.project_name}</td>
                    <td>{monthNames[m.month - 1]} {m.year}</td>
                    <td className="text-success">৳{parseFloat(m.revenue).toFixed(2)}</td>
                    <td className="text-danger">৳{parseFloat(m.expenses).toFixed(2)}</td>
                    <td className={parseFloat(m.net_profit_loss) >= 0 ? 'text-success' : 'text-danger'}>
                      ৳{parseFloat(m.net_profit_loss).toFixed(2)}
                    </td>
                    <td>{m.notes || 'N/A'}</td>
                    {hasWritePermission(currentUser, 'projects') && (
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn--icon btn--secondary" onClick={() => handleEditMonthly(m)}>Edit</button>
                          <button className="btn btn--icon btn--danger" onClick={() => handleDeleteMonthly(m.id)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderAnalysisTab = () => {
    const filteredProjects = projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const totalInvestment = filteredProjects.reduce((sum, p) => sum + (p.initial_investment || 0), 0);
    const activeProjects = filteredProjects.filter(p => p.status === 'Active');
    const completedProjects = filteredProjects.filter(p => p.status === 'Completed');
    
    return (
      <div className="analysis-content">
        <div className="analysis-cards">
          <div className="analysis-card">
            <div className="analysis-label">Total Investment</div>
            <div className="analysis-value">৳{totalInvestment.toFixed(2)}</div>
          </div>
          <div className="analysis-card">
            <div className="analysis-label">Active Projects</div>
            <div className="analysis-value">{activeProjects.length}</div>
          </div>
          <div className="analysis-card">
            <div className="analysis-label">Completed Projects</div>
            <div className="analysis-value">{completedProjects.length}</div>
          </div>
          <div className="analysis-card">
            <div className="analysis-label">Success Rate</div>
            <div className="analysis-value">
              {filteredProjects.length > 0 ? ((completedProjects.length / filteredProjects.length) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Projects by Category</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Total Investment</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                filteredProjects.reduce((acc, p) => {
                  if (!acc[p.category]) acc[p.category] = { count: 0, investment: 0 };
                  acc[p.category].count++;
                  acc[p.category].investment += p.initial_investment || 0;
                  return acc;
                }, {})
              ).map(([category, data]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{data.count}</td>
                  <td>৳{data.investment.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isLoading('projectsData')) {
    return (
      <div className="projects">
        <div className="projects-header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-button"></div>
        </div>
        <div className="tabs">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton skeleton-tab"></div>
          ))}
        </div>
        <div className="skeleton skeleton-search"></div>
        <div className="projects-list">
          <div className="skeleton skeleton-table-header"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-table-row"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="projects">
      <div className="projects-header">
        <h2>{t('projects.title')}</h2>
        {hasWritePermission(currentUser, 'projects') && activeTab === 'projects' && (
          <button 
            className="btn btn--primary" 
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            {t('projects.addProject')}
          </button>
        )}
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'projects' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          {t('nav.projects')}
        </button>
        <button 
          className={`tab ${activeTab === 'investments' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          {t('projects.projectInvestments')}
        </button>
        <button 
          className={`tab ${activeTab === 'revenues' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('revenues')}
        >
          {t('projects.projectRevenues')}
        </button>
        <button 
          className={`tab ${activeTab === 'expenses' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          {t('nav.expenses')}
        </button>
        <button 
          className={`tab ${activeTab === 'monthly' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Updates
        </button>
        <button 
          className={`tab ${activeTab === 'analysis' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          {t('projects.analysis')}
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {renderTabContent()}

      {showForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Add New Project</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="project-form">
              <div className="form-section">
                <h3 className="form-section-title">Project Information</h3>
                <div className="form-group">
                  <label htmlFor="name">Project Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Stock Investment">Stock Investment</option>
                      <option value="Business Venture">Business Venture</option>
                      <option value="Technology">Technology</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter project description"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">Timeline & Assignment</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date *</label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="assignedMember">Assign To</label>
                    <select
                      id="assignedMember"
                      value={assignedMemberId}
                      onChange={(e) => setAssignedMemberId(e.target.value)}
                    >
                      <option value="">Select member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="progress">Progress (%)</label>
                    <input
                      type="number"
                      id="progress"
                      value={progressPercentage}
                      onChange={(e) => setProgressPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Involved Members</label>
                  <div className="select-all-wrapper">
                    <label className="checkbox-label select-all">
                      <input
                        type="checkbox"
                        checked={involvedMemberIds.length === members.length && members.length > 0}
                        onChange={handleSelectAllMembers}
                      />
                      <span><strong>Select All</strong></span>
                    </label>
                  </div>
                  <div className="members-checkbox-group">
                    {members.map(member => (
                      <label key={member.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={involvedMemberIds.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                        />
                        <span>{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">Financial Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="initialInvestment">Initial Investment (৳)</label>
                    <input
                      type="number"
                      id="initialInvestment"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(e.target.value)}
                      placeholder="Enter initial investment"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="monthlyRevenue">Monthly Revenue (৳)</label>
                    <input
                      type="number"
                      id="monthlyRevenue"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(e.target.value)}
                      placeholder="Enter monthly revenue"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('addProject') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">Create Project</button>
                    <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Edit Project</h2>
              <button className="close-btn" onClick={() => { setShowEditForm(false); setEditingProject(null); }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="project-form">
              <div className="form-section">
                <h3 className="form-section-title">Project Information</h3>
                <div className="form-group">
                  <label htmlFor="editName">Project Name *</label>
                  <input
                    type="text"
                    id="editName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editCategory">Category *</label>
                    <select
                      id="editCategory"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Stock Investment">Stock Investment</option>
                      <option value="Business Venture">Business Venture</option>
                      <option value="Technology">Technology</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editStatus">Status *</label>
                    <select
                      id="editStatus"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="editDescription">Description</label>
                  <textarea
                    id="editDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter project description"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">Timeline & Assignment</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editStartDate">Start Date *</label>
                    <input
                      type="date"
                      id="editStartDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editEndDate">End Date</label>
                    <input
                      type="date"
                      id="editEndDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editAssignedMember">Assign To</label>
                    <select
                      id="editAssignedMember"
                      value={assignedMemberId}
                      onChange={(e) => setAssignedMemberId(e.target.value)}
                    >
                      <option value="">Select member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editProgress">Progress (%)</label>
                    <input
                      type="number"
                      id="editProgress"
                      value={progressPercentage}
                      onChange={(e) => setProgressPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Involved Members</label>
                  <div className="select-all-wrapper">
                    <label className="checkbox-label select-all">
                      <input
                        type="checkbox"
                        checked={involvedMemberIds.length === members.length && members.length > 0}
                        onChange={handleSelectAllMembers}
                      />
                      <span><strong>Select All</strong></span>
                    </label>
                  </div>
                  <div className="members-checkbox-group">
                    {members.map(member => (
                      <label key={member.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={involvedMemberIds.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                        />
                        <span>{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">Financial Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editInitialInvestment">Initial Investment (৳)</label>
                    <input
                      type="number"
                      id="editInitialInvestment"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(e.target.value)}
                      placeholder="Enter initial investment"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editMonthlyRevenue">Monthly Revenue (৳)</label>
                    <input
                      type="number"
                      id="editMonthlyRevenue"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(e.target.value)}
                      placeholder="Enter monthly revenue"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('editProject') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">Update Project</button>
                    <button type="button" className="btn btn--secondary" onClick={() => { setShowEditForm(false); setEditingProject(null); }}>Cancel</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedProject && (
        <div className="overlay">
          <div className="overlay-content overlay-content--large">
            <div className="overlay-header">
              <h2>{selectedProject.name} - Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            
            {isLoading('projectDetails') ? (
              <LoadingSpinner />
            ) : (
              <div className="project-details">
                <div className="details-section">
                  <h3>Project Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{selectedProject.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge status-badge--${getStatusColor(selectedProject.status)}`}>
                        {selectedProject.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Progress:</span>
                      <span className="detail-value">{selectedProject.progress_percentage}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Start Date:</span>
                      <span className="detail-value">{selectedProject.start_date}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">End Date:</span>
                      <span className="detail-value">{selectedProject.end_date || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Assigned To:</span>
                      <span className="detail-value">{selectedProject.assigned_member?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  {selectedProject.description && (
                    <div className="detail-item detail-item--full">
                      <span className="detail-label">Description:</span>
                      <p className="detail-value">{selectedProject.description}</p>
                    </div>
                  )}
                </div>

                {projectFinancials && (
                  <>
                    <div className="details-section">
                      <h3>Financial Summary</h3>
                      <div className="financial-cards">
                        <div className="financial-card">
                          <div className="financial-label">Initial Investment</div>
                          <div className="financial-value">৳{selectedProject.initial_investment?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div className="financial-card">
                          <div className="financial-label">Total Revenue</div>
                          <div className="financial-value financial-value--success">৳{projectFinancials.totalRevenue.toFixed(2)}</div>
                        </div>
                        <div className="financial-card">
                          <div className="financial-label">Total Expenses</div>
                          <div className="financial-value financial-value--danger">৳{projectFinancials.totalExpenses.toFixed(2)}</div>
                        </div>
                        <div className="financial-card">
                          <div className="financial-label">Profit/Loss</div>
                          <div className={`financial-value ${projectFinancials.profitLoss >= 0 ? 'financial-value--success' : 'financial-value--danger'}`}>
                            ৳{projectFinancials.profitLoss.toFixed(2)}
                          </div>
                        </div>
                        <div className="financial-card">
                          <div className="financial-label">ROI</div>
                          <div className={`financial-value ${projectFinancials.roi >= 0 ? 'financial-value--success' : 'financial-value--danger'}`}>
                            {projectFinancials.roi}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="details-section">
                      <h3>Member Profit/Loss Distribution</h3>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Share Amount</th>
                            <th>Share %</th>
                            <th>Profit/Loss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectMembers.map((pm) => {
                            const share = calculateMemberShare(pm);
                            return (
                              <tr key={pm.id}>
                                <td>{pm.member?.name || 'N/A'}</td>
                                <td>{pm.member?.share_amount || 0}</td>
                                <td>{share.percentage.toFixed(2)}%</td>
                                <td className={share.amount >= 0 ? 'text-success' : 'text-danger'}>
                                  ৳{share.amount.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showInvestmentForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Add Investment</h2>
              <button className="close-btn" onClick={() => setShowInvestmentForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddInvestment}>
              <div className="form-section">
                <div className="form-group">
                  <label>Select Project *</label>
                  <select value={selectedProjectId} onChange={(e) => handleProjectSelect(e.target.value)} required>
                    <option value="">Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Investment (৳)</label>
                  <input type="number" value={selectedProjectId ? projects.find(p => p.id === parseInt(selectedProjectId))?.initial_investment || 0 : 0} disabled />
                </div>
                <div className="form-group">
                  <label>Select Member *</label>
                  <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} required>
                    <option value="">Select a member</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>+ Investment Amount (৳) *</label>
                  <input type="number" value={investmentAmount} onChange={(e) => setInvestmentAmount(e.target.value)} min="0" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Investment Date *</label>
                  <input type="date" value={investmentDate} onChange={(e) => setInvestmentDate(e.target.value)} required />
                </div>
              </div>
              <div className="form-actions">
                {isLoading('addInvestment') ? <LoadingSpinner size="small" /> : (
                  <>
                    <button type="submit" className="btn btn--primary">Add Investment</button>
                    <button type="button" className="btn btn--secondary" onClick={() => setShowInvestmentForm(false)}>Cancel</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showRevenueForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Add Revenue</h2>
              <button className="close-btn" onClick={() => setShowRevenueForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddRevenue}>
              <div className="form-section">
                <div className="form-group">
                  <label>Select Project *</label>
                  <select value={revenueProjectId} onChange={(e) => setRevenueProjectId(e.target.value)} required>
                    <option value="">Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Revenue Amount (৳) *</label>
                  <input type="number" value={revenueAmount} onChange={(e) => setRevenueAmount(e.target.value)} min="0" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Revenue Date *</label>
                  <input type="date" value={revenueDate} onChange={(e) => setRevenueDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={revenueDescription} onChange={(e) => setRevenueDescription(e.target.value)} rows="3" placeholder="Optional description" />
                </div>
              </div>
              <div className="form-actions">
                {isLoading('addRevenue') ? <LoadingSpinner size="small" /> : (
                  <>
                    <button type="submit" className="btn btn--primary">Add Revenue</button>
                    <button type="button" className="btn btn--secondary" onClick={() => setShowRevenueForm(false)}>Cancel</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showMonthlyForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>{editingMonthly ? 'Edit' : 'Add'} Monthly Financial Update</h2>
              <button className="close-btn" onClick={() => { setShowMonthlyForm(false); resetMonthlyForm(); }}>×</button>
            </div>
            <form onSubmit={handleAddMonthly}>
              <div className="form-section">
                <div className="form-group">
                  <label>Select Project *</label>
                  <select value={monthlyProjectId} onChange={(e) => setMonthlyProjectId(e.target.value)} required disabled={editingMonthly}>
                    <option value="">Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Month *</label>
                    <select value={monthlyMonth} onChange={(e) => setMonthlyMonth(e.target.value)} required disabled={editingMonthly}>
                      <option value="">Select month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year *</label>
                    <input type="number" value={monthlyYear} onChange={(e) => setMonthlyYear(e.target.value)} min="2000" max="2100" required disabled={editingMonthly} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Revenue (৳)</label>
                    <input type="number" value={monthlyRevenueAmount} onChange={(e) => setMonthlyRevenueAmount(e.target.value)} min="0" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label>Expenses (৳)</label>
                    <input type="number" value={monthlyExpensesAmount} onChange={(e) => setMonthlyExpensesAmount(e.target.value)} min="0" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={monthlyNotes} onChange={(e) => setMonthlyNotes(e.target.value)} rows="3" placeholder="Optional notes" />
                </div>
                {monthlyRevenueAmount && monthlyExpensesAmount && (
                  <div className="form-group">
                    <label>Net Profit/Loss:</label>
                    <div className={`financial-preview ${(parseFloat(monthlyRevenueAmount) - parseFloat(monthlyExpensesAmount)) >= 0 ? 'text-success' : 'text-danger'}`}>
                      ৳{(parseFloat(monthlyRevenueAmount) - parseFloat(monthlyExpensesAmount)).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-actions">
                {isLoading('addMonthly') ? <LoadingSpinner size="small" /> : (
                  <>
                    <button type="submit" className="btn btn--primary">{editingMonthly ? 'Update' : 'Add'} Monthly Update</button>
                    <button type="button" className="btn btn--secondary" onClick={() => { setShowMonthlyForm(false); resetMonthlyForm(); }}>Cancel</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showCalculator && calculatorData && (
        <div className="overlay">
          <div className="overlay-content overlay-content--large">
            <div className="overlay-header">
              <h2>Project Calculator - {selectedProject?.name}</h2>
              <button className="close-btn" onClick={() => setShowCalculator(false)}>×</button>
            </div>
            {isLoading('calculator') ? (
              <LoadingSpinner />
            ) : (
              <div className="calculator-content">
                <div className="calculator-section">
                  <h3>Financial Overview</h3>
                  <div className="financial-cards">
                    <div className="financial-card">
                      <div className="financial-label">Total Investment</div>
                      <div className="financial-value">৳{calculatorData.totalInvestment.toFixed(2)}</div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">Total Revenue</div>
                      <div className="financial-value financial-value--success">৳{calculatorData.totalRevenue.toFixed(2)}</div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">Total Expenses</div>
                      <div className="financial-value financial-value--danger">৳{calculatorData.totalExpenses.toFixed(2)}</div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">Net Profit/Loss</div>
                      <div className={`financial-value ${calculatorData.netProfitLoss >= 0 ? 'financial-value--success' : 'financial-value--danger'}`}>
                        ৳{calculatorData.netProfitLoss.toFixed(2)}
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">ROI</div>
                      <div className={`financial-value ${calculatorData.roi >= 0 ? 'financial-value--success' : 'financial-value--danger'}`}>
                        {calculatorData.roi}%
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">Break-Even (months)</div>
                      <div className="financial-value">{calculatorData.breakEvenPoint}</div>
                    </div>
                  </div>
                </div>

                <div className="calculator-section">
                  <h3>Member Investment Distribution</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Investment</th>
                        <th>Percentage</th>
                        <th>Profit/Loss Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatorData.memberDistribution.map((member, idx) => (
                        <tr key={idx}>
                          <td>{member.member?.name || 'N/A'}</td>
                          <td>৳{parseFloat(member.totalInvestment).toFixed(2)}</td>
                          <td>{member.investmentPercentage}%</td>
                          <td className={parseFloat(member.profitLossShare) >= 0 ? 'text-success' : 'text-danger'}>
                            ৳{parseFloat(member.profitLossShare).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {calculatorData.monthlyTrend.length > 0 && (
                  <div className="calculator-section">
                    <h3>Monthly Trend</h3>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Revenue</th>
                          <th>Expenses</th>
                          <th>Net P/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculatorData.monthlyTrend.map((m, idx) => (
                          <tr key={idx}>
                            <td>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m.month - 1]} {m.year}</td>
                            <td className="text-success">৳{m.revenue.toFixed(2)}</td>
                            <td className="text-danger">৳{m.expenses.toFixed(2)}</td>
                            <td className={m.netProfitLoss >= 0 ? 'text-success' : 'text-danger'}>৳{m.netProfitLoss.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showCompletionReport && completionReportData && (
        <div className="overlay">
          <div className="overlay-content overlay-content--large">
            <div className="overlay-header">
              <h2>Project Completion Report - {selectedProject?.name}</h2>
              <button className="close-btn" onClick={() => setShowCompletionReport(false)}>×</button>
            </div>
            {isLoading('report') ? (
              <LoadingSpinner />
            ) : (
              <div className="report-content">
                <div className="report-header">
                  <h3>Project Summary</h3>
                  <p><strong>Status:</strong> {completionReportData.project.status}</p>
                  <p><strong>Duration:</strong> {completionReportData.project.start_date} to {completionReportData.project.end_date || 'Ongoing'}</p>
                  <p><strong>Report Generated:</strong> {new Date(completionReportData.reportGeneratedAt).toLocaleString()}</p>
                </div>

                <div className="report-section">
                  <h3>Financial Summary</h3>
                  <div className="financial-cards">
                    <div className="financial-card">
                      <div className="financial-label">Total Investment</div>
                      <div className="financial-value">৳{completionReportData.totalInvestment.toFixed(2)}</div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">Total Revenue</div>
                      <div className="financial-value financial-value--success">৳{completionReportData.totalRevenue.toFixed(2)}</div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">Total Expenses</div>
                      <div className="financial-value financial-value--danger">৳{completionReportData.totalExpenses.toFixed(2)}</div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">Final Profit/Loss</div>
                      <div className={`financial-value ${completionReportData.netProfitLoss >= 0 ? 'financial-value--success' : 'financial-value--danger'}`}>
                        ৳{completionReportData.netProfitLoss.toFixed(2)}
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="financial-label">ROI</div>
                      <div className={`financial-value ${completionReportData.roi >= 0 ? 'financial-value--success' : 'financial-value--danger'}`}>
                        {completionReportData.roi}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="report-section">
                  <h3>Investment Details</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Share %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completionReportData.detailedInvestments.map((inv, idx) => (
                        <tr key={idx}>
                          <td>{inv.member}</td>
                          <td>৳{inv.amount.toFixed(2)}</td>
                          <td>{inv.date}</td>
                          <td>{inv.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h3>Revenue Details</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completionReportData.detailedRevenues.map((rev, idx) => (
                        <tr key={idx}>
                          <td className="text-success">৳{rev.amount.toFixed(2)}</td>
                          <td>{rev.date}</td>
                          <td>{rev.description || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h3>Expense Details</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Reason</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Expense By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completionReportData.detailedExpenses.map((exp, idx) => (
                        <tr key={idx}>
                          <td>{exp.reason}</td>
                          <td className="text-danger">৳{exp.amount.toFixed(2)}</td>
                          <td>{exp.date}</td>
                          <td>{exp.expenseBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h3>Final Distribution</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Investment</th>
                        <th>Share %</th>
                        <th>Profit/Loss Share</th>
                        <th>Final Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completionReportData.memberDistribution.map((member, idx) => {
                        const finalReturn = parseFloat(member.totalInvestment) + parseFloat(member.profitLossShare);
                        return (
                          <tr key={idx}>
                            <td>{member.member?.name || 'N/A'}</td>
                            <td>৳{parseFloat(member.totalInvestment).toFixed(2)}</td>
                            <td>{member.investmentPercentage}%</td>
                            <td className={parseFloat(member.profitLossShare) >= 0 ? 'text-success' : 'text-danger'}>
                              ৳{parseFloat(member.profitLossShare).toFixed(2)}
                            </td>
                            <td className={finalReturn >= parseFloat(member.totalInvestment) ? 'text-success' : 'text-danger'}>
                              ৳{finalReturn.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
