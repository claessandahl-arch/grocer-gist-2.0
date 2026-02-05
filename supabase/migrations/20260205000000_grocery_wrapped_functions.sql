-- Grocery Wrapped: RPC functions for year-in-review statistics
-- Created: 2026-02-05

-- Function 1: Get Wrapped Overview
-- Returns: Total spending, receipt count, unique products, stores visited
CREATE OR REPLACE FUNCTION get_wrapped_overview(year_param INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Calculate year boundaries
  start_date := (year_param || '-01-01')::DATE;
  end_date := (year_param || '-12-31')::DATE;

  -- Aggregate statistics
  SELECT json_build_object(
    'total_spending', COALESCE(SUM(total_amount), 0),
    'receipt_count', COUNT(DISTINCT id),
    'unique_products', (
      SELECT COUNT(DISTINCT jsonb_array_elements(items)->>'name')
      FROM receipts
      WHERE user_id = auth.uid()
        AND receipt_date >= start_date
        AND receipt_date <= end_date
        AND items IS NOT NULL
    ),
    'stores_visited', COUNT(DISTINCT store_name),
    'avg_per_receipt', COALESCE(AVG(total_amount), 0),
    'first_receipt_date', MIN(receipt_date),
    'last_receipt_date', MAX(receipt_date)
  )
  INTO result
  FROM receipts
  WHERE user_id = auth.uid()
    AND receipt_date >= start_date
    AND receipt_date <= end_date;

  RETURN result;
END;
$$;

-- Function 2: Get Wrapped Products
-- Returns: Top products by quantity and spending, category breakdown
CREATE OR REPLACE FUNCTION get_wrapped_products(year_param INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := (year_param || '-01-01')::DATE;
  end_date := (year_param || '-12-31')::DATE;

  WITH product_stats AS (
    SELECT
      item->>'name' AS product_name,
      SUM((item->>'quantity')::NUMERIC) AS total_quantity,
      SUM((item->>'price')::NUMERIC) AS total_spent,
      COUNT(*) AS purchase_count,
      COALESCE(item->>'category', 'other') AS category
    FROM receipts r,
      jsonb_array_elements(r.items) AS item
    WHERE r.user_id = auth.uid()
      AND r.receipt_date >= start_date
      AND r.receipt_date <= end_date
      AND r.items IS NOT NULL
    GROUP BY item->>'name', item->>'category'
  ),
  category_stats AS (
    SELECT
      category,
      SUM(total_spent) AS category_total,
      COUNT(DISTINCT product_name) AS product_count
    FROM product_stats
    GROUP BY category
    ORDER BY category_total DESC
  )
  SELECT json_build_object(
    'top_by_quantity', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT product_name, total_quantity, purchase_count
        FROM product_stats
        ORDER BY total_quantity DESC
        LIMIT 10
      ) t
    ),
    'top_by_spending', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT product_name, total_spent, purchase_count
        FROM product_stats
        ORDER BY total_spent DESC
        LIMIT 10
      ) t
    ),
    'category_breakdown', (
      SELECT json_agg(row_to_json(t))
      FROM category_stats t
    ),
    'unique_products_count', (
      SELECT COUNT(DISTINCT product_name) FROM product_stats
    )
  )
  INTO result;

  RETURN result;
END;
$$;

-- Function 3: Get Wrapped Patterns
-- Returns: Shopping frequency, peak week, favorite day, store loyalty
CREATE OR REPLACE FUNCTION get_wrapped_patterns(year_param INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := (year_param || '-01-01')::DATE;
  end_date := (year_param || '-12-31')::DATE;

  WITH weekly_stats AS (
    SELECT
      DATE_TRUNC('week', receipt_date) AS week_start,
      SUM(total_amount) AS week_total,
      COUNT(*) AS week_count
    FROM receipts
    WHERE user_id = auth.uid()
      AND receipt_date >= start_date
      AND receipt_date <= end_date
    GROUP BY DATE_TRUNC('week', receipt_date)
  ),
  day_stats AS (
    SELECT
      EXTRACT(DOW FROM receipt_date) AS day_of_week,
      COUNT(*) AS visit_count
    FROM receipts
    WHERE user_id = auth.uid()
      AND receipt_date >= start_date
      AND receipt_date <= end_date
    GROUP BY EXTRACT(DOW FROM receipt_date)
    ORDER BY visit_count DESC
    LIMIT 1
  ),
  store_stats AS (
    SELECT
      store_name,
      COUNT(*) AS visit_count,
      SUM(total_amount) AS store_total
    FROM receipts
    WHERE user_id = auth.uid()
      AND receipt_date >= start_date
      AND receipt_date <= end_date
      AND store_name IS NOT NULL
    GROUP BY store_name
  ),
  home_store AS (
    SELECT store_name, visit_count
    FROM store_stats
    ORDER BY visit_count DESC
    LIMIT 1
  )
  SELECT json_build_object(
    'shopping_frequency', (
      SELECT COUNT(*) / 12.0
      FROM receipts
      WHERE user_id = auth.uid()
        AND receipt_date >= start_date
        AND receipt_date <= end_date
    ),
    'peak_week', (
      SELECT json_build_object(
        'week_start', week_start,
        'total_spent', week_total,
        'receipt_count', week_count
      )
      FROM weekly_stats
      ORDER BY week_total DESC
      LIMIT 1
    ),
    'favorite_day', (
      SELECT day_of_week FROM day_stats
    ),
    'home_store', (
      SELECT json_build_object(
        'store_name', store_name,
        'visit_count', visit_count
      )
      FROM home_store
    ),
    'store_loyalty_percent', (
      SELECT CASE
        WHEN total_visits = 0 THEN 0
        ELSE (home_visits::NUMERIC / total_visits::NUMERIC * 100)
      END
      FROM (
        SELECT
          (SELECT visit_count FROM home_store) AS home_visits,
          (SELECT COUNT(*) FROM receipts WHERE user_id = auth.uid() AND receipt_date >= start_date AND receipt_date <= end_date) AS total_visits
      ) loyalty
    ),
    'stores_visited_count', (
      SELECT COUNT(DISTINCT store_name)
      FROM receipts
      WHERE user_id = auth.uid()
        AND receipt_date >= start_date
        AND receipt_date <= end_date
        AND store_name IS NOT NULL
    )
  )
  INTO result;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_wrapped_overview(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_wrapped_products(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_wrapped_patterns(INTEGER) TO authenticated;
