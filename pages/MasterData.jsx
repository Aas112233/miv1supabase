import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import masterDataService from '../api/masterDataService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './MasterData.css';

const MasterData = ({ currentUser }) => {
  const [masterData, setMasterData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('payment_method');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [value, setValue] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  const categories = [
    { id: 'club_name', name: 'Club Name' },
    { id: 'cashier_name', name: 'Cashier Names' },
    { id: 'payment_method', name: 'Payment Methods' },
    { id: 'expense_category', name: 'Expense Categories' },
    { id: 'project_category', name: 'Project Categories' },
    { id: 'project_status', name: 'Project Status' },
    { id: 'deduct_from', name: 'Deduct From Options' },
    { id: 'fund_type', name: 'Fund Types' },
    { id: 'fund_transaction_type', name: 'Fund Transaction Types' },
    { id: 'fund_transaction_status', name: 'Fund Transaction Status' },
    { id: 'fund_source_type', name: 'Fund Source Types' }
  ];

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    startLoading('loadMasterData');
    try {
      const data = await masterDataService.getAllMasterData();
      setMasterData(data);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('loadMasterData');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      addToast('Please enter a value', 'error');
      return;
    }

    startLoading('saveMasterData');
    try {
      if (editingItem) {
        await masterDataService.updateMasterData(editingItem.id, { value, display_order: displayOrder });
        addToast('Item updated successfully!', 'success');
      } else {
        await masterDataService.createMasterData({ category: selectedCategory, value, display_order: displayOrder });
        addToast('Item added successfully!', 'success');
      }
      await loadMasterData();
      resetForm();
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('saveMasterData');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setValue(item.value);
    setDisplayOrder(item.display_order);
    setSelectedCategory(item.category);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await masterDataService.deleteMasterData(id);
        await loadMasterData();
        addToast('Item deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      }
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await masterDataService.updateMasterData(item.id, { is_active: !item.is_active });
      await loadMasterData();
      addToast(`Item ${item.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    }
  };

  const resetForm = () => {
    setValue('');
    setDisplayOrder(0);
    setEditingItem(null);
    setShowForm(false);
  };

  const filteredData = masterData.filter(item => item.category === selectedCategory);

  return (
    <div className="master-data">
      <div className="master-data-header">
        <h2>Master Data Configuration</h2>
        <p className="subtitle">Manage dropdown values and configuration options</p>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`tab ${selectedCategory === cat.id ? 'tab--active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="master-data-content">
        <div className="content-header">
          <h3>{categories.find(c => c.id === selectedCategory)?.name}</h3>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>Add Item</button>
        </div>

        {isLoading('loadMasterData') ? (
          <LoadingSpinner />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Value</th>
                <th>Display Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id}>
                  <td>{item.value}</td>
                  <td>{item.display_order}</td>
                  <td>
                    <span className={`status-badge status-badge--${item.is_active ? 'success' : 'danger'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn--icon btn--secondary" onClick={() => handleEdit(item)}>Edit</button>
                      <button 
                        className={`btn btn--icon ${item.is_active ? 'btn--warning' : 'btn--success'}`}
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn--icon btn--danger" onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={!!editingItem}>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Value *</label>
                <input type="text" value={value} onChange={(e) => setValue(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value))} />
              </div>
              <div className="form-actions">
                {isLoading('saveMasterData') ? <LoadingSpinner size="small" /> : (
                  <>
                    <button type="submit" className="btn btn--primary">{editingItem ? 'Update' : 'Add'}</button>
                    <button type="button" className="btn btn--secondary" onClick={resetForm}>Cancel</button>
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

export default MasterData;
