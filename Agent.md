# 🤖 Technical Implementation Agent

**Project:** Venkata Naveen Busiraju – Dynamic Portfolio Website
**Version:** v1.0
**Date:** 22-Sept-2025
**Purpose:** Complete technical implementation guide and system architecture

---

## 1. System Architecture & Design

### Multi-Tier Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ Next.js 14+     │◄──►│ Node.js +       │◄──►│ PostgreSQL      │
│ React 18+       │    │ Express 4.x     │    │ or SQLite       │
│ TailwindCSS     │    │ Prisma ORM      │    │                 │
│ ShadCN/UI       │    │ JWT Auth        │    │ Redis (Cache)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  Docker Stack   │◄─────────────┘
                        │                 │
                        │ Nginx Proxy     │
                        │ Cloudflare      │
                        │ Tunnel          │
                        └─────────────────┘
```

### Frontend Architecture

- **Framework**: Next.js 14+ with App Router
- **UI Library**: React 18+ with TypeScript
- **Styling**: TailwindCSS + ShadCN/UI components
- **State Management**:
  - React Query (TanStack Query) for server state
  - Zustand for client-side state
- **Form Handling**: React Hook Form + Zod validation
- **Routing**: Next.js App Router with nested layouts

### Backend Architecture

- **Runtime**: Node.js 18+ with Express.js
- **Database ORM**: Prisma with PostgreSQL/SQLite
- **Authentication**: JWT with refresh tokens
- **File Storage**: Local filesystem with validation
- **API Design**: RESTful with consistent response formats
- **Middleware**: CORS, Rate Limiting, Security Headers

---

## 2. Detailed API Specification

### Base Configuration

```typescript
// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Standard Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}
```

### Authentication Endpoints

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: 'ADMIN';
  };
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
// DELETE /api/auth/logout (clears all sessions)
```

### Portfolio Data Endpoints

```typescript
// Projects
GET    /api/projects           // Get all projects (public)
POST   /api/projects           // Create project (admin)
PUT    /api/projects/:id       // Update project (admin)
DELETE /api/projects/:id       // Delete project (admin)

// Certifications
GET    /api/certifications     // Get all certifications (public)
POST   /api/certifications     // Create certification (admin)
PUT    /api/certifications/:id // Update certification (admin)
DELETE /api/certifications/:id // Delete certification (admin)

// Experience
GET    /api/experience         // Get all experience (public)
POST   /api/experience         // Create experience (admin)
PUT    /api/experience/:id     // Update experience (admin)
DELETE /api/experience/:id     // Delete experience (admin)

// Skills
GET    /api/skills             // Get all skills (public)
POST   /api/skills             // Create skill (admin)
PUT    /api/skills/:id         // Update skill (admin)
DELETE /api/skills/:id         // Delete skill (admin)

// Profile
GET    /api/profile            // Get profile info (public)
PUT    /api/profile            // Update profile (admin)

// Files
POST   /api/files/upload       // Upload files (admin)
GET    /api/files/:filename    // Serve files (public)
DELETE /api/files/:filename    // Delete files (admin)
```

### Data Models

```typescript
// Project Model
interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  featured: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

// Certification Model
interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

// Experience Model
interface Experience {
  id: string;
  company: string;
  position: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  location: string;
  companyUrl?: string;
  logoUrl?: string;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Skill Model
interface Skill {
  id: string;
  name: string;
  category: 'PROGRAMMING' | 'CLOUD' | 'AI_ML' | 'DEVOPS' | 'VISUALIZATION' | 'OTHER';
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Profile Model
interface Profile {
  id: string;
  fullName: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  phone?: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  profileImageUrl?: string;
  updatedAt: Date;
}
```

---

## 3. Database Schema & Data Models

### Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Profile {
  id               String    @id @default(cuid())
  fullName         String
  title            String
  tagline          String
  bio              String    @db.Text
  email            String
  phone            String?
  location         String
  linkedinUrl      String?
  githubUrl        String?
  resumeUrl        String?
  profileImageUrl  String?
  updatedAt        DateTime  @updatedAt

  @@map("profile")
}

model Project {
  id          String        @id @default(cuid())
  title       String
  description String        @db.Text
  techStack   String[]
  githubUrl   String?
  demoUrl     String?
  imageUrl    String?
  featured    Boolean       @default(false)
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("projects")
}

model Certification {
  id            String              @id @default(cuid())
  title         String
  issuer        String
  issueDate     DateTime
  expiryDate    DateTime?
  credentialId  String?
  credentialUrl String?
  logoUrl       String?
  status        CertificationStatus @default(ACTIVE)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@map("certifications")
}

