export const getUserFriendlyError = (error) => {
  const errorMessage = error?.message || '';
  
  // Foreign key constraint violations
  if (errorMessage.includes('foreign key constraint') && errorMessage.includes('members')) {
    if (errorMessage.includes('project_investments')) {
      return 'Cannot delete this member because they have investments in projects. Please remove their investments first.';
    }
    if (errorMessage.includes('project_members')) {
      return 'Cannot delete this member because they are assigned to projects. Please remove them from projects first.';
    }
    if (errorMessage.includes('payments')) {
      return 'Cannot delete this member because they have payment records. Please remove their payments first.';
    }
    return 'Cannot delete this member because they have related records. Please remove those records first.';
  }
  
  if (errorMessage.includes('foreign key constraint') && errorMessage.includes('projects')) {
    return 'Cannot delete this project because it has related records (investments, revenues, or expenses). Please remove those records first.';
  }
  
  // Unique constraint violations
  if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
    if (errorMessage.includes('email')) {
      return 'This email address is already registered.';
    }
    if (errorMessage.includes('name')) {
      return 'This name already exists. Please use a different name.';
    }
    return 'This record already exists. Please use different values.';
  }
  
  // Permission errors
  if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  // Authentication errors
  if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
    return 'Your session has expired. Please log in again.';
  }
  
  // Default fallback
  return 'An error occurred. Please try again or contact support if the problem persists.';
};
