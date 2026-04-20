


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."customer_status" AS ENUM (
    'Active',
    'Credit Hold',
    'Inactive'
);


ALTER TYPE "public"."customer_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'BOL',
    'POD',
    'Rate_Con',
    'Invoice',
    'Other',
    'Insurance',
    'W9',
    'License'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."load_status" AS ENUM (
    'Not Dispatched',
    'Dispatched',
    'In-Transit',
    'Delivered',
    'Invoiced',
    'Cancelled'
);


ALTER TYPE "public"."load_status" OWNER TO "postgres";


CREATE TYPE "public"."sales_lead_status" AS ENUM (
    'New',
    'Contacted',
    'Qualified',
    'Lost',
    'Converted'
);


ALTER TYPE "public"."sales_lead_status" OWNER TO "postgres";


CREATE TYPE "public"."shipper_consignee_status" AS ENUM (
    'Active',
    'Credit Hold',
    'Inactive'
);


ALTER TYPE "public"."shipper_consignee_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'Admin',
    'Broker',
    'Dispatcher',
    'Supervisor',
    'Customer Service Rep',
    'Sales Rep',
    'Customer',
    'Sales Rep/Customer Service Rep'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_api_key"("encrypted_key" "text", "secret_key" "text") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select pgp_sym_decrypt(encrypted_key::bytea, secret_key);
$$;


