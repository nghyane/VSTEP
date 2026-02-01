# Authentication & Authorization

## 1. Authentication Flow

### 1.1 Session Cookie Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Authentication Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client                          Bun App                        │
│       │                              │                            │
│       │  1. POST /auth/login         │                            │
│       │      {email, password}       │                            │
│       │─────────────────────────────►│                            │
│       │                              │                            │
│       │                         2. Validate credentials          │
│       │                         3. Generate session              │
│       │                         4. Store in Redis                │
│       │                         5. Set HTTP-only cookie          │
│       │                              │                            │
│       │  6. Set-Cookie:              │                            │
│       │     session_id=xxx;          │                            │
│       │     HttpOnly; Secure;        │                            │
│       │     SameSite=Lax; Max-Age=1800│                          │
│       │◄─────────────────────────────│                            │
│       │                              │                            │
│       │  7. Subsequent requests      │                            │
│       │      Cookie: session_id=xxx  │                            │
│       │─────────────────────────────►│                            │
│       │                              │                            │
│       │                         8. Validate session in Redis     │
│       │                         9. Check RBAC                    │
│       │                         10. Process request              │
│       │                              │                            │
│       │  11. Response                │                            │
│       │◄─────────────────────────────│                            │
│       │                              │                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Session Cookie Configuration

```typescript
// Cookie options
const SESSION_COOKIE_OPTIONS = {
  name: 'session_id',
  httpOnly: true,        // Prevent XSS attacks
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',       // CSRF protection
  maxAge: 1800,          // 30 minutes (in seconds)
  path: '/',
  signed: true           // Cookie signature
};
```

### 1.3 Redis Session Storage

```typescript
// Session structure in Redis
interface Session {
  userId: string;
  email: string;
  role: 'learner' | 'instructor' | 'admin';
  deviceId: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

// Redis key: sessions:{userId} (Sorted Set)
Redis command: ZADD sessions:{userId} {score} {member}

// Member JSON structure
const sessionMember = JSON.stringify({
  sessionId: 'sess_abc123',
  deviceId: 'device_xyz789',
  loginTime: '2026-02-01T10:00:00Z',
  lastActivity: '2026-02-01T10:30:00Z',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
});

// Score = loginTime timestamp for ordering
```

### 1.4 Session Management Flow

```typescript
// session_manager.ts
class SessionManager {
  private MAX_SESSIONS = 3;
  private SESSION_TIMEOUT = 30 * 60; // 30 minutes
  private HEARTBEAT_INTERVAL = 5 * 60; // 5 minutes
  
  async createSession(userId: string, credentials: LoginCredentials) {
    // Check current session count
    const currentSessions = await this.getSessionCount(userId);
    
    if (currentSessions >= this.MAX_SESSIONS) {
      // Option A: Reject new login
      // throw new MaxSessionsExceededError();
      
      // Option B: Auto-logout oldest session (recommended)
      await this.evictOldestSession(userId);
    }
    
    // Generate session
    const sessionId = generateUUID();
    const session: Session = {
      userId,
      role: await this.getUserRole(userId),
      deviceId: credentials.deviceId,
      loginTime: new Date(),
      lastActivity: new Date(),
      ipAddress: credentials.ipAddress,
      userAgent: credentials.userAgent
    };
    
    // Store in Redis
    await this.storeSession(userId, sessionId, session);
    
    // Start heartbeat
    this.startHeartbeat(sessionId);
    
    return sessionId;
  }
  
  async validateSession(sessionId: string): Promise<Session | null> {
    // Find session by sessionId across all users
    const session = await this.findSession(sessionId);
    
    if (!session) return null;
    
    // Check timeout
    const inactiveTime = Date.now() - session.lastActivity.getTime();
    if (inactiveTime > this.SESSION_TIMEOUT * 1000) {
      await this.destroySession(sessionId);
      return null;
    }
    
    // Update lastActivity (heartbeat)
    await this.updateActivity(sessionId);
    
    return session;
  }
  
  async destroySession(sessionId: string) {
    // Remove from Redis
    await redis.del(`session:${sessionId}`);
    
    // Remove from user's sorted set
    const userId = await this.getUserBySession(sessionId);
    if (userId) {
      await redis.zrem(`sessions:${userId}`, sessionId);
    }
  }
}
```

## 2. RBAC (Role-Based Access Control)

### 2.1 Role Definitions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Learner** | Basic user | Practice, Mock Test, Progress Tracking, View Results |
| **Instructor** | Grader/Monitor | All Learner + Grading Portal, Review Submissions, View Analytics |
| **Admin** | System Manager | All + User Management, Content Management, System Config |

### 2.2 Permission Matrix

