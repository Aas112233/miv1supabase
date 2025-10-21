# Investment Club Accounting Application

A React-based web application for managing investment club finances with Google Sheets as the backend database.

## Overview

This application provides a complete accounting solution for investment clubs that need to track:
- Members and their share amounts
- Payments and transactions
- Dividends distribution
- Financial goals
- User permissions and access control

The application features a modern React frontend with a Google Sheets backend, allowing for easy deployment and data persistence without traditional database infrastructure.

## Key Features

- **Member Management**: Track club members, their contact information, and share amounts
- **Payment Tracking**: Record member payments and transaction history
- **Dividend Management**: Calculate and distribute dividends among members
- **Financial Goals**: Set and track investment club financial objectives
- **User Authentication**: Secure login system with role-based access control
- **Audit Logging**: Comprehensive logging of all operations for compliance
- **Responsive Design**: Works on desktop and mobile devices
- **Google Sheets Integration**: Uses Google Sheets as a backend database for easy data management

## Technology Stack

- **Frontend**: React 19, React Router v7, Recharts for data visualization
- **Build Tool**: Vite with rolldown
- **UI Components**: Custom CSS with light/dark theme support
- **Icons**: React Icons
- **Backend**: Google Sheets with Google Apps Script REST API
- **Authentication**: JWT-based authentication system

## Project Structure

```
src/
├── api/                 # API service layer for backend communication
├── components/          # Reusable UI components
├── config/              # Configuration files
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Google account for the Sheets backend

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Setting up the Google Sheets Backend

1. Create a Google Sheet with the required structure (see backend documentation)
2. Deploy the Google Apps Script code as a web app
3. Configure the web app URL in `src/config/apiConfig.js`

## Deployment

The application can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.) after building with `npm run build`.

## Security Considerations

- Passwords are hashed before storage
- JWT tokens for authentication with short expiration times
- Input validation on both frontend and backend
- Role-based access control for different user types
- Comprehensive audit logging of all operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.