ALTER FUNCTION "public"."decrypt_api_key"("encrypted_key" "text", "secret_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_api_key"("raw_key" "text", "secret_key" "text") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select pgp_sym_encrypt(raw_key, secret_key)::text;
$$;


ALTER FUNCTION "public"."encrypt_api_key"("raw_key" "text", "secret_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_tracking_info"("p_load_number" "text") RETURNS TABLE("load_number" "text", "status" "public"."load_status", "origin_zip" "text", "destination_zip" "text", "last_updated" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    load_number, 
    status, 
    origin_zip, 
    destination_zip, 
    updated_at as last_updated
  FROM public.loads
  WHERE load_number = p_load_number;
$$;


ALTER FUNCTION "public"."get_public_tracking_info"("p_load_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_org_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select org_id from public.profiles where id = auth.uid() limit 1;
$$;


ALTER FUNCTION "public"."get_user_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_sync_profile_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_sync_profile_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accessorials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "min_charge" numeric,
    "max_charge" numeric,
    "charge_per_pound" numeric,
    "charge_per_piece" numeric,
    "fixed_price" numeric,
    "API_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."accessorials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_number" bigint NOT NULL,
    "event_date" "date" NOT NULL,
    "event_time" time without time zone,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "notes" "text",
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid",
    "last_modified_date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_modified_by" "uuid",
    "assigned_to_role" "text",
    CONSTRAINT "calendar_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['Appointment'::"text", 'Task'::"text", 'Event'::"text"]))),
    CONSTRAINT "calendar_events_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'In Progress'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


ALTER TABLE "public"."calendar_events" ALTER COLUMN "event_number" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."calendar_events_event_number_seq"
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."carrier_accessorials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "carrier_id" "uuid" NOT NULL,
    "accessorial_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "min_charge" numeric,
    "max_charge" numeric,
    "charge_per_pound" numeric,
    "charge_per_piece" numeric,
    "fixed_price" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."carrier_accessorials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carrier_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "carrier_name" "text" NOT NULL,
    "scac_code" "text" NOT NULL,
    "api_client_id" "text",
    "api_client_secret" "text",
    "api_key" "text",
    "account_number" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."carrier_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carrier_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "carrier_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "ext" "text",
    "cell_phone" "text",
    "email" "text",
    "position" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."carrier_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carrier_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "carrier_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."carrier_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carrier_insurance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "carrier_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "insurance_company" "text",
    "policy_number" "text",
    "expiration_date" "date",
    "coverage_amount" "text",
    "agent" "text",
    "phone" "text",
    "email" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."carrier_insurance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carriers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "phone" "text",
    "status" "text" DEFAULT 'Active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "website" "text",
    "dot_number" "text",
    "ein" "text",
    "mc_number" "text",
    "scac" "text",
    "insurance_status" "text",
    "notes" "text",
    "api_key" "text",
    "api_secret" "text",
    "api_url" "text",
    "api_account_number" "text",
    "api_username" "text",
    "api_password" "text",
    "api_enabled" boolean DEFAULT false,
    "safety_rating" "text",
    "last_safety_check" timestamp with time zone
);


ALTER TABLE "public"."carriers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "cell_phone" "text",
    "email" "text",
    "position" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ext" character varying(4)
);


ALTER TABLE "public"."customer_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."customer_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "load_id" "uuid",
    "type" "public"."document_type" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_private" boolean DEFAULT false
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."customer_portal_documents" WITH ("security_invoker"='true') AS
 SELECT "id",
    "org_id",
    "load_id",
    "type",
    "file_path",
    "file_name",
    "created_at",
    "is_private"
   FROM "public"."documents"
  WHERE ("type" <> 'Rate_Con'::"public"."document_type");


ALTER VIEW "public"."customer_portal_documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."load_number_seq"
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."load_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "load_number" "text" DEFAULT ("nextval"('"public"."load_number_seq"'::"regclass"))::"text" NOT NULL,
    "status" "public"."load_status" DEFAULT 'Not Dispatched'::"public"."load_status" NOT NULL,
    "origin_zip" "text" NOT NULL,
    "destination_zip" "text" NOT NULL,
    "total_weight" numeric(10,2) NOT NULL,
    "nmfc_class" "text",
    "total_pallets" integer,
    "customer_rate" numeric(10,2),
    "carrier_rate" numeric(10,2),
    "fuel_surcharge" numeric(10,2),
    "carrier_quote_id" "text",
    "carrier_pro_number" "text",
    "selected_carrier_id" "uuid",
    "pickup_date" "date",
    "delivery_date" "date",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "shipper_id" "uuid",
    "consignee_id" "uuid",
    "bol_number" "text",
    "internal_notes" "text",
    "bol_notes" "text",
    "tracing_notes" "text",
    "load_type" "text" DEFAULT 'LTL'::"text",
    "mileage" numeric(10,2),
    "invoice_notes" "text"
);


ALTER TABLE "public"."loads" OWNER TO "postgres";


COMMENT ON TABLE "public"."loads" IS 'Stores load information';



COMMENT ON COLUMN "public"."loads"."selected_carrier_id" IS 'Refers to the carrier selected from the carriers table';



CREATE OR REPLACE VIEW "public"."customer_portal_loads" WITH ("security_invoker"='true') AS
 SELECT "id",
    "load_number",
    "status",
    "origin_zip",
    "destination_zip",
    "total_weight",
    "nmfc_class",
    "total_pallets",
    "customer_rate",
    "pickup_date",
    "delivery_date",
    "shipper_id",
    "consignee_id",
    "bol_notes",
    "created_at",
    "updated_at",
    "customer_id",
    "org_id"
   FROM "public"."loads";


ALTER VIEW "public"."customer_portal_loads" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."customer_spot_quote_number_seq"
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."customer_spot_quote_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_spot_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "quote_number" "text" DEFAULT ("nextval"('"public"."customer_spot_quote_number_seq"'::"regclass"))::"text",
    "quote_date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "rate" numeric(10,2) DEFAULT 0.00,
    "shipper_location_id" "uuid",
    "consignee_location_id" "uuid",
    "pcs" integer,
    "type" "text",
    "weight" numeric(10,2),
    "cubic_ft" numeric(10,2),
    "products" "jsonb",
    "accessorials" "jsonb",
    "additional_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "carrier_id" "uuid",
    "carrier_rate" numeric,
    "shipper_zip" "text",
    "shipper_city" "text",
    "shipper_state" "text",
    "consignee_zip" "text",
    "consignee_city" "text",
    "consignee_state" "text",
    "shipment_type" "text"
);


ALTER TABLE "public"."customer_spot_quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "primary_contact" "text",
    "email" "text",
    "phone" "text",
    "credit_limit" numeric(10,2) DEFAULT 0.00,
    "payment_terms" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "website" "text",
    "status" "public"."customer_status" DEFAULT 'Active'::"public"."customer_status" NOT NULL,
    "notes" "text",
    "dispatch_notes" "text",
    "sales_person_id" "uuid",
    "carrier_configs" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."document_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keep_alive" (
    "id" bigint NOT NULL,
    "last_ping" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."keep_alive" OWNER TO "postgres";


ALTER TABLE "public"."keep_alive" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."keep_alive_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."load_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "load_id" "uuid" NOT NULL,
    "pallets" integer,
    "weight" numeric(10,2),
    "description" "text",
    "nmfc_class" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "unit_type" "text" DEFAULT 'PLT'::"text",
    "pcs" integer,
    "length_in" numeric,
    "width_in" numeric,
    "height_in" numeric,
    "cubic_feet" numeric
);


