-- This query is read-only. Any returned row blocks migration 0001.
SELECT
  payment_id,
  COUNT(*) AS duplicate_count,
  GROUP_CONCAT(id) AS order_ids
FROM orders
WHERE payment_id IS NOT NULL
GROUP BY payment_id
HAVING COUNT(*) > 1
ORDER BY payment_id;

