-- Histórico de tarefas (GET /v1/items/history): filtra por usuário e tipo e ordena por conclusão.
CREATE INDEX "items_user_id_type_completed_at_idx" ON "items"("user_id", "type", "completed_at");