ALTER TABLE "public"."load_products" OWNER TO "postgres";


COMMENT ON TABLE "public"."load_products" IS 'Stores product line items for a load';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "mc_number" "text",
    "dot_number" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "org_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "role" "public"."user_role" DEFAULT 'Broker'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "customer_id" "uuid",
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quote_number_seq"
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."quote_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "quote_number" "text" DEFAULT ('Q-'::"text" || ("nextval"('"public"."quote_number_seq"'::"regclass"))::"text") NOT NULL,
    "carrier_id" "uuid",
    "carrier_name" "text",
    "scac" "text",
    "base_rate" numeric(10,2),
    "fuel_surcharge" numeric(10,2),
    "accessorials_total" numeric(10,2),
    "total_carrier_rate" numeric(10,2),
    "customer_rate" numeric(10,2),
    "transit_days" integer,
    "origin_info" "jsonb",
    "destination_info" "jsonb",
    "items" "jsonb",
    "accessorials" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "load_id" "uuid",
    "carrier_id" "uuid" NOT NULL,
    "base_rate" numeric DEFAULT 0 NOT NULL,
    "accessorial_total" numeric DEFAULT 0 NOT NULL,
    "total_rate" numeric DEFAULT 0 NOT NULL,
    "customer_total_rate" numeric DEFAULT 0 NOT NULL,
    "transit_days" integer,
    "quote_id" "text",
    "raw_response" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."rate_quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "permission_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_lead_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_lead_id" "uuid" NOT NULL,
    "activity_date" timestamp with time zone NOT NULL,
    "activity_type" "text" NOT NULL,
    "description" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "sales_lead_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['Phone Call'::"text", 'Email'::"text", 'In Person'::"text", 'Other'::"text"])))
);


ALTER TABLE "public"."sales_lead_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_lead_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_lead_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "cell_phone" "text",
    "email" "text",
    "position" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ext" "text"
);


ALTER TABLE "public"."sales_lead_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "primary_contact" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "website" "text",
    "status" "public"."sales_lead_status" DEFAULT 'New'::"public"."sales_lead_status" NOT NULL,
    "notes" "text",
    "assigned_to" "uuid",
    "converted_to_customer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."sales_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipper_consignee_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipper_consignee_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "cell_phone" "text",
    "email" "text",
    "position" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."shipper_consignee_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipper_consignees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "status" "public"."shipper_consignee_status" DEFAULT 'Active'::"public"."shipper_consignee_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "customer_id" "uuid"
);


ALTER TABLE "public"."shipper_consignees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zip_codes" (
    "zip" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state_id" "text" NOT NULL,
    "state_name" "text" NOT NULL
);


ALTER TABLE "public"."zip_codes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accessorials"
    ADD CONSTRAINT "accessorials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carrier_accessorials"
    ADD CONSTRAINT "carrier_accessorials_carrier_id_accessorial_id_key" UNIQUE ("carrier_id", "accessorial_id");



ALTER TABLE ONLY "public"."carrier_accessorials"
    ADD CONSTRAINT "carrier_accessorials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carrier_accounts"
    ADD CONSTRAINT "carrier_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carrier_contacts"
    ADD CONSTRAINT "carrier_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carrier_documents"
    ADD CONSTRAINT "carrier_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carrier_insurance"
    ADD CONSTRAINT "carrier_insurance_carrier_id_key" UNIQUE ("carrier_id");



ALTER TABLE ONLY "public"."carrier_insurance"
    ADD CONSTRAINT "carrier_insurance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carriers"
    ADD CONSTRAINT "carriers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_contacts"
    ADD CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_spot_quotes"
    ADD CONSTRAINT "customer_spot_quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_spot_quotes"
    ADD CONSTRAINT "customer_spot_quotes_quote_number_key" UNIQUE ("quote_number");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keep_alive"
    ADD CONSTRAINT "keep_alive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."load_products"
    ADD CONSTRAINT "load_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_load_number_key" UNIQUE ("load_number");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_quote_number_key" UNIQUE ("quote_number");



