
import { useState } from 'react';
import { Plus, FileText, Download, Eye, Edit3, Trash2, Filter, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

// Mock data para documentos
const documents = [
  {
    id: 1,
    name: "Contrato Cliente ABC",
    type: "PDF",
    size: "2.5 MB",
    author: { name: "João Silva", initials: "JS" },
    lastModified: "2024-01-15",
    category: "Contratos",
    status: "Finalizado",
    description: "Contrato de prestação de serviços"
  },
  {
    id: 2,
    name: "Proposta Comercial 2024",
    type: "DOCX",
    size: "1.8 MB",
    author: { name: "Maria Santos", initials: "MS" },
    lastModified: "2024-01-10",
    category: "Propostas",
    status: "Em Revisão",
    description: "Proposta comercial para o próximo trimestre"
  },
  {
    id: 3,
    name: "Manual de Procedimentos",
    type: "PDF",
    size: "5.2 MB",
    author: { name: "Carlos Lima", initials: "CL" },
    lastModified: "2024-01-05",
    category: "Manuais",
    status: "Aprovado",
    description: "Manual interno de procedimentos"
  }
];

const Documents = () => {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Finalizado":
        return "bg-green-100 text-green-800";
      case "Em Revisão":
        return "bg-yellow-100 text-yellow-800";
      case "Aprovado":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="w-8 h-8 text-blue-600" />;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "contratos") return matchesSearch && doc.category === "Contratos";
    if (activeTab === "propostas") return matchesSearch && doc.category === "Propostas";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
            <p className="text-gray-600 mt-2">
              Gerencie todos os documentos da empresa de forma centralizada
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Documento
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Documentos</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Edit3 className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Em Revisão</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter(d => d.status === "Em Revisão").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter(d => d.status === "Aprovado").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Finalizados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter(d => d.status === "Finalizado").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Tabs and Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todos">Todos os Documentos</TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="propostas">Propostas</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(document.type)}
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {document.name}
                          </CardTitle>
                          <CardDescription className="text-gray-600">
                            {document.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                      <Badge variant="outline">
                        {document.category}
                      </Badge>
                      <Badge variant="secondary">
                        {document.type}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Document Info */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tamanho:</span>
                        <span className="text-sm font-medium">{document.size}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Autor:</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                              {document.author.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{document.author.name}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Modificado:</span>
                        <span className="text-sm font-medium">
                          {new Date(document.lastModified).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum documento encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Não há documentos nesta categoria no momento.
                </p>
                <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Novo Documento
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Documents;
