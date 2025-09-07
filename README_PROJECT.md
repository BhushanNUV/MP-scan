# Next.js Application Setup

A modern Next.js application with TypeScript, Tailwind CSS, and comprehensive tooling.

## Features

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Prisma** ORM with MySQL database
- **NextAuth** for authentication
- **Shadcn/ui** for modern UI components
- **Recharts** for data visualization
- **React Hook Form + Zod** for form validation
- **ESLint + Prettier** configured

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL database server running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your database credentials and NextAuth configuration:
- `DATABASE_URL`: Your MySQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
nextjs-app/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   │   └── auth/        # NextAuth API routes
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── providers.tsx    # React providers
├── components/          # React components
│   └── ui/             # Shadcn/ui components
├── lib/                 # Utility functions
│   ├── auth.ts         # NextAuth configuration
│   ├── prisma.ts       # Prisma client instance
│   └── utils.ts        # Utility functions
├── prisma/             # Prisma schema and migrations
│   └── schema.prisma   # Database schema
├── public/             # Static files
├── types/              # TypeScript type definitions
└── middleware.ts       # NextAuth middleware
```

## Database Schema

The application includes basic models for authentication:
- **User**: User accounts with email/password authentication
- **Account**: OAuth provider accounts
- **Session**: User sessions
- **VerificationToken**: Email verification tokens

## Authentication

NextAuth is configured with:
- Credentials provider for email/password authentication
- JWT strategy for session management
- Protected routes via middleware
- Custom sign-in/sign-out pages

## UI Components

Shadcn/ui components are pre-installed:
- Button, Card, Form
- Input, Label, Select, Textarea
- Dialog, Sheet
- Dropdown Menu, Navigation Menu
- Tabs
- Sonner (toast notifications)

## Form Validation

React Hook Form with Zod is configured for:
- Type-safe form handling
- Schema validation
- Error handling

## Data Visualization

Recharts is installed for creating:
- Line charts
- Bar charts
- Pie charts
- Area charts
- And more...

## Code Quality

- ESLint configured with Next.js best practices
- Prettier for consistent code formatting
- Tailwind CSS plugin for Prettier
- TypeScript for type safety