ALTER TABLE ONLY "public"."rate_quotes"
    ADD CONSTRAINT "rate_quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_permission_id_key" UNIQUE ("role", "permission_id");



ALTER TABLE ONLY "public"."sales_lead_activities"
    ADD CONSTRAINT "sales_lead_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_lead_contacts"
    ADD CONSTRAINT "sales_lead_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_org_id_setting_key_key" UNIQUE ("org_id", "setting_key");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipper_consignee_contacts"
    ADD CONSTRAINT "shipper_consignee_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipper_consignees"
    ADD CONSTRAINT "shipper_consignees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zip_codes"
    ADD CONSTRAINT "zip_codes_pkey" PRIMARY KEY ("zip");



CREATE INDEX "idx_profiles_customer_id" ON "public"."profiles" USING "btree" ("customer_id");



CREATE OR REPLACE TRIGGER "update_customer_spot_quotes_updated_at" BEFORE UPDATE ON "public"."customer_spot_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_document_templates_updated_at" BEFORE UPDATE ON "public"."document_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."accessorials"
    ADD CONSTRAINT "accessorials_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_accessorials"
    ADD CONSTRAINT "carrier_accessorials_accessorial_id_fkey" FOREIGN KEY ("accessorial_id") REFERENCES "public"."accessorials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_accessorials"
    ADD CONSTRAINT "carrier_accessorials_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_accounts"
    ADD CONSTRAINT "carrier_accounts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_contacts"
    ADD CONSTRAINT "carrier_contacts_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_contacts"
    ADD CONSTRAINT "carrier_contacts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_documents"
    ADD CONSTRAINT "carrier_documents_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_documents"
    ADD CONSTRAINT "carrier_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carrier_documents"
    ADD CONSTRAINT "carrier_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."carrier_insurance"
    ADD CONSTRAINT "carrier_insurance_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carriers"
    ADD CONSTRAINT "carriers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_contacts"
    ADD CONSTRAINT "customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_spot_quotes"
    ADD CONSTRAINT "customer_spot_quotes_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id");



ALTER TABLE ONLY "public"."customer_spot_quotes"
    ADD CONSTRAINT "customer_spot_quotes_consignee_location_id_fkey" FOREIGN KEY ("consignee_location_id") REFERENCES "public"."shipper_consignees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_spot_quotes"
    ADD CONSTRAINT "customer_spot_quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_spot_quotes"
    ADD CONSTRAINT "customer_spot_quotes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_spot_quotes"
    ADD CONSTRAINT "customer_spot_quotes_shipper_location_id_fkey" FOREIGN KEY ("shipper_location_id") REFERENCES "public"."shipper_consignees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."load_products"
    ADD CONSTRAINT "load_products_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_consignee_id_fkey" FOREIGN KEY ("consignee_id") REFERENCES "public"."shipper_consignees"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_selected_carrier_id_fkey" FOREIGN KEY ("selected_carrier_id") REFERENCES "public"."carriers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_shipper_id_fkey" FOREIGN KEY ("shipper_id") REFERENCES "public"."shipper_consignees"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rate_quotes"
    ADD CONSTRAINT "rate_quotes_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rate_quotes"
    ADD CONSTRAINT "rate_quotes_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rate_quotes"
    ADD CONSTRAINT "rate_quotes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_lead_activities"
    ADD CONSTRAINT "sales_lead_activities_sales_lead_id_fkey" FOREIGN KEY ("sales_lead_id") REFERENCES "public"."sales_leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_lead_contacts"
    ADD CONSTRAINT "sales_lead_contacts_sales_lead_id_fkey" FOREIGN KEY ("sales_lead_id") REFERENCES "public"."sales_leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_converted_to_customer_id_fkey" FOREIGN KEY ("converted_to_customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_leads"
    ADD CONSTRAINT "sales_leads_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipper_consignee_contacts"
    ADD CONSTRAINT "shipper_consignee_contacts_shipper_consignee_id_fkey" FOREIGN KEY ("shipper_consignee_id") REFERENCES "public"."shipper_consignees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipper_consignees"
    ADD CONSTRAINT "shipper_consignees_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipper_consignees"
    ADD CONSTRAINT "shipper_consignees_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and Supervisors can insert calendar events for anyone" ON "public"."calendar_events" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"public"."user_role", 'Supervisor'::"public"."user_role"]))))) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Admins and Supervisors have full access to sales leads in org" ON "public"."sales_leads" USING ((("org_id" = "public"."get_user_org_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"public"."user_role", 'Supervisor'::"public"."user_role"])))))));