```typescript
// permissions.ts
enum Permission {
  // Practice
  PRACTICE_ACCESS = 'practice:access',
  PRACTICE_SUBMIT = 'practice:submit',
  
  // Mock Test
  MOCK_ACCESS = 'mock:access',
  MOCK_SUBMIT = 'mock:submit',
  MOCK_VIEW_RESULTS = 'mock:view_results',
  
  // Grading
  GRADING_PORTAL_ACCESS = 'grading:portal_access',
  GRADING_REVIEW = 'grading:review',
  GRADING_OVERRIDE = 'grading:override',
  
  // Progress
  PROGRESS_VIEW = 'progress:view',
  PROGRESS_EXPORT = 'progress:export',
  
  // Admin
  ADMIN_USERS = 'admin:users',
  ADMIN_CONTENT = 'admin:content',
  ADMIN_SYSTEM = 'admin:system',
  ADMIN_ANALYTICS = 'admin:analytics'
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  learner: [
    Permission.PRACTICE_ACCESS,
    Permission.PRACTICE_SUBMIT,
    Permission.MOCK_ACCESS,
    Permission.MOCK_SUBMIT,
    Permission.MOCK_VIEW_RESULTS,
    Permission.PROGRESS_VIEW,
    Permission.PROGRESS_EXPORT
  ],
  
  instructor: [
    // All learner permissions
    ...ROLE_PERMISSIONS.learner,
    
    // Additional permissions
    Permission.GRADING_PORTAL_ACCESS,
    Permission.GRADING_REVIEW,
    Permission.GRADING_OVERRIDE,
    Permission.PROGRESS_VIEW, // Extended view
    Permission.ADMIN_ANALYTICS // Basic analytics
  ],
  
  admin: Object.values(Permission) // All permissions
};
```

### 2.3 RBAC Middleware

```typescript
// auth_middleware.ts
import { Elysia, t } from 'elysia';
import { SessionManager } from './session_manager';

export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ cookie, request }) => {
    const sessionId = cookie.session_id?.value;
    
    if (!sessionId) {
      throw new UnauthorizedError('No session provided');
    }
    
    const session = await SessionManager.validateSession(sessionId);
    
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }
    
    return { user: session };
  });

export const requirePermission = (permission: Permission) => {
  return new Elysia({ name: `permission:${permission}` })
    .derive(async ({ user }) => {
      if (!user.role || !ROLE_PERMISSIONS[user.role].includes(permission)) {
        throw new ForbiddenError(`Missing permission: ${permission}`);
      }
      
      return { allowed: true };
    });
};

// Example usage
const app = new Elysia()
  .use(authMiddleware)
  .post('/practice/submit', ({ user }) => {
    // Any authenticated user can access
    return submitPractice(user);
  }, {
    beforeHandle: [{ authMiddleware }]
  })
  .get('/grading/portal', ({ user }) => {
    // Only instructors and admins
    return getGradingPortal(user);
  }, {
    beforeHandle: [
      { authMiddleware },
      { requirePermission: Permission.GRADING_PORTAL_ACCESS }
    ]
  });
```

## 3. Rate Limiting (Login)

### 3.1 Rate Limit Configuration

```typescript
// rate_limiter.ts
const LOGIN_RATE_LIMIT = {
  windowMs: 60 * 1000,      // 1 minute
  maxAttempts: 5,           // 5 attempts per window
  blockDuration: 15 * 60    // 15 minutes block
};

const IP_RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 100          // 100 requests per minute per IP
};
```

### 3.2 Rate Limit Implementation

```typescript
// login_rate_limiter.ts
import { Redis } from 'ioredis';

class LoginRateLimiter {
  constructor(private redis: Redis) {}
  
  async checkRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `ratelimit:login:${identifier}`;
    const now = Date.now();
    const windowStart = now - LOGIN_RATE_LIMIT.windowMs;
    
    // Use Redis sorted set for sliding window
    const attempts = await this.redis.zrangebyscore(key, windowStart, now);
    const attemptCount = attempts.length;
    
    if (attemptCount >= LOGIN_RATE_LIMIT.maxAttempts) {
      // Check if blocked
      const blockKey = `ratelimit:block:${identifier}`;
      const isBlocked = await this.redis.get(blockKey);
      
      if (isBlocked) {
        const ttl = await this.redis.ttl(blockKey);
        return {
          allowed: false,
          remaining: 0,
          resetTime: ttl * 1000
        };
      }
      
      // Set block
      await this.redis.setex(
        blockKey,
        LOGIN_RATE_LIMIT.blockDuration,
        '1'
      );
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: LOGIN_RATE_LIMIT.blockDuration * 1000
      };
    }
    
    // Record attempt
    await this.redis.zadd(key, now, `${now}:${Math.random()}`);
    await this.redis.expire(key, LOGIN_RATE_LIMIT.windowMs / 1000 + 60);
    
    return {
      allowed: true,
      remaining: LOGIN_RATE_LIMIT.maxAttempts - attemptCount - 1,
      resetTime: LOGIN_RATE_LIMIT.windowMs
    };
  }
}
```

## 4. Optional OAuth (Future)

### 4.1 OAuth 2.0 Scope (Future Enhancement)

> **Note**: OAuth không phải requirement cho baseline. Có thể thêm sau.

```typescript
// Future: OAuth configuration
const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: 'https://vstep.example.com/auth/google/callback',
    scope: ['openid', 'email', 'profile']
  },
  // facebook: { ... }
};

// OAuth flow would be:
// 1. Redirect user to Google OAuth
// 2. User approves, Google redirects back with code
// 3. Exchange code for access token
// 4. Get user info, create session
// 5. Map OAuth provider + email to internal user
```

### 4.2 Migration Path

| Phase | Auth Method | Notes |
|-------|-------------|-------|
| 1 (Baseline) | Session Cookie + Email/Password | Core functionality |
| 2 (Optional) | Add Google OAuth | Reduce friction, social login |
| 3 (Advanced) | SSO Integration | Enterprise customers |

---

*Document version: 1.0 - Last updated: SP26SE145*
