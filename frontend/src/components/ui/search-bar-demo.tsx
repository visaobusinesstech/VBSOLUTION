// Demo do componente SearchBar

import { SearchBar } from "@/components/ui/search-bar"

export function SearchBarDemo() {
  const handleSearch = (query: string) => {
    console.log("Pesquisa realizada:", query)
    // Aqui você pode implementar a lógica de busca
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="space-y-8 w-full max-w-md">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SearchBar Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Componente de busca interativo com animações
          </p>
        </div>
        
        <SearchBar 
          placeholder="Digite para pesquisar..." 
          onSearch={handleSearch}
        />
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>✨ Funcionalidades:</p>
          <ul className="mt-2 space-y-1">
            <li>• Animações suaves com Framer Motion</li>
            <li>• Sugestões automáticas</li>
            <li>• Efeitos visuais interativos</li>
            <li>• Responsivo e acessível</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
