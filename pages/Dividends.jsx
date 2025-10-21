import React, { useState, useMemo } from 'react';
import './Dividends.css';

const Dividends = ({ members, payments, transactions, dividends, setDividends }) => {
  const [showForm, setShowForm] = useState(false);
  const [dividendAmount, setDividendAmount] = useState('');
  const [dividendDate, setDividendDate] = useState(new Date().toISOString().split('T')[0]);
  const [dividendPeriod, setDividendPeriod] = useState('');
  const [description, setDescription] = useState('');

  // Calculate total shares in the club
  const totalShares = useMemo(() => {
    return members.reduce((total, member) => total + member.shareAmount, 0);
  }, [members]);

  // Calculate dividend distribution for each member
  const dividendDistribution = useMemo(() => {
    if (!dividendAmount || totalShares === 0) return [];
    
    const amountPerShare = parseFloat(dividendAmount) / totalShares;
    
    return members.map(member => {
      const memberDividend = member.shareAmount * amountPerShare;
      return {
        memberId: member.id,
        memberName: member.name,
        shares: member.shareAmount,
        dividendAmount: memberDividend.toFixed(2)
      };
    });
  }, [members, dividendAmount, totalShares]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (dividendAmount && dividendDate && dividendPeriod) {
      const newDividend = {
        id: Date.now(),
        amount: parseFloat(dividendAmount),
        date: dividendDate,
        period: dividendPeriod,
        description,
        totalShares,
        distribution: dividendDistribution
      };
      
      setDividends([...dividends, newDividend]);
      setDividendAmount('');
      setDividendDate(new Date().toISOString().split('T')[0]);
      setDividendPeriod('');
      setDescription('');
      setShowForm(false);
    }
  };

  // Open the dividend form
  const openForm = () => {
    setShowForm(true);
  };

  // Close the dividend form
  const closeForm = () => {
    setShowForm(false);
    setDividendAmount('');
    setDividendDate(new Date().toISOString().split('T')[0]);
    setDividendPeriod('');
    setDescription('');
  };

  return (
    <div className="dividends">
      <h1>Dividends Management</h1>
      
      <div className="dividends-summary">
        <div className="summary-card">
          <h3>Total Shares</h3>
          <p className="summary-value">{totalShares}</p>
        </div>
        <div className="summary-card">
          <h3>Total Dividends Distributed</h3>
          <p className="summary-value">BDT {dividends.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Latest Dividend</h3>
          <p className="summary-value">
            {dividends.length > 0 
              ? `BDT ${dividends[dividends.length - 1].amount.toFixed(2)}` 
              : 'None'}
          </p>
        </div>
      </div>
      
      <div className="dividends-actions">
        <button className="btn btn--primary" onClick={openForm}>
          Distribute Dividend
        </button>
      </div>
      
      {/* Dividend Distribution Form */}
      {showForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Distribute Dividend</h2>
              <button className="close-btn" onClick={closeForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="dividendAmount">Dividend Amount (BDT):</label>
                <input
                  type="number"
                  id="dividendAmount"
                  value={dividendAmount}
                  onChange={(e) => setDividendAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label htmlFor="dividendDate">Dividend Date:</label>
                <input
                  type="date"
                  id="dividendDate"
                  value={dividendDate}
                  onChange={(e) => setDividendDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="dividendPeriod">Dividend Period:</label>
                <input
                  type="text"
                  id="dividendPeriod"
                  value={dividendPeriod}
                  onChange={(e) => setDividendPeriod(e.target.value)}
                  placeholder="e.g., Q1 2023, Annual 2022"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                />
              </div>
              
              {dividendAmount && totalShares > 0 && (
                <div className="distribution-preview">
                  <h3>Distribution Preview</h3>
                  <p>Amount per share: BDT {(parseFloat(dividendAmount) / totalShares).toFixed(4)}</p>
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Shares</th>
                        <th>Dividend (BDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dividendDistribution.map((dist, index) => (
                        <tr key={index}>
                          <td>{dist.memberName}</td>
                          <td>{dist.shares}</td>
                          <td>{dist.dividendAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="form-actions">
                <button type="button" onClick={closeForm}>Cancel</button>
                <button type="submit" disabled={!dividendAmount || !dividendPeriod}>
                  Distribute Dividend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Dividend History */}
      <div className="dividends-history">
        <h2>Dividend History</h2>
        {dividends.length === 0 ? (
          <p>No dividends have been distributed yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Period</th>
                <th>Amount (BDT)</th>
                <th>Total Shares</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[...dividends].reverse().map((dividend) => (
                <tr key={dividend.id}>
                  <td>{dividend.date}</td>
                  <td>{dividend.period}</td>
                  <td>{dividend.amount.toFixed(2)}</td>
                  <td>{dividend.totalShares}</td>
                  <td>{dividend.description || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Member Distribution Details */}
      {dividends.length > 0 && (
        <div className="member-distribution">
          <h2>Latest Distribution Details</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Shares</th>
                <th>Dividend (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {dividends[dividends.length - 1].distribution.map((dist, index) => (
                <tr key={index}>
                  <td>{dist.memberName}</td>
                  <td>{dist.shares}</td>
                  <td>{dist.dividendAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dividends;