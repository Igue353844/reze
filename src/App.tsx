import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import Watch from "./pages/Watch";
import WatchHistory from "./pages/WatchHistory";
import Embed from "./pages/Embed";
import LiveTV from "./pages/LiveTV";
import Admin from "./pages/Admin";
import AdminManagement from "./pages/AdminManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="streamflix-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/admin" element={<Auth />} />
            <Route path="/embed/:slug" element={<Embed />} />
            <Route path="/tv" element={<LiveTV />} />
            <Route path="/tv/:slug" element={<LiveTV />} />
            
            {/* Protected routes - require login */}
            <Route path="/catalog" element={
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            } />
            <Route path="/watch/:slug" element={
              <ProtectedRoute>
                <Watch />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <WatchHistory />
              </ProtectedRoute>
            } />
            
            {/* Admin routes - require admin role */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <AdminManagement />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
