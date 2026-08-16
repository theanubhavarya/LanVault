USE lanvault;
ALTER TABLE files ADD COLUMN mode VARCHAR(20) DEFAULT 'offline';