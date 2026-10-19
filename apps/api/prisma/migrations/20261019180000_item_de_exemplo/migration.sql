-- Itens de exemplo (criados pelo app para quem ainda não tem itens) não contam como criação do
-- usuário nas conquistas (criar o primeiro diário, tarefa ou hábito, itens criados e itens ativos).
ALTER TABLE "items" ADD COLUMN "is_example" BOOLEAN NOT NULL DEFAULT false;
