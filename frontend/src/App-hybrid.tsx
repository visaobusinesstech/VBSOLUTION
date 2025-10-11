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
import WhatsApp from "./pages/WhatsApp";
import { usePageTitle } from "./hooks/usePageTitle";

const queryClient = new QueryClient();

// Componente para gerenciar títulos das páginas
function PageTitleManager() {
  usePageTitle();
  return null;
}

function App() {
  console.log('🚀 Hybrid App rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
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
                          <Route path="whatsapp" element={<WhatsApp />} />
                        </Route>
                      </Routes>
                    </BrowserRouter>
                    </TooltipProvider>
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
