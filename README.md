# Nexamanga Backend

A robust NestJS-powered backend service for the Nexamanga platform, featuring Azure integration, queue processing with BullMQ, authentication, and automated scraping capabilities.

## Tech Stack

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Postgresql](https://www.postgresql.org/) with PrismaORM
- [BullMQ](https://docs.bullmq.io/) - Queue management
- [Passport](https://www.passportjs.org/) - Authentication
- [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs) - Cloud storage
- [Puppeteer](https://pptr.dev/) - Web scraping
- [Swagger](https://swagger.io/) - API documentation

## Prerequisites

- Node.js (v18 or higher recommended)
- Postgresql
- Redis (for BullMQ)
- AWS Account (for S3)
- Prisma CLI

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd manhwa-heaven-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with required environment variables:
```env
# Database
DATABASE_URL="your-mongodb-url"

# JWT
JWT_SECRET="your-jwt-secret"

#Azure Storage
AZURE_STORAGE_CONNECTION_STRING="your-azure-storage-connection-string"
AZURE_CONTAINER_NAME="your-azure-container-name"


# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="your-callback-url"
```

4. Run Prisma migrations:
```bash
npx prisma generate
npx prisma db push
#OR
npx prisma migrate dev
```

## Available Scripts

```bash
# Development
npm run start         # Start the application
npm run start:dev     # Start in watch mode
npm run start:debug   # Start in debug mode
npm run start:prod    # Start in production mode

# Build
npm run build                 # Build the application
npm run build-with-package    # Build with package.json copy

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage
npm run test:debug   # Run tests in debug mode
npm run test:e2e     # Run end-to-end tests

# Code Quality
npm run format       # Format code with Prettier
npm run lint         # Lint and fix with ESLint
```

## Project Structure

```
src/
├── auth/           # Authentication modules
├── common/         # Shared utilities and constants
├── config/         # Configuration modules
├── jobs/           # BullMQ job processors
├── manhwa/         # Manhwa-related modules
├── prisma/         # Prisma schema and migrations
├── azure/          # Azure Blob Storage integration
├── scraper/        # Puppeteer scraping logic
├── user/           # User management
└── main.ts         # Application entry point
```

## Features

### Authentication
- JWT-based authentication
- Google OAuth integration
- Local strategy with Passport
- Secure cookie handling

### Data Management
- Prisma ORM for database operations
- MongoDB integration with Mongoose
- Efficient data modeling and relations

### Queue Processing
- BullMQ integration for background jobs
- Scheduled tasks with @nestjs/schedule
- Redis-based queue management

### Cloud Storage
- AWS S3 integration for image storage
- Presigned URL generation
- Efficient file management

### Scraping
- Automated manhwa data collection
- Puppeteer integration
- Scheduled scraping jobs

### API Documentation
- Swagger UI integration
- OpenAPI specification
- Detailed endpoint documentation

## API Endpoints

Detailed API documentation is available at `/api/docs` when running the server.

## Development

### Adding New Features

1. Create a new module:
```bash
nest g module feature-name
```

2. Create a controller:
```bash
nest g controller feature-name
```

3. Create a service:
```bash
nest g service feature-name
```

### Database Management

Update Prisma schema:
```bash
# After modifying prisma/schema.prisma
npx prisma generate
npx prisma db push
```

### Running Jobs

The application uses BullMQ for job processing. Jobs can be monitored through Redis.

## Testing

The project includes Jest for testing:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

1. Build the application:
```bash
npm run build-with-package
```

2. Start in production mode:
```bash
npm run start:prod
```

### Docker Support

A Dockerfile and docker-compose configuration are available for containerized deployment.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED license.

## Support

For support, please raise an issue in the repository.