# Moka Interview Management System - Port Configuration

## 📋 Port Requirements

The Moka Interview Management System uses the following ports for production deployment:

- **Frontend**: Port `13000`
- **Backend**: Port `13001`

These ports are standardized across all environments and must be used consistently in:

- Docker Compose configuration
- Environment variables
- API client configuration
- Reverse proxy configuration (if applicable)

## 🔧 Configuration Files

### Environment Variables

**Root `.env.example` and `.env.production.example`:**

```env
# Backend Configuration
BACKEND_PORT=13001

# Frontend Configuration
FRONTEND_PORT=13000

# API Address (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:13001
```

**Backend `.env` files:**

```env
PORT=13001
HOST=0.0.0.0
```

**Frontend `.env` files:**

```env
NEXT_PUBLIC_API_URL=http://localhost:13001
NEXT_PUBLIC_APP_URL=http://localhost:13000
```

### Docker Compose

**docker-compose.yml:**

```yaml
services:
  backend:
    ports:
      - "${BACKEND_PORT:-13001}:13001"
    environment:
      - PORT=13001

  frontend:
    ports:
      - "${FRONTEND_PORT:-13000}:13000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:13001}
```

### Dockerfiles

**Backend Dockerfile:**

```dockerfile
EXPOSE 13001
```

**Frontend Dockerfile:**

```dockerfile
EXPOSE 13000
ENV PORT=13000
```

### Application Code

**Backend (`src/main.ts`):**

```typescript
const port = process.env.PORT || 13001;
```

**Frontend API Configuration (`src/lib/api.ts`):**

```typescript
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:13001";
```

## ⚠️ Migration Notes

All hardcoded references to old ports (3000, 3001, 3002) must be updated to use the new standard ports (13000, 13001).

### Common Issues to Fix:

1. **Frontend API calls**: Replace all hardcoded `http://localhost:3001` URLs with the `getApiUrl()` function from `src/lib/api.ts`

2. **Environment variables**: Ensure all `.env` files use the correct ports

3. **Docker configuration**: Verify that docker-compose.yml and Dockerfiles expose the correct ports

4. **Documentation**: Update all README files and documentation to reflect the new port numbers

## 🚀 Deployment Checklist

- [ ] Backend service runs on port 13001
- [ ] Frontend service runs on port 13000
- [ ] Frontend can successfully connect to backend API on port 13001
- [ ] Health checks pass for both services
- [ ] All environment variables are correctly configured
- [ ] Docker containers expose the correct ports
- [ ] Firewalls/security groups allow traffic on ports 13000 and 13001

## 🔒 Security Considerations

- Only open ports 13000 and 13001 to external traffic
- Use reverse proxy with SSL termination for production deployments
- Never expose database ports (5432) to external networks
- Implement proper authentication and authorization for API endpoints

---

_Last updated: March 13, 2026_
