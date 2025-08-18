# Express TypeScript API Server

A production-ready Express.js server built with TypeScript, featuring Supabase database integration, Docker support, and proper separation of concerns.

## Features

- ✅ **TypeScript** - Full type safety and modern JavaScript features
- ✅ **Express.js** - Fast, unopinionated web framework
- ✅ **Supabase Integration** - Real-time database with PostgreSQL
- ✅ **Modular Architecture** - Separated routes, controllers, models, and services
- ✅ **Authentication** - JWT-based authentication with Supabase Auth
- ✅ **Validation** - Request validation and sanitization
- ✅ **Error Handling** - Centralized error handling with custom error classes
- ✅ **Security** - Helmet.js for security headers, CORS protection
- ✅ **Logging** - Morgan for HTTP request logging
- ✅ **Environment Variables** - Dotenv for configuration management
- ✅ **Docker Support** - Containerized deployment
- ✅ **Health Checks** - Built-in health monitoring
- ✅ **Graceful Shutdown** - Proper process termination

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase configuration
│   ├── controllers/
│   │   ├── userController.ts     # User business logic
│   │   └── postController.ts     # Post business logic
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   └── validation.ts        # Request validation
│   ├── models/
│   │   ├── User.ts              # User data model
│   │   └── Post.ts              # Post data model
│   ├── routes/
│   │   ├── userRoutes.ts        # User API routes
│   │   └── postRoutes.ts        # Post API routes
│   ├── services/
│   │   └── userService.ts       # Business logic services
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── errorHandler.ts      # Error handling utilities
│   ├── app.ts                   # Express application setup
│   └── server.ts                # Server entry point
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose setup
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── nodemon.json                # Development server config
├── env.example                 # Environment variables template
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Quick Start

### Prerequisites

1. **Supabase Account** - Create a project at [supabase.com](https://supabase.com)
2. **Node.js** - Version 18 or higher
3. **Docker** - For containerized deployment (optional)

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Configure Supabase:**

   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings > API
   - Update your `.env` file with these values

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Access the API:**
   - Main endpoint: http://localhost:3001
   - Health check: http://localhost:3001/health
   - API status: http://localhost:3001/api/status

## API Endpoints

### Users

| Method | Endpoint         | Description     | Auth Required |
| ------ | ---------------- | --------------- | ------------- |
| GET    | `/api/users`     | Get all users   | No            |
| GET    | `/api/users/:id` | Get user by ID  | No            |
| POST   | `/api/users`     | Create new user | No            |
| PUT    | `/api/users/:id` | Update user     | Yes           |
| DELETE | `/api/users/:id` | Delete user     | Yes           |

### Posts

| Method | Endpoint                  | Description       | Auth Required |
| ------ | ------------------------- | ----------------- | ------------- |
| GET    | `/api/posts`              | Get all posts     | No            |
| GET    | `/api/posts/:id`          | Get post by ID    | No            |
| GET    | `/api/posts/user/:userId` | Get posts by user | No            |
| POST   | `/api/posts`              | Create new post   | Yes           |
| PUT    | `/api/posts/:id`          | Update post       | Yes           |
| DELETE | `/api/posts/:id`          | Delete post       | Yes           |

### System

| Method | Endpoint      | Description                  |
| ------ | ------------- | ---------------------------- |
| GET    | `/`           | Welcome message and API info |
| GET    | `/health`     | Health check endpoint        |
| GET    | `/api/status` | API status and version       |

## Authentication

The API uses Supabase Auth for authentication. Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

## Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Configuration
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Remove build artifacts
- `npm run dev:build` - Build and run in development mode

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and run with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

2. **Run in background:**

   ```bash
   docker-compose up -d
   ```

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**

   ```bash
   docker build -t express-api .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3001:3001 --env-file .env express-api
   ```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Posts Table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

The API uses a centralized error handling system:

- **CustomError** - Custom error class with status codes
- **Global Error Handler** - Catches all unhandled errors
- **Validation Errors** - Proper validation error responses
- **Database Errors** - Handles Supabase-specific errors

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Input Validation** - Request validation and sanitization
- **Authentication** - JWT-based authentication
- **Rate Limiting** - Basic rate limiting (extensible)

## Monitoring

- **Health checks** - Built-in health monitoring
- **Logging** - HTTP request logging with Morgan
- **Error tracking** - Centralized error handling
- **Database monitoring** - Supabase dashboard integration

## Adding New Features

1. **Create a new model** in `src/models/`
2. **Add business logic** in `src/services/`
3. **Create controller** in `src/controllers/`
4. **Define routes** in `src/routes/`
5. **Add types** in `src/types/`
6. **Update validation** in `src/middleware/`

Run on Supabase

```
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'standard' CHECK (user_type IN ('standard', 'admin', 'premium')),
  is_verified BOOLEAN DEFAULT FALSE,
  last_sign_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

```

## License

ISC
