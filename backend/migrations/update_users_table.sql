-- Migration script to update users table structure
-- Changes: address -> purok, city -> municipality, remove province

-- Step 1: Add new columns
ALTER TABLE `users` 
ADD COLUMN `purok` TEXT NOT NULL DEFAULT '' AFTER `gender`,
ADD COLUMN `municipality` VARCHAR(100) NOT NULL DEFAULT '' AFTER `barangay`;

-- Step 2: Migrate existing data
UPDATE `users` SET 
    `purok` = `address`,
    `municipality` = `city`;

-- Step 3: Remove old columns
ALTER TABLE `users` 
DROP COLUMN `address`,
DROP COLUMN `city`, 
DROP COLUMN `province`;

-- Verify the changes
DESCRIBE `users`;
