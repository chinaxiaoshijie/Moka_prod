# Moka Interview Management System

A comprehensive hiring and interview management system for modern recruitment teams.

## Features

- **Candidate Management**: Track candidates through the entire hiring process
- **Interview Scheduling**: Schedule and manage interviews with multiple interviewers
- **Interview Feedback**: Collect and analyze feedback from interviewers
- **Position Tracking**: Manage job positions and hiring progress
- **Analytics Dashboard**: Get insights into your hiring funnel and team performance
- **Resume Parsing**: Upload and parse candidate resumes automatically
- **Notification System**: Stay updated with real-time notifications

## Tech Stack

- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma ORM
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, Docker Compose
- **Package Manager**: Bun

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Bun (or Node.js 18+)

### Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/chinaxiaoshijie/Moka_prod.git
   cd Moka_prod
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   # Update the .env file with your configuration
   ```

3. Start the application with Docker Compose:

   ```bash
   docker compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:13000
   - Backend API: http://localhost:13001

### Manual Setup

1. Install dependencies:

   ```bash
   # Backend
   cd backend
   bun install

   # Frontend
   cd frontend
   bun install
   ```

2. Set up the database:

   ```bash
   # Run database migrations
   cd backend
   bunx prisma migrate dev
   ```

3. Start the services:

   ```bash
   # Backend
   cd backend
   bun run start

   # Frontend
   cd frontend
   bun run dev
   ```

## Environment Variables

Check the `.env.example` file for all available environment variables.

## Ports

- **Frontend**: 13000
- **Backend**: 13001
- **Database**: 5432

## Docker Compose

The project includes a `docker-compose.yml` file for easy deployment:

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f
```

## License

This project is proprietary and confidential.

## Support

For issues and support, please contact the development team.

## 🚀 Production Deployment

### One-click Deployment Script

For deployment to your production server (e.g., 10.10.2.131):

```bash
# Copy the deployment script to your server
scp deploy-moka.sh malong@10.10.2.131:/tmp/

# Run the deployment script on the server
ssh malong@10.10.2.131 'bash /tmp/deploy-moka.sh'
```

### Manual Deployment Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/chinaxiaoshijie/Moka_prod.git
   cd Moka_prod
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your production configuration
   vim .env
   ```

3. **Start services**:
   ```bash
   docker compose up -d
   ```

4. **Verify deployment**:
   ```bash
   # Check container status
   docker compose ps
   
   # Check logs
   docker compose logs -f
   ```

### System Requirements

- Ubuntu 20.04+ or Debian 11+
- Docker 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM, 20GB disk space

See [SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md) for detailed requirements.
