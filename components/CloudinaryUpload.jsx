import React, { useState } from 'react';
import './CloudinaryUpload.css';

const CloudinaryUpload = ({ onUploadSuccess, onUploadError, customFilename, existingUrl, onUploadStart }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(existingUrl || '');

  const CLOUDINARY_UPLOAD_PRESET = 'miv1_receipts';
  const CLOUDINARY_CLOUD_NAME = 'dgfqej8rp';

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError?.('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setUploading(true);
    onUploadStart?.(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'receipts');
      if (customFilename) {
        const timestamp = Date.now();
        formData.append('public_id', `${customFilename}_${timestamp}`);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setUploadedUrl(data.secure_url);
        onUploadSuccess?.(data.secure_url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      onUploadStart?.(false);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this receipt?')) {
      setUploadedUrl('');
      onUploadSuccess?.('');
    }
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    const ext = url.split('.').pop().toLowerCase();
    return ext === 'pdf' ? 'pdf' : 'image';
  };

  return (
    <div className="cloudinary-upload">
      {!uploadedUrl ? (
        <div className="upload-area">
          <input
            type="file"
            id="file-upload"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="file-input"
          />
          <label htmlFor="file-upload" className="upload-label">
            {uploading ? (
              <div className="upload-loading">
                <div className="spinner-small"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Click to upload receipt</span>
                <span className="upload-hint">JPG, PNG or PDF (Max 10MB)</span>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="upload-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>File uploaded successfully</span>
          <div className="file-actions">
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="btn-view">
              {getFileExtension(uploadedUrl) === 'pdf' ? 'View PDF' : 'View Image'}
            </a>
            <button type="button" onClick={handleRemove} className="btn-remove">
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
