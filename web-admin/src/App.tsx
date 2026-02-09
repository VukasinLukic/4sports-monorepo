import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ClubMembersPage } from './features/club-members/ClubMembersPage';
import { InviteCodesPage } from './features/invites/InviteCodesPage';
import { FinancePage } from './features/finances/FinancePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { NewsPage } from './features/news/NewsPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { EventDetailPage } from './features/calendar/EventDetailPage';
import { ChatPage } from './features/chat/ChatPage';
import { EvidencePage } from './features/evidence/EvidencePage';
import { ProfilePage } from './features/profile/ProfilePage';
import { NotFoundPage } from './features/dashboard/NotFoundPage';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { DevModeBanner } from './components/shared/DevModeBanner';
import { TutorialTooltip } from './components/shared/TutorialTooltip';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <DevModeBanner />
          <TutorialTooltip />
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/club-members"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClubMembersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invites"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InviteCodesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EventDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EvidencePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finances"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FinancePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/member/:memberId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </BrowserRouter>
        </OnboardingProvider>
      </AuthProvider>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
