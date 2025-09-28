-- Complete database schema for Electric Data hotel management system
-- This includes tenants, rooms, and electrical devices with relationships

-- Drop existing tables and constraints (for clean reset)
DROP TABLE IF EXISTS "electrical_devices" CASCADE;
DROP TABLE IF EXISTS "rooms" CASCADE;
DROP TABLE IF EXISTS "tenants" CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tenants table
CREATE TABLE "tenants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "tenants_name_unique" UNIQUE("name")
);

-- Create rooms table
CREATE TABLE "rooms" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "room_number" varchar(255) NOT NULL,
    "room_type" varchar(100),
    "display_order" integer DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "rooms_tenant_room_unique" UNIQUE("tenant_id", "room_number")
);

-- Create electrical_devices table
CREATE TABLE "electrical_devices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "room_id" uuid,
    "device_name" varchar(255) NOT NULL,
    "power_watts" numeric(10, 2) NOT NULL,
    "usage_hours_per_day" numeric(4, 2) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "rooms"
ADD CONSTRAINT "rooms_tenant_id_tenants_id_fk"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "electrical_devices"
ADD CONSTRAINT "electrical_devices_tenant_id_tenants_id_fk"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "electrical_devices"
ADD CONSTRAINT "electrical_devices_room_id_rooms_id_fk"
FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Create indexes for better performance
CREATE INDEX "idx_tenants_name" ON "tenants"("name");
CREATE INDEX "idx_rooms_tenant_id" ON "rooms"("tenant_id");
CREATE INDEX "idx_rooms_display_order" ON "rooms"("tenant_id", "display_order");
CREATE INDEX "idx_electrical_devices_tenant_id" ON "electrical_devices"("tenant_id");
CREATE INDEX "idx_electrical_devices_room_id" ON "electrical_devices"("room_id");

-- Enable Row Level Security (RLS)
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "electrical_devices" ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON "tenants"
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON "rooms"
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON "electrical_devices"
    FOR ALL TO authenticated USING (true);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON "tenants"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON "rooms"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_electrical_devices_updated_at
    BEFORE UPDATE ON "electrical_devices"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO "tenants" ("name") VALUES
    ('Grand Plaza Hotel'),
    ('City Center Inn')
ON CONFLICT (name) DO NOTHING;

-- Get the tenant ID for sample data
DO $$
DECLARE
    tenant_uuid uuid;
BEGIN
    SELECT id INTO tenant_uuid FROM tenants WHERE name = 'Grand Plaza Hotel' LIMIT 1;

    IF tenant_uuid IS NOT NULL THEN
        -- Insert sample rooms
        INSERT INTO "rooms" ("tenant_id", "room_number", "room_type", "display_order") VALUES
            (tenant_uuid, '101', 'Standard', 1),
            (tenant_uuid, '102', 'Standard', 2),
            (tenant_uuid, 'Presidential Suite', 'Suite', 3)
        ON CONFLICT (tenant_id, room_number) DO NOTHING;
    END IF;
END $$;