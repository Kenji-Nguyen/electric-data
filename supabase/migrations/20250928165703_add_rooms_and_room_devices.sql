-- Create rooms table
CREATE TABLE IF NOT EXISTS "rooms" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "room_number" varchar(255) NOT NULL,
    "room_type" varchar(100),
    "display_order" integer DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "rooms_tenant_room_unique" UNIQUE("tenant_id", "room_number")
);

-- Add foreign key constraint for rooms
ALTER TABLE "rooms"
ADD CONSTRAINT "rooms_tenant_id_tenants_id_fk"
FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add room_id column to electrical_devices table
ALTER TABLE "electrical_devices"
ADD COLUMN "room_id" uuid;

-- Add foreign key constraint for room_id
ALTER TABLE "electrical_devices"
ADD CONSTRAINT "electrical_devices_room_id_rooms_id_fk"
FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_rooms_tenant_id" ON "rooms"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_rooms_display_order" ON "rooms"("tenant_id", "display_order");
CREATE INDEX IF NOT EXISTS "idx_electrical_devices_room_id" ON "electrical_devices"("room_id");

-- Enable Row Level Security (RLS) for rooms
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms table
CREATE POLICY "Allow all operations for authenticated users" ON "rooms"
    FOR ALL TO authenticated USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at for rooms
DROP TRIGGER IF EXISTS update_rooms_updated_at ON "rooms";
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON "rooms"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for tenants and electrical_devices if they don't exist
DROP TRIGGER IF EXISTS update_tenants_updated_at ON "tenants";
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON "tenants"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_electrical_devices_updated_at ON "electrical_devices";
CREATE TRIGGER update_electrical_devices_updated_at
    BEFORE UPDATE ON "electrical_devices"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();