CREATE POLICY "Admins can delete accessorials for their organization" ON "public"."accessorials" FOR DELETE USING (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE (("p"."org_id" = "accessorials"."org_id") AND ("p"."role" = 'Admin'::"public"."user_role")))));



CREATE POLICY "Admins can do everything on document_templates" ON "public"."document_templates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"public"."user_role")))));



CREATE POLICY "Admins can insert accessorials for their organization" ON "public"."accessorials" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE (("p"."org_id" = "accessorials"."org_id") AND ("p"."role" = 'Admin'::"public"."user_role")))));



CREATE POLICY "Admins can update accessorials for their organization" ON "public"."accessorials" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE (("p"."org_id" = "accessorials"."org_id") AND ("p"."role" = 'Admin'::"public"."user_role")))));



CREATE POLICY "Allow public read-only access to keep_alive" ON "public"."keep_alive" FOR SELECT USING (true);



CREATE POLICY "Anyone can view permissions" ON "public"."permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Anyone can view role_permissions" ON "public"."role_permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Anyone can view zip codes" ON "public"."zip_codes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Only Supervisor or Admin can delete carrier documents" ON "public"."carrier_documents" FOR DELETE USING ((("org_id" = "public"."get_user_org_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"public"."user_role", 'Supervisor'::"public"."user_role"])))))));



CREATE POLICY "Org isolation for carrier_accounts" ON "public"."carrier_accounts" USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Org isolation for customer_contacts" ON "public"."customer_contacts" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."org_id" = "public"."get_user_org_id"()))));



CREATE POLICY "Org isolation for customer_documents" ON "public"."customer_documents" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."org_id" = "public"."get_user_org_id"()))));



CREATE POLICY "Org isolation for customer_spot_quotes" ON "public"."customer_spot_quotes" USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Org isolation for customers" ON "public"."customers" USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Org isolation for documents" ON "public"."documents" USING ((("org_id" = "public"."get_user_org_id"()) AND ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"public"."user_role", 'Supervisor'::"public"."user_role", 'Sales Rep'::"public"."user_role", 'Customer Service Rep'::"public"."user_role", 'Sales Rep/Customer Service Rep'::"public"."user_role"]))))) OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Customer'::"public"."user_role")))) AND ("type" <> 'Rate_Con'::"public"."document_type") AND ("load_id" IN ( SELECT "loads"."id"
   FROM "public"."loads"
  WHERE ("loads"."customer_id" = ( SELECT "profiles"."customer_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())))))))));



CREATE POLICY "Org isolation for load_products" ON "public"."load_products" USING (("load_id" IN ( SELECT "loads"."id"
   FROM "public"."loads"
  WHERE ("loads"."org_id" = "public"."get_user_org_id"()))));



CREATE POLICY "Org isolation for loads" ON "public"."loads" USING ((("org_id" = "public"."get_user_org_id"()) AND ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"public"."user_role", 'Supervisor'::"public"."user_role", 'Sales Rep'::"public"."user_role", 'Customer Service Rep'::"public"."user_role", 'Sales Rep/Customer Service Rep'::"public"."user_role"]))))) OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Customer'::"public"."user_role")))) AND ("customer_id" = ( SELECT "profiles"."customer_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))))));



CREATE POLICY "Org isolation for rate_quotes" ON "public"."rate_quotes" USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Org isolation for sales_lead_activities" ON "public"."sales_lead_activities" USING (("sales_lead_id" IN ( SELECT "sales_leads"."id"
   FROM "public"."sales_leads"
  WHERE ("sales_leads"."org_id" = "public"."get_user_org_id"()))));



CREATE POLICY "Org isolation for sales_lead_contacts" ON "public"."sales_lead_contacts" USING (("sales_lead_id" IN ( SELECT "sales_leads"."id"
   FROM "public"."sales_leads"
  WHERE ("sales_leads"."org_id" = "public"."get_user_org_id"()))));



