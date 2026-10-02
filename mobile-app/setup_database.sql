-- Database Setup Script for Edgecase App
-- Run this script in pgAdmin Query Tool to set up your local database

-- 1. Create the user (role) if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'edgecase_user') THEN

      CREATE ROLE edgecase_user LOGIN PASSWORD 'edgecase_password';
      RAISE NOTICE 'Role "edgecase_user" created';
   ELSE
      RAISE NOTICE 'Role "edgecase_user" already exists';
   END IF;
END
$do$;

-- 2. Grant permissions (optional but good practice)
ALTER ROLE edgecase_user CREATEDB;

-- 3. Create the database
-- Note: In some Postgres environments, you cannot create a database inside a transaction block (DO block).
-- You might need to run this specific line separately if the script fails:
-- CREATE DATABASE supply_chain_db OWNER edgecase_user;

SELECT 'CREATE DATABASE supply_chain_db OWNER edgecase_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'supply_chain_db')\gexec

-- Instructions:
-- 1. Open pgAdmin
-- 2. Connect to your default server (usually 'PostgreSQL 15/16/etc')
-- 3. Right-click on the server > Query Tool
-- 4. Paste this script and run it (Play button or F5)
-- 5. If successful, you should see 'supply_chain_db' appear in the Databases list (you may need to Refresh)
