# Investment Club Accounting System

A comprehensive web application for managing investment club finances with Google Sheets as the backend database.

## Features

- Member management (add, edit, remove members)
- Payment tracking
- Transaction history
- Dividend distribution
- Financial reporting
- User authentication and authorization
- Responsive design for desktop and mobile
- Dark/light theme support

## Technology Stack

- **Frontend**: React 18+, React Router, Recharts for data visualization
- **UI Components**: Custom CSS with responsive design
- **State Management**: React Context API
- **Backend**: Google Sheets with Google Apps Script REST API
- **Authentication**: JWT-based authentication system
- **Build Tool**: Vite

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Google account for the Sheets backend

## Installation

1. Clone the repository:
   \\\ash
   git clone <repository-url>
   \\\

2. Install dependencies:
   \\\ash
   npm install
   \\\

3. Start the development server:
   \\\ash
   npm run dev
   \\\

4. Build for production:
   \\\ash
   npm run build
   \\\

## Google Sheets Backend Setup

1. Create a Google Sheet with the required structure
2. Deploy the Google Apps Script code as a web app
3. Configure the web app URL in \src/config/apiConfig.js\

## Deployment

The application can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.) after building with \
pm run build\.

## License

This project is licensed under the MIT License.
