-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON "tenants";
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON "electrical_devices";

-- Create more permissive policies for development
-- NOTE: In production, you should create more restrictive policies based on your auth requirements

CREATE POLICY "Allow all operations for all users" ON "tenants"
    FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow all operations for all users" ON "electrical_devices"
    FOR ALL TO anon, authenticated USING (true);