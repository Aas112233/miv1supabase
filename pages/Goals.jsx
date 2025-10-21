import React, { useState, useMemo } from 'react';
import './Goals.css';

const Goals = ({ members, payments, transactions, goals, setGoals, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState('savings');

  // Check if current user is admin
  const isAdmin = currentUser && currentUser.role === 'admin';

  // Calculate total payments (income)
  const totalIncome = useMemo(() => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  // Calculate total investments (from transactions)
  const totalInvestments = useMemo(() => {
    return transactions.reduce((sum, transaction) => {
      if (transaction.type === 'buy') {
        return sum + (transaction.shares * transaction.price);
      }
      return sum;
    }, 0);
  }, [transactions]);

  // Calculate total savings (income - investments)
  const totalSavings = useMemo(() => {
    return totalIncome - totalInvestments;
  }, [totalIncome, totalInvestments]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (goalName && goalAmount && goalTargetDate && goalCategory) {
      const newGoal = {
        id: Date.now(),
        name: goalName,
        amount: parseFloat(goalAmount),
        targetDate: goalTargetDate,
        description: goalDescription,
        category: goalCategory,
        createdAt: new Date().toISOString().split('T')[0],
        currentProgress: 0
      };
      
      setGoals([...goals, newGoal]);
      setGoalName('');
      setGoalAmount('');
      setGoalTargetDate('');
      setGoalDescription('');
      setGoalCategory('savings');
      setShowForm(false);
    }
  };

  // Open the goal form
  const openForm = () => {
    // Only admins can create goals
    if (!isAdmin) {
      return;
    }
    setShowForm(true);
  };

  // Close the goal form
  const closeForm = () => {
    setShowForm(false);
    setGoalName('');
    setGoalAmount('');
    setGoalTargetDate('');
    setGoalDescription('');
    setGoalCategory('savings');
  };

  // Delete a goal
  const deleteGoal = (id) => {
    // Only admins can delete goals
    if (!isAdmin) {
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(goals.filter(goal => goal.id !== id));
    }
  };

  // Update goal progress
  const updateGoalProgress = (id, progress) => {
    // Only admins can update goal progress
    if (!isAdmin) {
      return;
    }
    
    const updatedGoals = goals.map(goal => {
      if (goal.id === id) {
        return { ...goal, currentProgress: progress };
      }
      return goal;
    });
    setGoals(updatedGoals);
  };

  // Predefined goals
  const predefinedGoals = [
    { id: 1, name: 'Total Savings Target', amount: 100000, description: 'Reach 1 lakh BDT in total savings', category: 'savings' },
    { id: 2, name: 'Monthly Savings', amount: 50000, description: 'Save 50,000 BDT per month', category: 'savings' },
    { id: 3, name: 'Member Growth', amount: 50, description: 'Increase membership to 50 people', category: 'membership' },
    { id: 4, name: 'Dividend Distribution', amount: 25000, description: 'Distribute 25,000 BDT in dividends', category: 'dividends' },
    { id: 5, name: 'Investment Portfolio', amount: 500000, description: 'Build investment portfolio worth 5 lakh BDT', category: 'investments' }
  ];

  return (
    <div className="goals">
      <h1>Financial Goals</h1>
      
      <div className="goals-summary">
        <div className="summary-card">
          <h3>Total Income</h3>
          <p className="summary-value">BDT {totalIncome.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Investments</h3>
          <p className="summary-value">BDT {totalInvestments.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Savings</h3>
          <p className="summary-value">BDT {totalSavings.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Predefined Goals Section */}
      <div className="predefined-goals">
        <h2>Predefined Goals</h2>
        <div className="goals-grid">
          {predefinedGoals.map((goal) => (
            <div className="goal-card" key={goal.id}>
              <h3>{goal.name}</h3>
              <p>{goal.description}</p>
              <div className="goal-target">
                <span>Target: BDT {goal.amount.toLocaleString()}</span>
              </div>
              <div className="goal-category">
                <span className={`category-badge category-${goal.category}`}>
                  {goal.category}
                </span>
              </div>
              {isAdmin && (
                <button 
                  className="btn btn--primary btn--small"
                  onClick={() => {
                    const newGoal = {
                      ...goal,
                      id: Date.now() + goal.id,
                      targetDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0], // 1 year from now
                      createdAt: new Date().toISOString().split('T')[0],
                      currentProgress: 0
                    };
                    setGoals([...goals, newGoal]);
                  }}
                >
                  Add Goal
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {isAdmin && (
        <div className="goals-actions">
          <button className="btn btn--primary" onClick={openForm}>
            Create Custom Goal
          </button>
        </div>
      )}
      
      {/* Goal Form */}
      {showForm && isAdmin && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Create Custom Goal</h2>
              <button className="close-btn" onClick={closeForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="goalName">Goal Name:</label>
                <input
                  type="text"
                  id="goalName"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="goalAmount">Target Amount (BDT):</label>
                <input
                  type="number"
                  id="goalAmount"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label htmlFor="goalTargetDate">Target Date:</label>
                <input
                  type="date"
                  id="goalTargetDate"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="goalCategory">Category:</label>
                <select
                  id="goalCategory"
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                >
                  <option value="savings">Savings</option>
                  <option value="investments">Investments</option>
                  <option value="membership">Membership</option>
                  <option value="dividends">Dividends</option>
                  <option value="operational">Operational</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="goalDescription">Description:</label>
                <textarea
                  id="goalDescription"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeForm}>Cancel</button>
                <button type="submit">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Goals List */}
      <div className="goals-list">
        <h2>Active Goals</h2>
        {goals.length === 0 ? (
          <p>No goals have been set yet. Add a predefined goal or create a custom one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Target Amount (BDT)</th>
                <th>Current Progress</th>
                <th>Target Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Created</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {[...goals].reverse().map((goal) => (
                <tr key={goal.id}>
                  <td>{goal.name}</td>
                  <td>{goal.amount.toLocaleString()}</td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-info">
                        <span>{goal.currentProgress || 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${goal.currentProgress || 0}%` }}
                        ></div>
                      </div>
                      {isAdmin && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.currentProgress || 0}
                          onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                          className="progress-slider"
                        />
                      )}
                    </div>
                  </td>
                  <td>{goal.targetDate}</td>
                  <td>
                    <span className={`category-badge category-${goal.category}`}>
                      {goal.category}
                    </span>
                  </td>
                  <td>{goal.description || 'N/A'}</td>
                  <td>{goal.createdAt}</td>
                  {isAdmin && (
                    <td>
                      <button 
                        className="btn btn--danger btn--small"
                        onClick={() => deleteGoal(goal.id)}
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

export default Goals;