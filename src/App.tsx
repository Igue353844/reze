import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProfileProvider } from "./contexts/ProfileContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { usePlatform } from "./hooks/usePlatform";
import Index from "./pages/Index";
import IndexMobile from "./pages/IndexMobile";
import Catalog from "./pages/Catalog";
import Watch from "./pages/Watch";
import WatchMobile from "./pages/WatchMobile";
import WatchHistory from "./pages/WatchHistory";
import Embed from "./pages/Embed";
import LiveTV from "./pages/LiveTV";
import LiveTVMobile from "./pages/LiveTVMobile";
import Admin from "./pages/Admin";
import AdminManagement from "./pages/AdminManagement";
import Auth from "./pages/Auth";
import AuthMobile from "./pages/AuthMobile";
import ProfileSelect from "./pages/ProfileSelect";
import ProfileSelectMobile from "./pages/ProfileSelectMobile";
import NotFound from "./pages/NotFound";
import WatchPartyLobby from "./pages/WatchPartyLobby";
import WatchPartyPage from "./pages/WatchParty";
import WatchPartyTest from "./pages/WatchPartyTest";
import Install from "./pages/Install";
import DownloadApp from "./pages/DownloadApp";

const queryClient = new QueryClient();

// Component that handles platform-based routing
const AppRoutes = () => {
  const { isCapacitor, isTV, platform } = usePlatform();
  const isMobileApp = isCapacitor || isTV;

  // Mobile/TV app uses specialized components
  const HomePage = isMobileApp ? IndexMobile : Index;
  const AuthPage = isMobileApp ? AuthMobile : Auth;
  const WatchPage = isMobileApp ? WatchMobile : Watch;
  const LiveTVPage = isMobileApp ? LiveTVMobile : LiveTV;
  const ProfileSelectPage = isMobileApp ? ProfileSelectMobile : ProfileSelect;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/admin" element={<AuthPage />} />
      <Route path="/embed/:slug" element={<Embed />} />
      <Route path="/install" element={<Install />} />
      <Route path="/download" element={<DownloadApp />} />
      <Route path="/party-test" element={<WatchPartyTest />} />
      
      {/* Profile selection - requires login but not profile */}
      <Route path="/profiles" element={
        <ProtectedRoute requireProfile={false}>
          <ProfileSelectPage />
        </ProtectedRoute>
      } />
      
      {/* Protected routes - require login and profile */}
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      <Route path="/catalog" element={
        <ProtectedRoute>
          <Catalog />
        </ProtectedRoute>
      } />
      <Route path="/watch/:slug" element={
        <ProtectedRoute>
          <WatchPage />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <WatchHistory />
        </ProtectedRoute>
      } />
      <Route path="/tv" element={
        <ProtectedRoute>
          <LiveTVPage />
        </ProtectedRoute>
      } />
      <Route path="/tv/:slug" element={
        <ProtectedRoute>
          <LiveTVPage />
        </ProtectedRoute>
      } />
      <Route path="/party" element={
        <ProtectedRoute>
          <WatchPartyLobby />
        </ProtectedRoute>
      } />
      <Route path="/party/:id" element={
        <ProtectedRoute>
          <WatchPartyPage />
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
  );
};

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="streamflix-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProfileProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ProfileProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
