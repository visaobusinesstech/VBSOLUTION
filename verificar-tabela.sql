-- Execute este SQL para verificar se a tabela files foi criada corretamente

-- Verificar se a tabela existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;

-- Verificar as políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'files';

-- Testar inserção (substitua 'seu-user-id' pelo ID real do usuário)
-- INSERT INTO files (owner_id, name, size, type, file_content) 
-- VALUES ('seu-user-id', 'teste.txt', 100, 'text/plain', 'conteudo de teste');
