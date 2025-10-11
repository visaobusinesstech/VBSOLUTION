import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { VBProvider } from "@/contexts/VBContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import { WorkGroupProvider } from "@/contexts/WorkGroupContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConnectionsProvider } from "@/contexts/ConnectionsContext";
import { ConnectionsModalProvider } from "@/components/ConnectionsModalProvider";
import { AgentModeProvider } from "@/contexts/AgentModeContext";
import Layout from "./Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import Calendar from "./pages/Calendar";
import Contacts from "./pages/Contacts";
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
import Email from "./pages/Email";
import AIAgent from "./pages/AIAgent";
import TestAIAgent from "./pages/TestAIAgent";
import TestPage from "./pages/TestPage";
import TestPage2 from "./pages/TestPage2";
import Chat from "./pages/Chat";
import SmartAIDemo from "./pages/SmartAIDemo";
import Collaborations from "./pages/Collaborations";
import Settings from "./pages/Settings";
import Automations from "./pages/Automations";
import Feed from "./pages/Feed";
import LeadsSales from "./pages/LeadsSales";
import ReportsDashboard from "./pages/ReportsDashboard";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import { AudioRecorderTest } from "./components/AudioRecorderTest";
import { usePageTitle } from "./hooks/usePageTitle";
import BootHealth from "./components/BootHealth";

const queryClient = new QueryClient();

// Componente para gerenciar títulos das páginas
function PageTitleManager() {
  usePageTitle();
  return null;
}

function App() {
  // Debug logs removidos para console silencioso
  
  // Debug: verificar se os contextos estão funcionando
  try {
    // Context providers test removed for quiet console
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
      <AuthProvider>
        <ThemeProvider>
          <UserProvider>
            <VBProvider>
              <ProjectProvider>
                <WorkGroupProvider>
                  <ConnectionsProvider>
                    <ConnectionsModalProvider>
                      <AgentModeProvider>
                        <TooltipProvider>
                          <Toaster />
                          {import.meta.env.DEV && <BootHealth />}
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
                          <Route path="contacts" element={<Contacts />} />
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
                          <Route path="email" element={<Email />} />
                          <Route path="ai-agent" element={<AIAgent />} />
                          <Route path="automations" element={<Automations />} />
                          <Route path="automations/new" element={<Automations />} />
                          <Route path="automations/:id" element={<Automations />} />
                          <Route path="test-ai-agent" element={<TestAIAgent />} />
                          <Route path="chat" element={<Chat />} />
                          <Route path="collaborations" element={<Collaborations />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="leads-sales" element={<LeadsSales />} />
                          <Route path="reports-dashboard" element={<ReportsDashboard />} />
                          <Route path="search" element={<Search />} />
                          <Route path="audio-test" element={<AudioRecorderTest />} />
                          <Route path="smart-ai-demo" element={<SmartAIDemo />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                            </Routes>
                          </BrowserRouter>
                        </TooltipProvider>
                      </AgentModeProvider>
                    </ConnectionsModalProvider>
                  </ConnectionsProvider>
                </WorkGroupProvider>
              </ProjectProvider>
            </VBProvider>
          </UserProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
