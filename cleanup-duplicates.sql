-- Cleanup duplicate favorites (keep the oldest one for each user_id + movie_id combination)
-- Run this in Supabase SQL Editor

-- First, let's see how many duplicates we have
SELECT 
  user_id, 
  movie_id, 
  COUNT(*) as duplicate_count
FROM favorites
GROUP BY user_id, movie_id
HAVING COUNT(*) > 1;

-- Delete duplicates, keeping only the oldest entry (lowest id or earliest created_at)
DELETE FROM favorites
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, movie_id 
             ORDER BY created_at ASC, id ASC
           ) as row_num
    FROM favorites
  ) t
  WHERE row_num > 1
);

-- Verify no duplicates remain
SELECT 
  user_id, 
  movie_id, 
  COUNT(*) as count
FROM favorites
GROUP BY user_id, movie_id
HAVING COUNT(*) > 1;
-- Should return 0 rows


