-- VERIFICAÇÃO DIRETA DAS TABELAS
-- Vou executar via curl para API do Supabase Local

-- Para executar via curl:
-- curl -X POST "http://127.0.0.1:54321/rest/v1/rpc/execute_sql" \
--   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
--   -H "Content-Type: application/json" \
--   -d '{"query": "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = '\''public'\'' ORDER BY table_name;"}'
