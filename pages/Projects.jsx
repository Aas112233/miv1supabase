import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import projectsService from '../api/projectsService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './Projects.css';

const Projects = ({ projects, setProjects, members, currentUser }) => {
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
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

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
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsService.deleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
        addToast('Project deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      }
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        return renderProjectsTab();
      case 'investments':
        return renderInvestmentsTab();
      case 'revenues':
        return renderRevenuesTab();
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
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Assigned To</th>
            <th>Actions</th>
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
                {hasWritePermission(currentUser, 'projects') && (
                  <div className="action-buttons">
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
                  </div>
                )}
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
                </tr>
              </thead>
              <tbody>
                {filteredInvestments.map((inv, idx) => (
                  <tr key={idx}>
                    <td>{inv.project_name}</td>
                    <td>{inv.member?.name || 'N/A'}</td>
                    <td>৳{inv.amount}</td>
                    <td>{inv.investment_date}</td>
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
              </tr>
            </thead>
            <tbody>
              {filteredRevenues.map((rev, idx) => (
                <tr key={idx}>
                  <td>{rev.project_name}</td>
                  <td>৳{rev.amount}</td>
                  <td>{rev.revenue_date}</td>
                  <td>{rev.description || 'N/A'}</td>
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

  return (
    <div className="projects">
      <div className="projects-header">
        <h2>Projects Management</h2>
        {hasWritePermission(currentUser, 'projects') && activeTab === 'projects' && (
          <button 
            className="btn btn--primary" 
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Add Project
          </button>
        )}
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'projects' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button 
          className={`tab ${activeTab === 'investments' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          Project Investments
        </button>
        <button 
          className={`tab ${activeTab === 'revenues' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('revenues')}
        >
          Project Revenues
        </button>
        <button 
          className={`tab ${activeTab === 'analysis' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
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
    </div>
  );
};

export default Projects;
