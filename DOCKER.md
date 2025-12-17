# Docker Deployment Guide

This document explains how to deploy the Feedbacks application using Docker.

## Quick Start

```bash
# 1. Clone the repository and navigate to the project
cd Feedbacks

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env and set your JWT_SECRET and other settings

# 3. Build and start the containers
docker-compose up -d --build

# 4. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3001
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                          │
│                    (feedbacks-network)                       │
│                                                              │
│  ┌─────────────────────┐      ┌─────────────────────────┐   │
│  │    Frontend         │      │       Backend           │   │
│  │    (nginx)          │      │    (Node.js API)        │   │
│  │                     │      │                         │   │
│  │  Port 80 ──────────────────│──── Port 3001          │   │
│  │                     │      │                         │   │
│  │  Static React App   │      │  ┌─────────────────┐   │   │
│  │                     │      │  │  SQLite DB      │   │   │
│  └─────────────────────┘      │  │  (volume)       │   │   │
│                               │  └─────────────────┘   │   │
│                               │  ┌─────────────────┐   │   │
│                               │  │  Uploads        │   │   │
│                               │  │  (volume)       │   │   │
│                               │  └─────────────────┘   │   │
│                               └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main orchestration file |
| `docker-compose.dev.yml` | Development overrides |
| `.env.example` | Environment template |
| `backend/Dockerfile` | Backend container build |
| `backend/.dockerignore` | Backend build exclusions |
| `frontend/Dockerfile` | Frontend production build |
| `frontend/Dockerfile.dev` | Frontend development build |
| `frontend/nginx.conf` | Nginx configuration |
| `frontend/.dockerignore` | Frontend build exclusions |

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend
BACKEND_PORT=3001
JWT_SECRET=your-secure-random-string-here

# Frontend
FRONTEND_PORT=80
VITE_API_URL=http://localhost:3001
```

### Generating a Secure JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Commands

### Production

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v
```

### Development

```bash
# Start with hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

### Database Management

```bash
# Access the database
docker-compose exec backend sh
npx prisma studio

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy

# Reset database (WARNING: deletes all data!)
docker-compose exec backend npx prisma migrate reset --force
```

### Backup and Restore

```bash
# Backup database
docker cp feedbacks-backend:/app/data/feedbacks.db ./backup.db

# Restore database
docker cp ./backup.db feedbacks-backend:/app/data/feedbacks.db
docker-compose restart backend

# Backup uploads
docker cp feedbacks-backend:/app/uploads ./uploads-backup
```

## Volumes

| Volume | Path in Container | Purpose |
|--------|-------------------|---------|
| `feedbacks-data` | `/app/data` | SQLite database |
| `feedbacks-uploads` | `/app/uploads` | Uploaded files (logos) |

## Ports

| Service | Container Port | Default Host Port |
|---------|----------------|-------------------|
| Frontend | 80 | 80 |
| Backend | 3001 | 3001 |

---

# Potential Pitfalls and Solutions

## 1. Frontend API URL is Baked at Build Time

**Problem**: Vite environment variables (`VITE_*`) are embedded into the JavaScript bundle during build. They cannot be changed at runtime.

**Impact**: If you change `VITE_API_URL` after building, you must rebuild the frontend container.

**Solution**:
```bash
# Rebuild frontend when changing API URL
docker-compose build frontend
docker-compose up -d frontend
```

**Alternative**: Use nginx as a reverse proxy (uncomment the proxy section in `nginx.conf`) and set `VITE_API_URL=/api`.

## 2. SQLite Database Persistence

**Problem**: SQLite database is stored inside the container. Without proper volume mounting, data is lost when container is removed.

**Solution**: The `docker-compose.yml` already mounts a named volume for persistence:
```yaml
volumes:
  - feedbacks-data:/app/data
```

**Warning**: Running `docker-compose down -v` will DELETE the volume and all data!

## 3. File Upload Persistence

