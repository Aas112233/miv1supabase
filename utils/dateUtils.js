// Date utility functions for consistent date handling across the app
// Database stores dates in YYYY-DD-MM format, we display in DD-MM-YYYY format

/**
 * Parse database date to standard format (YYYY-MM-DD)
 * Handles both YYYY-MM-DD and YYYY-DD-MM formats
 * @param {string} dateStr - Date string from database
 * @returns {string} - Standard date format (YYYY-MM-DD)
 */
export const parseDbDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const [year, middle, last] = parts;
  const middleNum = parseInt(middle);
  const lastNum = parseInt(last);
  
  // If middle > 12, it's definitely a day (YYYY-DD-MM)
  if (middleNum > 12) {
    return `${year}-${last.padStart(2, '0')}-${middle.padStart(2, '0')}`;
  }
  
  // If last > 12, it's definitely a day, so already YYYY-MM-DD
  if (lastNum > 12) {
    return dateStr;
  }
  
  // Both ≤ 12: Check if last is 01 (likely day 1 in YYYY-DD-MM format)
  // Dates like 2025-05-01, 2025-10-01 are likely YYYY-MM-DD (month-day)
  // Dates like 2025-01-05, 2025-01-10 are likely YYYY-DD-MM (day-month)
  if (middleNum <= 12 && lastNum === 1) {
    // Likely YYYY-MM-DD format (e.g., 2025-05-01 = May 1st)
    return dateStr;
  }
  
  // Default: treat as YYYY-DD-MM and convert
  return `${year}-${last.padStart(2, '0')}-${middle.padStart(2, '0')}`;
};

/**
 * Format date to DD-MM-YYYY display format
 * @param {string} dateStr - Date string from database
 * @returns {string} - Formatted date (DD-MM-YYYY)
 */
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  
  const standardDate = parseDbDate(dateStr);
  const [year, month, day] = standardDate.split('-');
  
  return `${day}-${month}-${year}`;
};

/**
 * Format date for database storage (YYYY-DD-MM)
 * @param {string} dateStr - Date string in DD-MM-YYYY format
 * @returns {string} - Database format (YYYY-DD-MM)
 */
export const formatDateForDb = (dateStr) => {
  if (!dateStr) return null;
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`;
  }
  
  return dateStr;
};

/**
 * Get month key for grouping (YYYY-MM)
 * @param {string} dateStr - Date string from database
 * @returns {string} - Month key (e.g., '2025-05')
 */
export const getMonthKey = (dateStr) => {
  if (!dateStr) return '';
  
  const standardDate = parseDbDate(dateStr);
  return standardDate.substring(0, 7);
};

/**
 * Get month name from database date
 * @param {string} dateStr - Date string from database
 * @returns {string} - Month name (e.g., 'May 2025')
 */
export const getMonthName = (dateStr) => {
  if (!dateStr) return '';
  
  const standardDate = parseDbDate(dateStr);
  const [year, month] = standardDate.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};
