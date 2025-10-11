-- Verificar se a coluna settings existe na tabela work_groups
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND column_name = 'settings';
