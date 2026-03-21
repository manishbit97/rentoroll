// This script runs on first MongoDB container startup.
// It creates indexes for the rentoroll database.

db = db.getSiblingDB("rentoroll");

// users: unique email
db.users.createIndex({ email: 1 }, { unique: true, background: true });

// properties: landlord lookup
db.properties.createIndex({ landlord_id: 1 }, { background: true });

// rooms: property lookup
db.rooms.createIndex({ property_id: 1 }, { background: true });

// tenant_assignments: active room assignment + tenant lookup
db.tenant_assignments.createIndex({ room_id: 1, is_active: 1 }, { background: true });
db.tenant_assignments.createIndex({ tenant_id: 1 }, { background: true });

// rent_records: unique per room+month+year; property+period lookup; tenant lookup
db.rent_records.createIndex(
  { room_id: 1, month: 1, year: 1 },
  { unique: true, background: true }
);
db.rent_records.createIndex({ property_id: 1, month: 1, year: 1 }, { background: true });
db.rent_records.createIndex({ tenant_id: 1 }, { background: true });

print("RentoRoll indexes created successfully.");