**Problem**: Uploaded logos/files are stored in `/app/uploads`. Without volume mounting, uploads are lost.

**Solution**: Already handled with:
```yaml
volumes:
  - feedbacks-uploads:/app/uploads
```

## 4. CORS Configuration

**Problem**: Frontend running on different origin than backend may cause CORS issues.

**Current Behavior**: Backend has CORS enabled for all origins (`cors()` with default options).

**Production Recommendation**: Restrict CORS to specific origins:
```typescript
// In backend/src/index.ts
app.use(cors({
  origin: ['http://localhost', 'https://yourdomain.com'],
  credentials: true
}));
```

## 5. JWT Secret Security

**Problem**: Default JWT secret in code is insecure.

**Solution**:
1. Always set `JWT_SECRET` in production
2. Use a strong, random value (32+ characters)
3. Never commit secrets to version control

```bash
# Generate secure secret
openssl rand -base64 32
```

## 6. Prisma Client Generation

**Problem**: Prisma client must be generated for the specific platform (Alpine Linux in Docker).

**Solution**: The Dockerfile runs `npx prisma generate` during build, which generates the client for the container's platform.

**If issues occur**:
```bash
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

## 7. Database Migrations

**Problem**: Database schema changes require migrations.

**Solution**: The container runs `npx prisma migrate deploy` on startup.

**For new migrations**:
```bash
# Develop locally first
cd backend
npx prisma migrate dev --name your_migration_name

# Then rebuild container
docker-compose build backend
docker-compose up -d backend
```

## 8. Health Checks Timing

**Problem**: Frontend depends on backend health check, which may fail if backend takes time to start.

**Solution**: Configured with `start_period` to allow initialization time:
```yaml
healthcheck:
  start_period: 10s
```

## 9. Alpine Linux Compatibility

**Problem**: Some npm packages require native compilation and may fail on Alpine.

**Solution**: The Dockerfiles install `openssl` which is required by Prisma. If other packages fail, add build dependencies:
```dockerfile
RUN apk add --no-cache python3 make g++
```

## 10. File Permissions in Container

**Problem**: Files created inside container may have wrong ownership.

**Solution**: Dockerfiles create appropriate directories with correct ownership:
```dockerfile
RUN mkdir -p /app/data /app/uploads && \
    chown -R nodejs:nodejs /app
```

## 11. Development vs Production Builds

**Problem**: Development features shouldn't be in production builds.

**Solution**:
- Production Dockerfile uses multi-stage builds
- `NODE_ENV=production` is set
- Only production dependencies installed with `npm ci --only=production`

## 12. Network Isolation

**Problem**: Services need to communicate internally.

**Solution**: Both services are on the same Docker network (`feedbacks-network`). Backend can be referenced as `backend:3001` from frontend container.

## 13. SSL/HTTPS in Production

**Problem**: The default setup uses HTTP only.

**Solution**: For production, use a reverse proxy (Traefik, nginx-proxy, or cloud load balancer) with SSL termination:

```yaml
# Example with Traefik labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
  - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
```

## 14. Logs and Monitoring

**Problem**: Container logs may fill up disk space.

**Solution**: Configure log rotation in docker-compose:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 15. Resource Limits

**Problem**: Containers may consume too many resources.

**Solution**: Add resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps
```

### Database errors
```bash
# Check if migrations ran
docker-compose exec backend npx prisma migrate status

# Force migration
docker-compose exec backend npx prisma migrate deploy
```

### Frontend shows blank page
```bash
# Check nginx logs
docker-compose logs frontend

# Verify build output
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### API connection refused
1. Check if backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify VITE_API_URL matches your setup
4. Check if port is exposed: `docker port feedbacks-backend`

---

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure proper `VITE_API_URL` for your domain
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for specific origins
- [ ] Set up log rotation
- [ ] Configure resource limits
- [ ] Set up automated backups
- [ ] Configure SMTP settings via admin UI
- [ ] Change default admin password after first login
- [ ] Set up monitoring/alerting
