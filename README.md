# Investment Club Accounting System

A comprehensive web application for managing investment club finances with Supabase as the backend.

## Features

- Member management (add, edit, remove members)
- Payment tracking
- Transaction history
- Dividend distribution
- Financial reporting
- User authentication and authorization
- Responsive design for desktop and mobile
- Dark/light theme support
- Multi-language support (English, Bengali)
- Role-based access control
- Audit logging
- Project investment tracking

## Technology Stack

- **Frontend**: React 18+, React Router, Recharts for data visualization
- **UI Components**: Custom CSS with responsive design and react-icons
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Authentication**: Supabase Auth with Row Level Security
- **Build Tool**: Vite

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account (or local instance with Docker)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

- `/api` - Service files for interacting with Supabase backend
- `/components` - Reusable React components
- `/config` - Configuration files
- `/contexts` - React context providers
- `/docs` - Documentation files
- `/hooks` - Custom React hooks
- `/locales` - Language translation files
- `/pages` - Page components
- `/scripts` - Utility scripts
- `/sql` - Database schema and migration files
- `/src` - Main source files
- `/supabase` - Supabase configuration and local development setup

## Supabase Setup

1. Create a Supabase project at https://app.supabase.io/
2. Configure your database schema using the files in the `/sql` directory
3. Set up authentication and configure Row Level Security (RLS) policies
4. Add your Supabase credentials to the `.env` file

For local development with Supabase:
1. Install the Supabase CLI
2. Run `supabase start` in the `/supabase` directory

## Deployment

The application can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.) after building with `npm run build`.

You will also need to deploy your Supabase backend separately.

## License

This project is licensed under the MIT License.