CREATE POLICY "Org isolation for settings" ON "public"."settings" USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Org isolation for shipper_consignee_contacts" ON "public"."shipper_consignee_contacts" USING (("shipper_consignee_id" IN ( SELECT "shipper_consignees"."id"
   FROM "public"."shipper_consignees"
  WHERE ("shipper_consignees"."org_id" = "public"."get_user_org_id"()))));



CREATE POLICY "Org isolation for shipper_consignees" ON "public"."shipper_consignees" USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Sales Reps can access assigned sales leads" ON "public"."sales_leads" USING ((("org_id" = "public"."get_user_org_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Sales Rep'::"public"."user_role", 'Sales Rep/Customer Service Rep'::"public"."user_role"]))))) AND ("assigned_to" = "auth"."uid"())));



CREATE POLICY "Users can delete carrier accessorials in their organization" ON "public"."carrier_accessorials" FOR DELETE USING (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE ("p"."org_id" = "carrier_accessorials"."org_id"))));



CREATE POLICY "Users can delete carrier contacts in their organization" ON "public"."carrier_contacts" FOR DELETE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "Users can delete carriers in their organization" ON "public"."carriers" FOR DELETE USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can delete quotes in their organization" ON "public"."quotes" FOR DELETE USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert carrier accessorials in their organization" ON "public"."carrier_accessorials" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE ("p"."org_id" = "carrier_accessorials"."org_id"))));



CREATE POLICY "Users can insert carrier contacts in their organization" ON "public"."carrier_contacts" FOR INSERT WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "Users can insert carrier documents in their organization" ON "public"."carrier_documents" FOR INSERT WITH CHECK (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can insert carriers in their organization" ON "public"."carriers" FOR INSERT WITH CHECK (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can insert quotes in their organization" ON "public"."quotes" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can manage assigned and created events" ON "public"."calendar_events" USING ((("user_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can manage their organization's carrier insurance" ON "public"."carrier_insurance" USING (("org_id" = "public"."get_user_org_id"())) WITH CHECK (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can update carrier accessorials in their organization" ON "public"."carrier_accessorials" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE ("p"."org_id" = "carrier_accessorials"."org_id"))));



CREATE POLICY "Users can update carrier contacts in their organization" ON "public"."carrier_contacts" FOR UPDATE USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text"))) WITH CHECK ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "Users can update carrier documents in their organization" ON "public"."carrier_documents" FOR UPDATE USING (("org_id" = "public"."get_user_org_id"())) WITH CHECK (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can update carriers in their organization" ON "public"."carriers" FOR UPDATE USING (("org_id" = "public"."get_user_org_id"())) WITH CHECK (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update quotes in their organization" ON "public"."quotes" FOR UPDATE USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view assigned and created events" ON "public"."calendar_events" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can view carrier accessorials in their organization" ON "public"."carrier_accessorials" FOR SELECT USING (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE ("p"."org_id" = "carrier_accessorials"."org_id"))));



CREATE POLICY "Users can view carrier contacts in their organization" ON "public"."carrier_contacts" FOR SELECT USING ((("org_id")::"text" = ("auth"."jwt"() ->> 'org_id'::"text")));



CREATE POLICY "Users can view carrier documents in their organization" ON "public"."carrier_documents" FOR SELECT USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can view carriers in their organization" ON "public"."carriers" FOR SELECT USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can view profiles in their org" ON "public"."profiles" FOR SELECT USING (("org_id" = "public"."get_user_org_id"()));



CREATE POLICY "Users can view quotes in their organization" ON "public"."quotes" FOR SELECT USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view their organization's accessorials" ON "public"."accessorials" FOR SELECT USING (("auth"."uid"() IN ( SELECT "p"."id"
   FROM "public"."profiles" "p"
  WHERE ("p"."org_id" = "accessorials"."org_id"))));



CREATE POLICY "Users can view their own organization" ON "public"."organizations" FOR SELECT USING (("id" = "public"."get_user_org_id"()));



ALTER TABLE "public"."accessorials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carrier_accessorials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carrier_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carrier_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carrier_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carrier_insurance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carriers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_spot_quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keep_alive" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."load_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_lead_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_lead_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipper_consignee_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipper_consignees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zip_codes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "postgres";
GRANT ALL ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO PUBLIC;

























































































































































