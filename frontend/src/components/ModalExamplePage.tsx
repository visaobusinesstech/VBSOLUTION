import React from 'react';
import { ExampleAppointmentRequestModal } from './AppointmentRequestModal';

/**
 * Página de exemplo para demonstrar o uso do sistema de modais padronizado
 * Este componente pode ser usado para testar e demonstrar os modais
 */
export function ModalExamplePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Sistema de Modais Padronizado
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Demonstração do novo sistema de modais que segue o design das imagens de referência. 
              Todos os modais agora abrem como drawers à direita com layout, tipografia e animações consistentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Exemplo 1: Modal de Agendamento */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modal de Agendamento</h3>
                  <p className="text-sm text-gray-600">Solicitação de consulta</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Exemplo completo seguindo exatamente o design das imagens de referência, 
                com seções de detalhes pessoais, diagnóstico, informações de agendamento e cronograma.
              </p>
              <ExampleAppointmentRequestModal />
            </div>

            {/* Exemplo 2: Modal de Lead */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modal de Lead</h3>
                  <p className="text-sm text-gray-600">Detalhes do cliente</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Modal migrado para o novo padrão, com informações pessoais, 
                dados comerciais e ações rápidas organizadas em seções.
              </p>
              <div className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded">
                ✅ Já migrado
              </div>
            </div>

            {/* Exemplo 3: Modal de Projeto */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modal de Projeto</h3>
                  <p className="text-sm text-gray-600">Visualização de projeto</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Modal de projeto com informações detalhadas, orçamento, 
                equipe e cronograma organizados em seções claras.
              </p>
              <div className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded">
                ✅ Já migrado
              </div>
            </div>

            {/* Exemplo 4: Modal de Atividade */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modal de Atividade</h3>
                  <p className="text-sm text-gray-600">Detalhes da tarefa</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Modal de atividade com informações do responsável, 
                prazos e status organizados de forma clara e consistente.
              </p>
              <div className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded">
                ✅ Já migrado
              </div>
            </div>

            {/* Exemplo 5: Modal de Grupo */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modal de Grupo</h3>
                  <p className="text-sm text-gray-600">Detalhes da equipe</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Modal de grupo de trabalho com informações dos membros, 
                setor e configurações organizadas em seções.
              </p>
              <div className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded">
                ✅ Já migrado
              </div>
            </div>

            {/* Exemplo 6: Modal de Arquivo */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modal de Arquivo</h3>
                  <p className="text-sm text-gray-600">Visualização de arquivo</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Modal de preview de arquivo com informações detalhadas, 
                ações de download e compartilhamento.
              </p>
              <div className="text-xs text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
                🔄 Em migração
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">✨ Características do Novo Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">🎨 Design Consistente</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Modal drawer à direita (420-500px)</li>
                  <li>• Animação suave slide-in/out</li>
                  <li>• Tipografia padronizada (Inter/DM Sans)</li>
                  <li>• Paleta de cores consistente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔧 Componentes Reutilizáveis</h4>
                <ul className="space-y-1 text-xs">
                  <li>• ModalSection para organização</li>
                  <li>• PersonalDetailSection para dados pessoais</li>
                  <li>• InfoField para campos de informação</li>
                  <li>• TagList para tags e labels</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">⚡ Performance</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Animações otimizadas com framer-motion</li>
                  <li>• Focus trap para acessibilidade</li>
                  <li>• Escape key para fechar</li>
                  <li>• Responsivo em todos os dispositivos</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">📱 Responsividade</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Adapta-se a diferentes telas</li>
                  <li>• Scroll interno no conteúdo</li>
                  <li>• Header e footer fixos</li>
                  <li>• Overlay com blur sutil</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
