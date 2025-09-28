-- Create tenants table
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "tenants_name_unique" UNIQUE("name")
);

-- Create electrical_devices table
CREATE TABLE IF NOT EXISTS "electrical_devices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "device_name" varchar(255) NOT NULL,
    "power_watts" numeric(10, 2) NOT NULL,
    "usage_hours_per_day" numeric(4, 2) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "electrical_devices"
ADD CONSTRAINT "electrical_devices_tenant_id_tenants_id_fk"
FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_electrical_devices_tenant_id" ON "electrical_devices"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tenants_name" ON "tenants"("name");

-- Enable Row Level Security (RLS)
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "electrical_devices" ENABLE ROW LEVEL SECURITY;

-- Create policies (basic setup - you can customize these later)
CREATE POLICY "Allow all operations for authenticated users" ON "tenants"
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON "electrical_devices"
    FOR ALL TO authenticated USING (true);