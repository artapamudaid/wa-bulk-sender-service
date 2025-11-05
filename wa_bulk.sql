CREATE DATABASE wa_bulk_system;
\c wa_bulk_system;
CREATE TABLE wa_queue (
  id SERIAL PRIMARY KEY,
  apikey VARCHAR(50) NOT NULL,
  sender VARCHAR(20) NOT NULL,
  receiver VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  retries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sender ON wa_queue(sender);
CREATE INDEX idx_status ON wa_queue(status);
