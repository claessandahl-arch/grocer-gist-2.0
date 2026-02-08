-- Add parser_metadata column to receipts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'parser_metadata') THEN
        ALTER TABLE receipts ADD COLUMN parser_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index for faster querying of parser metadata
CREATE INDEX IF NOT EXISTS idx_receipts_parser_metadata ON receipts USING gin (parser_metadata);

-- View: Parser Anomalies (Flat list of all anomalies found)
CREATE OR REPLACE VIEW parser_anomalies AS
SELECT
    r.id AS receipt_id,
    r.created_at,
    r.store_name,
    anomaly->>'type' AS anomaly_type,
    anomaly->>'description' AS description,
    anomaly->>'severity' AS severity,
    anomaly->'item' AS affected_item
FROM
    receipts r,
    jsonb_array_elements(r.parser_metadata->'anomalies') AS anomaly
WHERE
    r.parser_metadata->'anomalies' IS NOT NULL
    AND jsonb_array_length(r.parser_metadata->'anomalies') > 0
ORDER BY
    r.created_at DESC;

-- View: Parser Health Metrics (Aggregated stats over time)
CREATE OR REPLACE VIEW parser_health_metrics AS
WITH monthly_stats AS (
    SELECT
        date_trunc('month', created_at) AS month,
        COUNT(*) AS total_receipts,
        COUNT(*) FILTER (WHERE parser_metadata->'anomalies' IS NOT NULL AND jsonb_array_length(parser_metadata->'anomalies') > 0) AS receipts_with_anomalies,
        COALESCE(SUM(jsonb_array_length(parser_metadata->'anomalies')), 0) AS total_anomalies,
        AVG(NULLIF((parser_metadata->>'processingTimeMs'), '')::numeric) AS avg_processing_time_ms
    FROM
        receipts
    GROUP BY
        1
)
SELECT
    month,
    total_receipts,
    receipts_with_anomalies,
    total_anomalies,
    ROUND((1 - (receipts_with_anomalies::numeric / NULLIF(total_receipts, 0)))::numeric * 100, 2) AS health_score,
    ROUND(avg_processing_time_ms, 0) AS avg_processing_time_ms
FROM
    monthly_stats
ORDER BY
    month DESC;

-- View: Anomaly Type Breakdown (Which errors are most common?)
CREATE OR REPLACE VIEW anomaly_type_breakdown AS
SELECT
    anomaly->>'type' AS anomaly_type,
    COUNT(*) AS occurrence_count,
    MAX(r.created_at) AS last_seen
FROM
    receipts r,
    jsonb_array_elements(r.parser_metadata->'anomalies') AS anomaly
WHERE
    r.created_at > (NOW() - INTERVAL '30 days')
GROUP BY
    1
ORDER BY
    2 DESC;

-- Grant permissions (assuming authenticated users need to see this, or at least admin)
GRANT SELECT ON parser_anomalies TO authenticated;
GRANT SELECT ON parser_health_metrics TO authenticated;
GRANT SELECT ON anomaly_type_breakdown TO authenticated;
