# API Integration for Munshi Investment Club

This directory contains all the API integration code for connecting the Investment Club application to the Google Sheets backend.

## Directory Structure

```
src/
├── api/                 # API service layer
│   ├── apiClient.js     # Base API client
│   ├── authService.js   # Authentication service
│   ├── membersService.js # Members API service
│   ├── testApi.js       # API testing utilities
│   └── README.md        # This file
├── config/              # Configuration files
│   └── apiConfig.js     # API configuration
├── contexts/            # React contexts
│   └── AuthContext.jsx  # Authentication context
├── hooks/               # Custom hooks
│   └── useMembers.js    # Members data hook
└── ...
```

## Configuration

The API is configured using the `apiConfig.js` file which contains:

- **BASE_URL**: Your Google Apps Script Web App URL
- **ENDPOINTS**: All API endpoints organized by entity

## Services

### ApiClient (`apiClient.js`)
The base API client that handles all HTTP requests to the backend.

### AuthService (`authService.js`)
Handles user authentication including login, logout, and token management.

### MembersService (`membersService.js`)
Handles all member-related operations (CRUD).

## Contexts

### AuthContext (`AuthContext.jsx`)
Provides authentication state and functions throughout the application.

## Hooks

### useMembers (`useMembers.js`)
A custom React hook for managing member data with loading and error states.

## Usage Examples

### Authentication
```javascript
import { useAuth } from '../contexts/AuthContext';

const LoginComponent = () => {
  const { login, logout, currentUser, isLoggedIn } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login('admin@munshiinvestment.com', 'admin123');
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };
};
```

### Member Management
```javascript
import { useMembers } from '../hooks/useMembers';

const MembersComponent = () => {
  const { members, loading, error, createMember, updateMember, deleteMember } = useMembers();
  
  const handleAddMember = async () => {
    try {
      const newMember = await createMember({
        name: 'John Doe',
        contact: 'john@example.com',
        shareAmount: 1000
      });
      console.log('Member created:', newMember);
    } catch (error) {
      console.error('Failed to create member:', error.message);
    }
  };
};
```

## Testing

You can test the API connection by running the `testApi.js` script or by importing and calling `testApiConnection()`.

## Error Handling

All services and hooks include proper error handling. Errors are thrown as JavaScript Error objects with descriptive messages.

## Security

- Authentication tokens are stored in localStorage
- All API calls use HTTPS (provided by Google)
- Passwords are hashed before storage (handled by the backend)