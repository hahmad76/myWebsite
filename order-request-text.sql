-- SSHP production migration: add the customer's request text to orders.
-- Run this ONCE in phpMyAdmin against the live SSHP database.

ALTER TABLE orders
  ADD COLUMN request_text TEXT NULL AFTER service;
