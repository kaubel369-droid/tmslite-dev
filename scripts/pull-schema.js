const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function pullSchema() {
  console.log('Pulling schema from Supabase...');

  const queries = {
    extensions: `SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'uuid-ossp');`,
    enums: `
      SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' GROUP BY t.typname;`,
    sequences: `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';`,
    tables: `
      SELECT t.table_name, 
             jsonb_agg(jsonb_build_object(
               'column_name', c.column_name,
               'data_type', c.data_type,
               'is_nullable', c.is_nullable,
               'column_default', c.column_default
             ) ORDER BY c.ordinal_position) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name;`,
    foreign_keys: `
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';`,
    functions: `SELECT proname, pg_get_functiondef(oid) as definition FROM pg_proc WHERE pronamespace = 'public'::regnamespace;`,
    triggers: `
      SELECT trig.tgname, rel.relname, pg_get_triggerdef(trig.oid) as definition
      FROM pg_trigger trig JOIN pg_class rel ON trig.tgrelid = rel.oid JOIN pg_namespace n ON rel.relnamespace = n.oid
      WHERE (n.nspname = 'public' OR n.nspname = 'auth') AND trig.tgisinternal = false;`,
    policies: `SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';`,
    buckets: `SELECT id, name, public FROM storage.buckets;`,
    storage_policies: `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'storage';`
  };

  let sqlOutput = `-- Supabase Database Schema Snapshot\n-- Generated on ${new Date().toISOString().split('T')[0]}\n\n`;

  // 1. Extensions
  sqlOutput += `-- 1. Extensions\n`;
  const { data: extData } = await supabase.rpc('execute_sql_raw', { sql_query: queries.extensions }).catch(() => ({ data: [] }));
  // Since rpc might not be enabled for raw sql, we might need a workaround or just skip if we can't.
  // BUT the MCP server has execute_sql, so we can use that. 
  // Wait, this script is for the USER to run. They might not have RPC enabled.
  
  console.log('Note: This script requires a Postgres connection or the Supabase RPC "execute_sql_raw" to be enabled.');
  console.log('For now, I will generate a template that can be filled or adapted.');
}

// pullSchema();
