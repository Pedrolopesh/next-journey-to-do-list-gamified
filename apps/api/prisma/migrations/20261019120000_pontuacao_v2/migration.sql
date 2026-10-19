-- Pontuação v2: EXP por capítulo em tabela (200, 400, 600, 800, 1000) e moedas perdidas ao desmarcar
-- por capítulo (3, 5, 10, 15, 20). Troca os campos da fórmula antiga (levelExpSlope/levelExpOffset).
-- Os demais valores do game_config (EXP e moedas por dificuldade, bônus, capítulos) ficam como estão.
UPDATE "game_config"
SET "value" = ("value"::jsonb - 'levelExpSlope' - 'levelExpOffset')
  || '{"levelExpTable": [200, 400, 600, 800, 1000], "undoCoinPenalty": [3, 5, 10, 15, 20]}'::jsonb
WHERE "key" = 'game';
