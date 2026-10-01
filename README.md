# JobScout

Personal job monitoring service that processes LinkedIn Job Alert emails, analyzes them with LLM, and delivers relevant matches via Telegram.

## Features

- **Email Processing**: Automatically fetches and parses LinkedIn Job Alert emails via Gmail API
- **Intelligent Deduplication**: Prevents duplicate jobs using source ID + URL hash matching
- **LLM Analysis**: Uses OpenAI to extract job details (seniority, tech stack, remote type)
- **Smart Filtering**: Personal matching based on seniority, tech stack, role, and location
- **Remote Location Logic**: Properly handles EU/EMEA/Worldwide restrictions
- **Telegram Notifications**: Sends matched jobs with inline action buttons

## Pipeline

```
LinkedIn Job Alerts → Gmail API → Parser → Deduplication → LLM Analysis → Personal Filters → Telegram Bot
```

## Tech Stack

- **Runtime**: Node.js 22+ with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Gmail API (OAuth2)
- **AI**: OpenAI API (GPT-4o-mini)
- **Notifications**: Telegram Bot API
- **Validation**: Zod
- **Testing**: Vitest (80+ tests)
- **Linting**: ESLint + Prettier
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Gmail API credentials
- OpenAI API key
- Telegram Bot token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Paul-Ananich/JobScout.git
cd JobScout
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Set up database:
```bash
npx prisma migrate dev
```

5. Run the application:
```bash
npm run dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose run migrate

# View logs
docker-compose logs -f app
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GMAIL_CLIENT_ID` | Google OAuth2 client ID | Yes |
| `GMAIL_CLIENT_SECRET` | Google OAuth2 client secret | Yes |
| `GMAIL_REFRESH_TOKEN` | Gmail refresh token | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `OPENAI_MODEL` | OpenAI model (default: gpt-4o-mini) | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Yes |
| `TELEGRAM_CHAT_ID` | Telegram chat ID | Yes |
| `EMAIL_POLL_INTERVAL_MS` | Email polling interval (default: 60000) | No |
| `MAX_JOBS_PER_BATCH` | Max jobs per batch (default: 10) | No |
| `LOG_LEVEL` | Log level (default: info) | No |

### Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth2 credentials (Desktop app)
5. Download credentials and get refresh token

### Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create new bot with `/newbot`
3. Copy the bot token
4. Get your chat ID by messaging [@userinfobot](https://t.me/userinfobot)

## Personal Filters

The default filter configuration targets:

- **Seniority**: Senior, Lead, Staff, Principal
- **Tech Stack**: React, React Native, TypeScript, Node.js, etc.
- **Roles**: Frontend, React, Mobile, Full Stack, Software Engineer
- **Remote Types**: Worldwide, Europe, EMEA
- **User Location**: Georgia (accepts Belarus, Georgia, Europe, Worldwide)

Modify `src/modules/filters/config.ts` to customize.

## Remote Location Logic

The system correctly handles remote restrictions:

| Remote Type | Belarus | Georgia | Germany |
|-------------|---------|---------|---------|
| Worldwide | ✅ | ✅ | ✅ |
| Europe | ✅ | ✅ | ✅ |
| EU Only | ❌ | ❌ | ✅ |
| EMEA | ✅ | ✅ | ✅ |
| US Only | ❌ | ❌ | ❌ |

**Important**: "Remote" alone does NOT mean worldwide. The LLM analyzes job descriptions to detect actual location restrictions.

## Project Structure

```
src/
├── config/           # Configuration loading
├── db/               # Prisma client
├── modules/
│   ├── analyzer/     # LLM job analysis
│   ├── email/        # Gmail API client
│   ├── filters/      # Job matching logic
│   ├── jobs/         # Job repository & service
│   ├── parser/       # LinkedIn email parser
│   └── telegram/     # Telegram notifications
├── shared/           # Types, utils, logger
├── workers/          # Background workers
└── index.ts          # Entry point
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Development

```bash
# TypeScript check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Dev mode with hot reload
npm run dev
```

## License

MIT
