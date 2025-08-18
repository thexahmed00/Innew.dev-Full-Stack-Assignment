# Supabase Authentication App

A modern Next.js application with Supabase authentication featuring email/password, magic link OTP, and Google OAuth integration.

## Features

- 🔐 **Multiple Authentication Methods**
  - Email/Password authentication
  - Magic link OTP (One-Time Password)
  - Google OAuth integration
- 🎨 **Modern UI Components**
  - Built with shadcn/ui components
  - Responsive design with Tailwind CSS
  - Beautiful gradient backgrounds and modern styling
- 🚀 **Next.js 15 with App Router**
  - Server-side rendering support
  - TypeScript for type safety
  - Optimized performance

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to Settings > API in your project dashboard
3. Copy your project URL and anon key
4. Create a `.env.local` file in the client directory:

```bash
cp env.example .env.local
```

5. Update `.env.local` with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Configure Supabase Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable the authentication providers you want to use:
   - **Email**: Enable "Enable email confirmations" for magic links
   - **Google**: Add your Google OAuth credentials
3. Configure your site URL and redirect URLs:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Authentication Flow

### Email/Password Authentication

1. User enters email and password
2. Supabase validates credentials
3. User is redirected to the dashboard

### Magic Link OTP

1. User enters email address
2. Supabase sends a magic link to their email
3. User clicks the link to authenticate
4. User is redirected to the dashboard

### Google OAuth

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. After consent, redirected back to the app
4. User is authenticated and redirected to the dashboard

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with AuthProvider
│   └── page.tsx                  # Main page with auth logic
├── components/
│   ├── auth/
│   │   ├── AuthPage.tsx         # Main auth page
│   │   ├── LoginForm.tsx        # Login form component
│   │   ├── SignupForm.tsx       # Signup form component
│   │   └── UserProfile.tsx      # User profile dropdown
│   └── ui/                      # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx          # Authentication context
└── lib/
    ├── supabase.ts              # Supabase client configuration
    └── utils.ts                 # Utility functions
```

## Key Components

### AuthContext

Manages authentication state throughout the application:

- User session management
- Authentication methods (login, signup, logout)
- Loading states

### AuthPage

Combines login and signup forms with tabbed interface:

- Toggle between authentication modes
- Responsive design
- Error handling and success messages

### LoginForm & SignupForm

Individual form components with:

- Form validation using Zod
- React Hook Form integration
- Multiple authentication methods
- Loading states and error handling

### UserProfile

User profile dropdown when authenticated:

- User avatar and information
- Account management options
- Logout functionality

## Customization

### Styling

- Modify `globals.css` for global styles
- Update Tailwind classes in components
- Customize shadcn/ui theme in `components.json`

### Authentication Methods

- Add new OAuth providers in `AuthContext.tsx`
- Modify form validation schemas
- Update redirect URLs for new providers

### Components

- Extend existing components with new features
- Add new UI components using shadcn/ui
- Customize form layouts and validation

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Set environment variables in your hosting platform
4. Update Supabase redirect URLs to your production domain

## Environment Variables

| Variable                        | Description                   | Required |
| ------------------------------- | ----------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes      |

## Troubleshooting

### Common Issues

1. **Authentication not working**

   - Check environment variables are set correctly
   - Verify Supabase project settings
   - Check browser console for errors

2. **Google OAuth redirect issues**

   - Ensure redirect URLs are configured in Supabase
   - Check Google OAuth credentials
   - Verify site URL settings

3. **Magic links not working**
   - Check email settings in Supabase
   - Verify email templates
   - Check spam/junk folders

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## License

MIT License - feel free to use this project for your own applications.
