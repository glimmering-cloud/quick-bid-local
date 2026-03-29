import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import RequestDetail from "./pages/RequestDetail";
import BookingConfirmation from "./pages/BookingConfirmation";
import Settings from "./pages/Settings";
import ManagementDashboard from "./pages/ManagementDashboard";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile } = useAuth();

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={user ? <Navigate to={profile?.role === "provider" ? "/provider" : "/dashboard"} replace /> : <Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute>{profile?.role === "provider" ? <Navigate to="/provider" replace /> : <CustomerDashboard />}</ProtectedRoute>} />
        <Route path="/provider" element={<ProtectedRoute>{profile?.role === "customer" ? <Navigate to="/dashboard" replace /> : <ProviderDashboard />}</ProtectedRoute>} />
        <Route path="/request/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
        <Route path="/booking/:requestId" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/management" element={<ProtectedRoute><ManagementDashboard /></ProtectedRoute>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
