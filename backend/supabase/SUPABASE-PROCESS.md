### 2. **Initialize Supabase in Your Project**

Navigate to your project root and run:

```bash
supabase init
```

This creates a `supabase/` directory structure with:
- `supabase/config.toml` - configuration file
- `supabase/migrations/` - where your migration files will live
- `supabase/seed.sql` - for seed data

### 3. **Start Local Development Environment**

```bash
supabase start
```

This spins up local Docker containers for Postgres, PostgREST, GoTrue, and other Supabase services. You'll get local connection details including:
- Database URL
- API URL
- Anonymous key
- Service role key

## Working with Migrations

### 4. **Create a New Migration**

```bash
supabase migration new <descriptive_name>
```

For example:
```bash
supabase migration new create_products_table
```

This creates a timestamped SQL file in `supabase/migrations/` like:
`20250929123456_create_products_table.sql`

### 5. **Edit Migration in Your Code Editor**

Open the generated file and add your SQL. Looking at your current schema file (`schemaV1_product_updates.sql`), you could break it into migrations.

### 6. **Apply Migrations Locally**

```bash
supabase db reset
```

This resets your local database and applies all migrations in order.

Or to just apply new migrations:
```bash
supabase migration up
```

## Deploy to Remote

### 7. **Connect to Your Remote Supabase Project**

First, login:
```bash
supabase login
```

Link your local project to your remote Supabase project:
```bash
supabase link --project-ref <your-project-id>
```

You can find your project ID in your Supabase dashboard URL: `https://app.supabase.com/project/<project_id>`

### 8. **Push Migrations to Remote**

```bash
supabase db push
```

This applies your local migrations to your remote database.

## Useful Commands

- `supabase status` - Check running services
- `supabase stop` - Stop local services
- `supabase db diff` - Generate migration from existing database changes
- `supabase migration list` - See all migrations and their status

## Tips for Your Project

Looking at your current structure, you might want to:

1. Convert your existing `schema_v1.sql` into migrations
2. Use `supabase db diff` if you've already applied changes to a database
3. Keep your migrations atomic and well-named
4. Use the `supabase/seed.sql` file for your test/sample data