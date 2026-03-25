#!/bin/bash

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

PROJECT_REF="ckasriexpgmzasyffjjr"

echo "Syncing Supabase schema for project $PROJECT_REF..."

# Check if supabase CLI is available
if ! npx supabase --version &> /dev/null; then
  echo "Error: supabase CLI not found. Please run 'npm install'."
  exit 1
fi

# Pull the remote schema
# Note: This requires the DB password or an access token to be set up in the environment or via 'supabase link'
# For automation, we recommend setting SUPABASE_DB_PASSWORD or using an access token.
npx supabase db pull --project-id "$PROJECT_REF" --local > supabase_schema.sql.tmp

if [ $? -eq 0 ]; then
  mv supabase_schema.sql.tmp supabase_schema.sql
  echo "Successfully updated supabase_schema.sql"
else
  echo "Error: Failed to pull remote schema. Make sure you have the DB password set or are linked to the project."
  rm -f supabase_schema.sql.tmp
  exit 1
fi
