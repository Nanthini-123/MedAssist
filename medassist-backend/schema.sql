-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- VISITORS TABLE
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  age INT,
  created_at TIMESTAMP DEFAULT now()
);

-- OTP TABLE
CREATE TABLE IF NOT EXISTS otps (
  phone TEXT PRIMARY KEY,
  otp_code TEXT,
  expires_at TIMESTAMP,
  send_count_hour INT DEFAULT 0,
  last_sent_at TIMESTAMP
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID REFERENCES visitors(id),
  doctor_id TEXT,
  doctor_name TEXT,
  thirdparty_booking_id TEXT,
  service_type TEXT,
  timeslot TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'booked',   -- booked / completed / cancelled / no_show
  severity TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
  attendance_status TEXT DEFAULT 'PENDING'
);

-- NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID REFERENCES visitors(id),
  operator_id TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT,
  specialty TEXT,
  email TEXT,
  phone TEXT,
  calendly_user_uri TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_email TEXT,
  filename TEXT,
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS LOG TABLE
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID,
  type TEXT,          -- reminder_1hr / followup_missed / summary_monthly
  to_contact TEXT,    -- phone/email
  channel TEXT,       -- sms/email/whatsapp
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_booking_type 
ON notifications_log (booking_id, type);