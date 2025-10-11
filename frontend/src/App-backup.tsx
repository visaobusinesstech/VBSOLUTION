import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { VBProvider } from "@/contexts/VBContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import { WorkGroupProvider } from "@/contexts/WorkGroupContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConnectionsProvider } from "@/contexts/ConnectionsContext";
import Layout from "./Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import Calendar from "./pages/Calendar";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Employees from "./pages/Employees";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Inventory from "./pages/Inventory";
import Writeoffs from "./pages/Writeoffs";
import SalesOrders from "./pages/SalesOrders";
import SalesFunnel from "./pages/SalesFunnel";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import WorkGroups from "./pages/WorkGroups";
import Files from "./pages/Files";
import Reports from "./pages/Reports";
import WhatsApp from "./pages/WhatsApp";
import WhatsAppConversations from "./pages/WhatsAppConversations";
import Chat from "./pages/Chat";
import Collaborations from "./pages/Collaborations";
import Settings from "./pages/Settings";
import Feed from "./pages/Feed";
import LeadsAndSales from "./pages/LeadsAndSales";
import LeadsSales from "./pages/LeadsSales";
import ReportsDashboard from "./pages/ReportsDashboard";
import NotFound from "./pages/NotFound";
import { usePageTitle } from "./hooks/usePageTitle";

const queryClient = new QueryClient();

// Componente para gerenciar títulos das páginas
function PageTitleManager() {
  usePageTitle();
  return null;
}

function App() {
  console.log('🚀 App component rendering...');
  
  // Debug: verificar se os contextos estão funcionando
  try {
    console.log('🔍 Testing context providers...');
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Erro no Sistema</h1>
        <p>Ocorreu um erro ao carregar o sistema. Verifique o console para mais detalhes.</p>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {error?.toString()}
        </pre>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <VBProvider>
              <ProjectProvider>
                <WorkGroupProvider>
                  <ConnectionsProvider>
                    <TooltipProvider>
                    <Toaster />
                    <BrowserRouter>
                      <PageTitleManager />
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Layout />
                          </ProtectedRoute>
                        }>
                          <Route index element={<Index />} />
                          <Route path="feed" element={<Feed />} />
                          <Route path="activities" element={<Activities />} />
                          <Route path="activities/:id" element={<ActivityDetail />} />
                          <Route path="calendar" element={<Calendar />} />
                          <Route path="companies" element={<Companies />} />
                          <Route path="companies/:id" element={<CompanyDetail />} />
                          <Route path="employees" element={<Employees />} />
                          <Route path="employees/:id" element={<Employees />} />
                          <Route path="products" element={<Products />} />
                          <Route path="suppliers" element={<Suppliers />} />
                          <Route path="inventory" element={<Inventory />} />
                          <Route path="writeoffs" element={<Writeoffs />} />
                          <Route path="sales-orders" element={<SalesOrders />} />
                          <Route path="sales-funnel" element={<SalesFunnel />} />
                          <Route path="projects" element={<Projects />} />
                          <Route path="projects/:id" element={<ProjectDetail />} />
                          <Route path="work-groups" element={<WorkGroups />} />
                          <Route path="files" element={<Files />} />
                          <Route path="reports" element={<Reports />} />
                          <Route path="whatsapp" element={<WhatsApp />} />
                          <Route path="whatsapp/conversations" element={<WhatsAppConversations />} />
                          <Route path="chat" element={<Chat />} />
                          <Route path="collaborations" element={<Collaborations />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="leads-and-sales" element={<LeadsAndSales />} />
                          <Route path="leads-sales" element={<LeadsSales />} />
                          <Route path="reports-dashboard" element={<ReportsDashboard />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </BrowserRouter>
                    </TooltipProvider>
                  </ConnectionsProvider>
                </WorkGroupProvider>
              </ProjectProvider>
            </VBProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
