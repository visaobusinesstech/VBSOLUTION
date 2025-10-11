import React, { useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  ChevronDown, 
  Bot, 
  User,
  X
} from 'lucide-react';
import { useAgentMode } from '@/contexts/AgentModeContext';

interface TopBarControlsProps {
  chatId: string;
  messages: any[];
  scrollRef: React.RefObject<HTMLDivElement>;
  onSearch?: (query: string) => void;
}

export default function TopBarControls({ 
  chatId, 
  messages, 
  scrollRef, 
  onSearch 
}: TopBarControlsProps) {
  const { getAgentMode, setAgentMode } = useAgentMode();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  const currentMode = getAgentMode(chatId);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages.filter(message => 
      message.content?.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
    setCurrentResultIndex(0);
    
    if (onSearch) {
      onSearch(query);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.querySelector(`[data-mid="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Destacar a mensagem temporariamente
      messageElement.classList.add('bg-yellow-100', 'border-yellow-300');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100', 'border-yellow-300');
      }, 2000);
    }
  };

  const nextResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentResultIndex + 1) % searchResults.length;
      setCurrentResultIndex(nextIndex);
      scrollToMessage(searchResults[nextIndex].id);
    }
  };

  const prevResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
      setCurrentResultIndex(prevIndex);
      scrollToMessage(searchResults[prevIndex].id);
    }
  };

  return (
    <>
      {/* Controles da barra superior */}
      <div className="flex items-center space-x-2">
        {/* Botão de busca */}
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Buscar na conversa"
        >
          <Search className="h-4 w-4" />
        </button>
        
        {/* Dropdown de seleção de modo do agente */}
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <div className="flex items-center gap-2">
              {currentMode === 'ai' ? (
                <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center p-0.5">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/11306/11306080.png" 
                    alt="AI" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-gray-300">
                  <User className="w-2 h-2 text-gray-700" />
                </div>
              )}
              <span className="text-xs font-medium">
                {currentMode === 'ai' ? 'AI Agent' : 'Humano'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {/* Menu dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => setAgentMode(chatId, 'human')}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                  currentMode === 'human' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-gray-300">
                  <User className="w-2 h-2 text-gray-700" />
                </div>
                <span>Atendimento Humano</span>
                {currentMode === 'human' && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setAgentMode(chatId, 'ai')}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                  currentMode === 'ai' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center p-0.5">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/11306/11306080.png" 
                    alt="AI" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span>AI Agent</span>
                {currentMode === 'ai' && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Botão de mais opções */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Modal de busca */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Buscar na conversa</h3>
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite sua busca..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
            
            {searchResults.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {searchResults.length} resultado(s) encontrado(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevResult}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      disabled={searchResults.length <= 1}
                    >
                      ↑
                    </button>
                    <span className="text-xs text-gray-500">
                      {currentResultIndex + 1} de {searchResults.length}
                    </span>
                    <button
                      onClick={nextResult}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      disabled={searchResults.length <= 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((message, index) => (
                    <button
                      key={message.id}
                      onClick={() => {
                        setCurrentResultIndex(index);
                        scrollToMessage(message.id);
                        setShowSearch(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 ${
                        index === currentResultIndex ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="text-sm text-gray-900 line-clamp-2">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-4 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum resultado encontrado</p>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Digite algo para buscar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