model Experience {
  id           String   @id @default(cuid())
  company      String
  position     String
  description  String   @db.Text
  startDate    DateTime
  endDate      DateTime?
  current      Boolean  @default(false)
  location     String
  companyUrl   String?
  logoUrl      String?
  achievements String[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("experience")
}

model Skill {
  id                String          @id @default(cuid())
  name              String
  category          SkillCategory
  proficiency       SkillLevel
  yearsOfExperience Int
  featured          Boolean         @default(false)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("skills")
}

enum Role {
  ADMIN
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

enum CertificationStatus {
  ACTIVE
  EXPIRED
}

enum SkillCategory {
  PROGRAMMING
  CLOUD
  AI_ML
  DEVOPS
  VISUALIZATION
  OTHER
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

### Database Relationships & Constraints

- **User Table**: Single admin user for portfolio management
- **Profile Table**: Single record containing personal information
- **Indexing Strategy**:
  - `projects(status, featured, createdAt)`
  - `certifications(status, issueDate)`
  - `experience(current, startDate)`
  - `skills(category, featured)`

---

## 4. Frontend Implementation Details

### Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin routes group
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── projects/
│   │   │   │   ├── certifications/
│   │   │   │   ├── experience/
│   │   │   │   └── skills/
│   │   │   └── layout.tsx
│   │   ├── (public)/          # Public routes group
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── about/
│   │   │   ├── projects/
│   │   │   ├── certifications/
│   │   │   ├── experience/
│   │   │   └── contact/
│   │   ├── api/               # API routes (proxy to backend)
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # ShadCN/UI components
│   │   ├── admin/             # Admin-specific components
│   │   ├── portfolio/         # Portfolio display components
│   │   └── common/            # Shared components
│   ├── lib/
│   │   ├── api.ts             # API client configuration
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── utils.ts           # Utility functions
│   │   └── validations.ts     # Zod schemas
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # Zustand stores
│   └── types/                 # TypeScript type definitions
├── public/
│   ├── images/
│   └── icons/
├── tailwind.config.js
├── next.config.js
└── package.json
```

### Component Architecture

```typescript
// Common Layout Component
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// Data Display Components
interface ProjectCardProps {
  project: Project;
  variant?: 'card' | 'list';
  showActions?: boolean;
}

interface CertificationBadgeProps {
  certification: Certification;
  size?: 'sm' | 'md' | 'lg';
}

// Admin Components
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAdd?: () => void;
}

interface FormModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => void;
  initialData?: T;
  title: string;
}
```

### State Management

```typescript
// Auth Store (Zustand)
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Theme Store
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// React Query Keys
export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  certifications: ['certifications'] as const,
  experience: ['experience'] as const,
  skills: ['skills'] as const,
  profile: ['profile'] as const,
};
```

### Form Validation

```typescript
// Zod Schemas
const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  techStack: z.array(z.string()).min(1, 'At least one technology is required'),
  githubUrl: z.string().url().optional().or(z.literal('')),
  demoUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
});

const certificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal('')),
});
```

---

## 5. Admin Console Architecture

### Dashboard Layout

```typescript
// Admin Layout Structure
const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Navigation Structure
const sidebarItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/admin/projects', icon: FolderIcon },
  { name: 'Certifications', href: '/admin/certifications', icon: AcademicCapIcon },
  { name: 'Experience', href: '/admin/experience', icon: BriefcaseIcon },
  { name: 'Skills', href: '/admin/skills', icon: CogIcon },
  { name: 'Profile', href: '/admin/profile', icon: UserIcon },
];
```

### CRUD Interface Components

```typescript
// Generic Data Table with Actions
interface AdminTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onBulkAction?: (items: T[], action: string) => void;
}

// Form Modal for CRUD Operations
interface CRUDModalProps<T> {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  initialData?: Partial<T>;
  validationSchema: ZodSchema<T>;
  fields: FormField[];
}

// File Upload Component
interface FileUploadProps {
  accept: string;
  maxSize: number;
  onUpload: (file: File) => Promise<string>;
  currentUrl?: string;
  placeholder: string;
}
```

### Real-time Updates

```typescript
// WebSocket integration for real-time updates
const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);

      switch (type) {
        case 'PROJECT_UPDATED':
          queryClient.invalidateQueries(queryKeys.projects);
          break;
        case 'CERTIFICATION_ADDED':
          queryClient.invalidateQueries(queryKeys.certifications);
          break;
        // ... other cases
      }
    };

    return () => ws.close();
  }, [queryClient]);
};
```

---

## 6. Security Implementation

### Authentication Strategy

```typescript
// JWT Configuration
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'portfolio-api',
};

