import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building, Mail, Calendar, Hash, DollarSign } from 'lucide-react';

interface VariableInserterProps {
  onInsertVariable: (variable: string) => void;
}

export function VariableInserter({ onInsertVariable }: VariableInserterProps) {
  const variables = [
    {
      category: 'Contato',
      icon: User,
      variables: [
        { name: '{{contato_nome}}', description: 'Nome do contato' },
        { name: '{{contato_email}}', description: 'Email do contato' },
        { name: '{{contato_telefone}}', description: 'Telefone do contato' },
        { name: '{{contato_empresa}}', description: 'Empresa do contato' }
      ]
    },
    {
      category: 'Empresa',
      icon: Building,
      variables: [
        { name: '{{empresa_nome}}', description: 'Nome da empresa' },
        { name: '{{empresa_logo}}', description: 'Logo da empresa' },
        { name: '{{empresa_endereco}}', description: 'Endereço da empresa' },
        { name: '{{empresa_telefone}}', description: 'Telefone da empresa' }
      ]
    },
    {
      category: 'Email',
      icon: Mail,
      variables: [
        { name: '{{remetente_nome}}', description: 'Nome do remetente' },
        { name: '{{remetente_email}}', description: 'Email do remetente' },
        { name: '{{assunto}}', description: 'Assunto do email' }
      ]
    },
    {
      category: 'Data/Hora',
      icon: Calendar,
      variables: [
        { name: '{{data_atual}}', description: 'Data atual' },
        { name: '{{hora_atual}}', description: 'Hora atual' },
        { name: '{{data_envio}}', description: 'Data de envio' }
      ]
    },
    {
      category: 'Sistema',
      icon: Hash,
      variables: [
        { name: '{{user_id}}', description: 'ID do usuário' },
        { name: '{{template_id}}', description: 'ID do template' },
        { name: '{{campaign_id}}', description: 'ID da campanha' }
      ]
    },
    {
      category: 'Financeiro',
      icon: DollarSign,
      variables: [
        { name: '{{valor_total}}', description: 'Valor total' },
        { name: '{{moeda}}', description: 'Moeda' },
        { name: '{{desconto}}', description: 'Valor do desconto' }
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Variáveis Disponíveis</CardTitle>
        <CardDescription>
          Clique em uma variável para inseri-la no conteúdo do template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variables.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <div key={categoryIndex} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {category.category}
                </h4>
                <div className="space-y-1">
                  {category.variables.map((variable, variableIndex) => (
                    <Button
                      key={variableIndex}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onInsertVariable(variable.name)}
                      className="w-full justify-start text-xs h-auto p-2"
                      title={variable.description}
                    >
                      <div className="text-left">
                        <div className="font-mono text-blue-600">{variable.name}</div>
                        <div className="text-xs text-gray-500 truncate">{variable.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Como usar:</strong> Clique em uma variável para inseri-la no editor. 
            As variáveis serão substituídas automaticamente pelos valores reais durante o envio.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
