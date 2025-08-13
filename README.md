# Manufacturing Tool Management System

A comprehensive tool management application for manufacturing facilities with bilingual support (English/Chinese).

## Features

- **Tool Management**: Complete CRUD operations for tools with detailed tracking
- **Maintenance Scheduling**: Track maintenance history and upcoming maintenance
- **Dashboard**: Real-time overview of tool status, conditions, and critical alerts
- **Multi-language Support**: Full support for English and Chinese interfaces
- **User Authentication**: Role-based access control (Admin, Supervisor, Operator)
- **Usage Tracking**: Monitor tool usage with production order association
- **Condition Monitoring**: Track tool conditions and schedule preventive maintenance

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- bcrypt for password hashing

### Frontend
- React with TypeScript
- Material-UI components
- i18next for internationalization
- Recharts for data visualization
- Axios for API communication

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup

1. Clone the repository
2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd backend/frontend
npm install --legacy-peer-deps
```

4. Start the backend server:
```bash
npm run dev
```

5. Start the frontend development server:
```bash
cd backend/frontend
npm start
```

The backend will run on http://localhost:5000 and frontend on http://localhost:3000

### Production Deployment with Docker

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

The application will be available at http://localhost

## Default Login

- Username: admin
- Password: admin123

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Tools
- GET `/api/tools` - Get all tools
- GET `/api/tools/:id` - Get tool by ID
- POST `/api/tools` - Create new tool
- PUT `/api/tools/:id` - Update tool
- DELETE `/api/tools/:id` - Delete tool
- POST `/api/tools/:id/usage` - Start tool usage
- PUT `/api/tools/:id/usage/:usageId/end` - End tool usage

### Maintenance
- GET `/api/maintenance` - Get maintenance records
- POST `/api/maintenance` - Create maintenance record
- GET `/api/maintenance/upcoming` - Get upcoming maintenance
- GET `/api/maintenance/overdue` - Get overdue maintenance

### Dashboard
- GET `/api/dashboard/stats` - Get dashboard statistics
- GET `/api/dashboard/tool-status-distribution` - Get tool status distribution
- GET `/api/dashboard/tool-condition-distribution` - Get tool condition distribution
- GET `/api/dashboard/recent-activities` - Get recent activities
- GET `/api/dashboard/critical-tools` - Get critical tools requiring attention

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production
DB_PATH=./database/tools.db
NODE_ENV=development
```

## Database Schema

The system uses SQLite with the following main tables:
- `users` - User accounts and roles
- `tools` - Tool inventory and specifications
- `maintenance_records` - Maintenance history and scheduling
- `tool_usage` - Usage tracking with production orders
- `tool_conditions` - Condition reports and issues

## License

MIT