GRANT ALL ON FUNCTION "public"."decrypt_api_key"("encrypted_key" "text", "secret_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_api_key"("encrypted_key" "text", "secret_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_api_key"("encrypted_key" "text", "secret_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_api_key"("raw_key" "text", "secret_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_api_key"("raw_key" "text", "secret_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_api_key"("raw_key" "text", "secret_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_tracking_info"("p_load_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_tracking_info"("p_load_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_tracking_info"("p_load_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_sync_profile_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_sync_profile_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_sync_profile_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."accessorials" TO "anon";
GRANT ALL ON TABLE "public"."accessorials" TO "authenticated";
GRANT ALL ON TABLE "public"."accessorials" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."calendar_events_event_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."calendar_events_event_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."calendar_events_event_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."carrier_accessorials" TO "anon";
GRANT ALL ON TABLE "public"."carrier_accessorials" TO "authenticated";
GRANT ALL ON TABLE "public"."carrier_accessorials" TO "service_role";



GRANT ALL ON TABLE "public"."carrier_accounts" TO "anon";
GRANT ALL ON TABLE "public"."carrier_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."carrier_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."carrier_contacts" TO "anon";
GRANT ALL ON TABLE "public"."carrier_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."carrier_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."carrier_documents" TO "anon";
GRANT ALL ON TABLE "public"."carrier_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."carrier_documents" TO "service_role";



GRANT ALL ON TABLE "public"."carrier_insurance" TO "anon";
GRANT ALL ON TABLE "public"."carrier_insurance" TO "authenticated";
GRANT ALL ON TABLE "public"."carrier_insurance" TO "service_role";



GRANT ALL ON TABLE "public"."carriers" TO "anon";
GRANT ALL ON TABLE "public"."carriers" TO "authenticated";
GRANT ALL ON TABLE "public"."carriers" TO "service_role";



GRANT ALL ON TABLE "public"."customer_contacts" TO "anon";
GRANT ALL ON TABLE "public"."customer_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."customer_documents" TO "anon";
GRANT ALL ON TABLE "public"."customer_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_documents" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."customer_portal_documents" TO "anon";
GRANT ALL ON TABLE "public"."customer_portal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_portal_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."load_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."load_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."load_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."loads" TO "anon";
GRANT ALL ON TABLE "public"."loads" TO "authenticated";
GRANT ALL ON TABLE "public"."loads" TO "service_role";



GRANT ALL ON TABLE "public"."customer_portal_loads" TO "anon";
GRANT ALL ON TABLE "public"."customer_portal_loads" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_portal_loads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."customer_spot_quote_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."customer_spot_quote_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."customer_spot_quote_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."customer_spot_quotes" TO "anon";
GRANT ALL ON TABLE "public"."customer_spot_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_spot_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."document_templates" TO "anon";
GRANT ALL ON TABLE "public"."document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."document_templates" TO "service_role";



GRANT ALL ON TABLE "public"."keep_alive" TO "anon";
GRANT ALL ON TABLE "public"."keep_alive" TO "authenticated";
GRANT ALL ON TABLE "public"."keep_alive" TO "service_role";



GRANT ALL ON SEQUENCE "public"."keep_alive_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."keep_alive_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."keep_alive_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."load_products" TO "anon";
GRANT ALL ON TABLE "public"."load_products" TO "authenticated";
GRANT ALL ON TABLE "public"."load_products" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quote_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quote_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quote_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."rate_quotes" TO "anon";
GRANT ALL ON TABLE "public"."rate_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."sales_lead_activities" TO "anon";
GRANT ALL ON TABLE "public"."sales_lead_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_lead_activities" TO "service_role";



GRANT ALL ON TABLE "public"."sales_lead_contacts" TO "anon";
GRANT ALL ON TABLE "public"."sales_lead_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_lead_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."sales_leads" TO "anon";
GRANT ALL ON TABLE "public"."sales_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_leads" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."shipper_consignee_contacts" TO "anon";
GRANT ALL ON TABLE "public"."shipper_consignee_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."shipper_consignee_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."shipper_consignees" TO "anon";
GRANT ALL ON TABLE "public"."shipper_consignees" TO "authenticated";
GRANT ALL ON TABLE "public"."shipper_consignees" TO "service_role";



GRANT ALL ON TABLE "public"."zip_codes" TO "anon";
GRANT ALL ON TABLE "public"."zip_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."zip_codes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































