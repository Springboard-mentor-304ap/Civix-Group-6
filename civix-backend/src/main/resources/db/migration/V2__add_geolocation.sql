-- V2__add_geolocation.sql
-- Add state, city, latitude, and longitude columns to users table.

ALTER TABLE users
ADD COLUMN state VARCHAR(100),
ADD COLUMN city VARCHAR(100),
ADD COLUMN latitude DECIMAL(10,7),
ADD COLUMN longitude DECIMAL(10,7);