// Auth Middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Role-based Authorization
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
```

### Input Validation & Sanitization

```typescript
// Request Validation Middleware
const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        });
      }
      next(error);
    }
  };
};

// File Upload Security
const fileUploadSecurity = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
```

### Security Headers & Protection

```typescript
// Security Middleware Setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 7. Docker & Deployment Strategy

### Multi-stage Dockerfile

```dockerfile
# Stage 1: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./
RUN npm run build

# Stage 2: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 3: Production Runtime
FROM node:18-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/package.json ./backend/

# Copy frontend
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next ./frontend/.next/
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public/
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/package.json ./frontend/

# Install PM2 for process management
RUN npm install -g pm2

# Copy PM2 configuration
COPY ecosystem.config.js ./

USER nextjs

EXPOSE 3000 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  portfolio:
    build: .
    container_name: portfolio-app
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://portfolio:${DB_PASSWORD}@db:5432/portfolio_db
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=https://portfolio.naveenb.net
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - portfolio-network

  db:
    image: postgres:15-alpine
    container_name: portfolio-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=portfolio_db
      - POSTGRES_USER=portfolio
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - portfolio-network

  redis:
    image: redis:7-alpine
    container_name: portfolio-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - portfolio-network

  nginx:
    image: nginx:alpine
    container_name: portfolio-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - portfolio
    networks:
      - portfolio-network

volumes:
  postgres_data:
  redis_data:

networks:
  portfolio-network:
    driver: bridge
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server portfolio:3000;
    }

    upstream backend {
        server portfolio:3001;
    }

    server {
        listen 80;
        server_name portfolio.naveenb.net;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name portfolio.naveenb.net;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /uploads/ {
            alias /app/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Environment Configuration

```bash
# .env.production
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database
DATABASE_URL=postgresql://portfolio:${DB_PASSWORD}@localhost:5432/portfolio_db

# Authentication
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# URLs
FRONTEND_URL=https://portfolio.naveenb.net
API_URL=https://portfolio.naveenb.net/api

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=5242880

# Redis
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs
```

---

## 8. Development Workflow & Standards

### Project Setup Commands

```bash
# Initialize project
mkdir portfolio-system && cd portfolio-system

# Backend setup
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client bcryptjs jsonwebtoken cors helmet express-rate-limit multer
npm install -D @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/multer typescript ts-node nodemon prisma

# Frontend setup
cd ../
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
npm install @tanstack/react-query zustand react-hook-form @hookform/resolvers zod lucide-react @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# ShadCN/UI setup
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea select table dialog dropdown-menu
```

### Git Workflow

```bash
# Branch naming convention
feature/admin-dashboard
bugfix/auth-token-refresh
hotfix/security-vulnerability
release/v1.0.0

# Commit message format
feat: add project CRUD operations
fix: resolve JWT token expiration issue
docs: update API documentation
refactor: optimize database queries
test: add integration tests for auth endpoints
```

### Code Quality Standards

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal"],
      "alphabetize": { "order": "asc" }
    }]
  }
}

// prettier.config.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
};
```

### Testing Strategy

```typescript
// Backend Testing (Jest + Supertest)
describe('Projects API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('should create a new project', async () => {
    const projectData = {
      title: 'Test Project',
      description: 'Test Description',
      techStack: ['React', 'Node.js'],
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(projectData)
      .expect(201);

    expect(response.body.data.title).toBe(projectData.title);
  });
});

// Frontend Testing (React Testing Library)
describe('ProjectCard Component', () => {
  it('should render project information correctly', () => {
    const mockProject = {
      id: '1',
      title: 'Test Project',
      description: 'Test Description',
      techStack: ['React'],
    };

    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
```

---

## 9. Performance & Monitoring

### Application Performance Monitoring

```typescript
// Performance Monitoring Setup
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    console.log({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  });

  next();
};

// Database Query Optimization
const optimizedQueries = {
  getProjectsWithTechStack: () => prisma.project.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      techStack: true,
      featured: true,
    },
    where: { status: 'ACTIVE' },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  }),
};
```

### Caching Implementation

```typescript
// Redis Cache Service
class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Cache Middleware
const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await cacheService.get(key);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json;
    res.json = function(data) {
      cacheService.set(key, data, ttl);
      return originalJson.call(this, data);
    };

    next();
  };
};
```

### Image Optimization

