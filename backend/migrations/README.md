# Database Migrations

This directory contains SQL migration files for initializing and updating the PostgreSQL database.

## Migration Files

### 001_create_favorites_table.sql
Creates the `favorites` table with the following structure:
- `id` (SERIAL PRIMARY KEY) - Auto-incrementing primary key
- `user_id` (VARCHAR(255)) - User identifier
- `image_id` (VARCHAR(255)) - Image identifier from ImageData
- `prompt` (TEXT) - The prompt used to generate the image
- `image_url` (TEXT) - URL where the image is stored
- `is_generating` (BOOLEAN) - Flag indicating if image is still being generated
- `variations` (JSONB) - Array of image variation URLs stored as JSON
- `created_at` (TIMESTAMP WITH TIME ZONE) - Record creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Record last update timestamp

**Constraints:**
- Unique constraint on `(user_id, image_id)` to prevent duplicate favorites

**Indexes:**
- Index on `user_id` for efficient user queries
- Index on `image_id` for efficient image lookups
- Index on `created_at` for time-based queries

**Triggers:**
- Auto-update `updated_at` timestamp on record updates

## Running Migrations

### Prerequisites
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export DB_HOST=your-rds-endpoint.amazonaws.com
   export DB_USER=postgres
   export DB_PASSWORD=yourpassword
   export DB_NAME=imagegen
   export DB_PORT=5432
   ```

### Execute Migration
Run the migration script from the backend directory:
```bash
npm run migrate
```

Or run with inline environment variables:
```bash
DB_HOST=your-rds-endpoint.amazonaws.com DB_USER=postgres DB_PASSWORD=yourpassword DB_NAME=imagegen npm run migrate
```

You can also run the TypeScript file directly:
```bash
npx ts-node run-migration.ts
```

### Verification
The migration script will automatically verify the table creation and display the table structure after successful completion.

## Manual Execution
You can also run the migration manually using `psql`:
```bash
psql -h your-rds-endpoint.amazonaws.com -U postgres -d imagegen -f migrations/001_create_favorites_table.sql
```

## Environment Variables
- `DB_HOST` - PostgreSQL host (RDS endpoint)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_PORT` - Database port (default: 5432)
- `NODE_ENV` - Set to 'production' for SSL connections 