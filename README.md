# No-GT: Not only a Gym Tracker

A mobile-first workout tracking application built with Next.js, Prisma, and Vercel Postgres.

## Features

- 📱 Mobile-first design optimized for smartphone use in the gym
- 💪 Track exercises, sets, reps, and weights
- 📊 Create custom workout plans
- 📝 Record workout sessions
- 👤 User authentication via GitHub

## Tech Stack

- **Frontend & Backend**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database ORM**: [Prisma](https://prisma.io/)
- **Database**: [Vercel Postgres](https://vercel.com/storage/postgres)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## Development Setup

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database (local or remote)
- GitHub OAuth credentials

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/no-gt.git
   cd no-gt
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your own values:
   - Set up a PostgreSQL database and update `DATABASE_URL`
   - Set up GitHub OAuth credentials (see below)
   - Generate a random secret for `NEXTAUTH_SECRET` using `openssl rand -base64 32`

5. Set up the database:

   ```bash
   npm run db:push
   # Or for migrations:
   npx prisma migrate dev
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

### Setting up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: "No-GT Development" (or your preferred name)
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret
6. Add these values to your `.env` file

## Deployment

The application is configured for deployment on Vercel:

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Add the required environment variables
4. Deploy!

## Project Structure

```txt
.
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets
├── scripts/                # Helper scripts
├── src/
│   ├── app/                # Next.js app router pages
│   │   ├── (auth)/         # Authentication routes
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard routes
│   │   ├── profile/        # User profile routes
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── auth/           # Authentication components
│   │   ├── nav/            # Navigation components
│   │   ├── providers/      # Context providers
│   │   └── ui/             # UI components
│   └── lib/                # Utility functions and libraries
│       ├── auth/           # Authentication utilities
│       ├── db.ts           # Database client
│       └── utils.ts        # Helper utilities
├── .env.example            # Example environment variables
├── docker-compose.yml      # Docker setup for local development
├── next.config.mjs         # Next.js configuration
└── package.json            # Project dependencies
```

## License

MIT License
