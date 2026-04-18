import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Websites from "./pages/Websites";
import Chats from "./pages/Chats";
import DashboardSettings from "./pages/DashboardSettings";
import Demo from "./pages/Demo";
import PublicPage from "./pages/PublicPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/features" element={<PublicPage />} />
            <Route path="/pricing" element={<PublicPage />} />
            <Route path="/docs" element={<PublicPage />} />
            <Route path="/security" element={<PublicPage />} />
            <Route path="/customers" element={<PublicPage />} />
            <Route path="/changelog" element={<PublicPage />} />
            <Route path="/contact" element={<PublicPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/websites"
              element={
                <ProtectedRoute>
                  <Websites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/chats"
              element={
                <ProtectedRoute>
                  <Chats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <DashboardSettings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
