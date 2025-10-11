import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { ConnectionsProvider } from "@/contexts/ConnectionsContext";
import Login from "./pages/Login";
import WhatsApp from "./pages/WhatsApp";

const queryClient = new QueryClient();

function App() {
  console.log('🚀 Minimal App rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectionsProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/whatsapp" element={<WhatsApp />} />
                <Route path="/" element={<Login />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ConnectionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
