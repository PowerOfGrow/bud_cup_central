import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SkipLink } from "./components/SkipLink";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contests = lazy(() => import("./pages/Contests"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const About = lazy(() => import("./pages/About"));
const Vote = lazy(() => import("./pages/Vote"));
const SubmitEntry = lazy(() => import("./pages/SubmitEntry"));
const JudgeEvaluation = lazy(() => import("./pages/JudgeEvaluation"));
const ManageContestsPage = lazy(() => import("./pages/ManageContests"));
const ManageContestJudges = lazy(() => import("./pages/ManageContestJudges"));
const ManageContestCategories = lazy(() => import("./pages/ManageContestCategories"));
const ContestResults = lazy(() => import("./pages/ContestResults"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Search = lazy(() => import("./pages/Search"));
const Settings = lazy(() => import("./pages/Settings"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));
const MonitorVotesPage = lazy(() => import("./pages/MonitorVotes"));
const MonitorJudgeConflictsPage = lazy(() => import("./pages/MonitorJudgeConflicts"));
const ReviewEntriesPage = lazy(() => import("./pages/ReviewEntries"));
const EntryAuditHistoryPage = lazy(() => import("./pages/EntryAuditHistory"));
const JudgeBiasAnalysisPage = lazy(() => import("./pages/JudgeBiasAnalysis"));
const ModerateCommentsPage = lazy(() => import("./pages/ModerateComments"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AdminPage = lazy(() => import("./pages/Admin"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SkipLink />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contests" element={<Contests />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/vote/:entryId"
            element={
              <ProtectedRoute>
                <Vote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-entry/:contestId?"
            element={<SubmitEntry />}
          />
          <Route
            path="/judge-evaluation/:entryId"
            element={<JudgeEvaluation />}
          />
          <Route
            path="/manage-contests"
            element={<ManageContestsPage />}
          />
          <Route
            path="/manage-contests/:contestId/judges"
            element={<ManageContestJudges />}
          />
          <Route
            path="/manage-contests/:contestId/categories"
            element={<ManageContestCategories />}
          />
          <Route
            path="/contests/:contestId/results"
            element={<ContestResults />}
          />
          <Route
            path="/monitor-votes"
            element={<MonitorVotesPage />}
          />
          <Route
            path="/monitor-judge-conflicts"
            element={<MonitorJudgeConflictsPage />}
          />
          <Route
            path="/review-entries"
            element={<ReviewEntriesPage />}
          />
          <Route
            path="/entries/:entryId/audit-history"
            element={<EntryAuditHistoryPage />}
          />
          <Route
            path="/judge-bias-analysis"
            element={<JudgeBiasAnalysisPage />}
          />
          <Route
            path="/moderate-comments"
            element={<ModerateCommentsPage />}
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<Search />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/disclaimer" element={<Disclaimer />} />
          <Route path="/legal/cookies" element={<Cookies />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="organizer">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