```typescript
// Image Processing Service
import sharp from 'sharp';

class ImageService {
  async processUpload(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${file.originalname}`;
    const outputPath = path.join(process.env.UPLOAD_DIR, filename);

    await sharp(file.buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return filename;
  }

  async generateThumbnail(imagePath: string): Promise<string> {
    const thumbnailPath = imagePath.replace(/(\.[^.]+)$/, '-thumb$1');

    await sharp(imagePath)
      .resize(200, 150, { fit: 'cover' })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }
}
```

### Error Tracking & Logging

```typescript
// Logging Configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    }),
  ],
});

// Error Handling Middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};
```

---

## 10. Implementation Roadmap

### Phase 1: Backend Foundation (2-3 weeks)

**Week 1: Core Setup**
- [ ] Initialize Node.js + Express project
- [ ] Setup Prisma with PostgreSQL/SQLite
- [ ] Implement basic CRUD operations for all models
- [ ] Setup JWT authentication system
- [ ] Create API endpoints with validation

**Week 2: Advanced Features**
- [ ] Implement file upload functionality
- [ ] Add caching with Redis
- [ ] Setup rate limiting and security middleware
- [ ] Create comprehensive error handling
- [ ] Write unit and integration tests

**Week 3: DevOps & Deployment**
- [ ] Create Docker configuration
- [ ] Setup development Docker Compose
- [ ] Implement logging and monitoring
- [ ] Create production deployment scripts
- [ ] Setup CI/CD pipeline basics

### Phase 2: Public Portfolio Frontend (2-3 weeks)

**Week 1: Next.js Setup**
- [ ] Initialize Next.js 14 with TypeScript
- [ ] Setup TailwindCSS and ShadCN/UI
- [ ] Create basic routing structure
- [ ] Implement responsive layout components

**Week 2: Portfolio Pages**
- [ ] Build landing page with profile information
- [ ] Create projects showcase with filtering
- [ ] Implement certifications and experience pages
- [ ] Add contact form functionality
- [ ] Setup dark/light theme toggle

**Week 3: Integration & Polish**
- [ ] Integrate with backend APIs using React Query
- [ ] Implement proper error handling and loading states
- [ ] Optimize performance and bundle size
- [ ] Add proper TypeScript types throughout
- [ ] Test responsive design across devices

### Phase 3: Admin Console (2-3 weeks)

**Week 1: Admin Foundation**
- [ ] Create admin authentication flow
- [ ] Build admin layout with navigation
- [ ] Implement admin dashboard overview
- [ ] Setup admin routing and protection

**Week 2: CRUD Interfaces**
- [ ] Build projects management interface
- [ ] Create certifications management
- [ ] Implement experience management
- [ ] Add skills management interface
- [ ] Build profile editing interface

**Week 3: Advanced Admin Features**
- [ ] Implement file upload with drag-and-drop
- [ ] Add bulk operations functionality
- [ ] Create data export capabilities
- [ ] Add real-time updates
- [ ] Implement admin analytics

### Phase 4: Production Deployment (1-2 weeks)

**Week 1: Production Setup**
- [ ] Configure production Docker setup
- [ ] Setup Nginx reverse proxy
- [ ] Implement SSL certificates
- [ ] Configure Cloudflare Tunnel
- [ ] Setup production database

**Week 2: Monitoring & Optimization**
- [ ] Implement comprehensive logging
- [ ] Setup application monitoring
- [ ] Configure automated backups
- [ ] Performance optimization
- [ ] Security hardening and audit

---

## 11. Technical Requirements & Dependencies

### System Requirements

**Development Environment:**
- Node.js 18+ with npm/yarn
- PostgreSQL 14+ or SQLite 3+
- Redis 6+ (for caching)
- Docker 20+ with Docker Compose
- Git for version control

**Production Environment:**
- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose
- Nginx for reverse proxy
- Cloudflare account for tunnel setup
- Domain name configured

### Core Dependencies

**Backend Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.8.0",
    "multer": "^1.4.5",
    "sharp": "^0.32.0",
    "redis": "^4.6.0",
    "winston": "^3.10.0",
    "zod": "^3.21.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.17",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0",
    "jest": "^29.5.0",
    "supertest": "^6.3.0"
  }
}
```

**Frontend Dependencies:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@tanstack/react-query": "^4.29.0",
    "zustand": "^4.3.0",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.1.0",
    "zod": "^3.21.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.263.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.44.0",
    "eslint-config-next": "^14.0.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.0"
  }
}
```

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

### Environment Variables

```bash
# Backend Environment Variables
NODE_ENV=development|production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
FRONTEND_URL=http://localhost:3000

# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

This Agent.md serves as the comprehensive technical implementation guide for building the dynamic portfolio system. It provides detailed specifications, code examples, and step-by-step implementation instructions that developers can follow to create a professional, secure, and scalable portfolio website with admin console functionality.