import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { HelpWidget } from '@/components/layout/HelpWidget';

import { LandingPage } from '@/pages/marketing/Landing';
import { PricingPage } from '@/pages/marketing/Pricing';
import { AboutPage } from '@/pages/marketing/About';
import { CareersPage } from '@/pages/marketing/Careers';
import { ContactPage } from '@/pages/marketing/Contact';
import { CompanyPublicPage } from '@/pages/marketing/CompanyPublic';
import { LoginPage } from '@/pages/auth/Login';
import { RegisterPage } from '@/pages/auth/Register';
import { OAuthCompletePage } from '@/pages/auth/OAuthComplete';
import { AccountSettingsPage } from '@/pages/settings/AccountSettings';

import { JobFeedPage } from '@/pages/candidate/JobFeed';
import { JobDetailPage } from '@/pages/candidate/JobDetail';
import { CandidateDashboard } from '@/pages/candidate/CandidateDashboard';

import { RecruiterDashboard } from '@/pages/recruiter/RecruiterDashboard';
import { PostJobPage } from '@/pages/recruiter/PostJob';
import { JobApplicantsPage } from '@/pages/recruiter/JobApplicants';
import { BillingPage } from '@/pages/recruiter/Billing';
import { TeamPage } from '@/pages/recruiter/Team';
import { AcceptInvitePage } from '@/pages/recruiter/AcceptInvite';
import { TalentPoolPage } from '@/pages/recruiter/TalentPool';
import { CompanyProfilePage } from '@/pages/recruiter/CompanyProfile';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/companies/:slug" element={<CompanyPublicPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/complete" element={<OAuthCompletePage />} />

          <Route path="/jobs" element={<JobFeedPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />

          <Route path="/candidate" element={<ProtectedRoute roles={['candidate']}><CandidateDashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute roles={['recruiter']}><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/post-job" element={<ProtectedRoute roles={['recruiter']}><PostJobPage /></ProtectedRoute>} />
          <Route path="/dashboard/jobs/:jobId/applicants" element={<ProtectedRoute roles={['recruiter']}><JobApplicantsPage /></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<ProtectedRoute roles={['recruiter']}><BillingPage /></ProtectedRoute>} />
          <Route path="/dashboard/team" element={<ProtectedRoute roles={['recruiter']}><TeamPage /></ProtectedRoute>} />
          <Route path="/dashboard/team/accept/:token" element={<ProtectedRoute><AcceptInvitePage /></ProtectedRoute>} />
          <Route path="/dashboard/talent-pool" element={<ProtectedRoute roles={['recruiter']}><TalentPoolPage /></ProtectedRoute>} />
          <Route path="/dashboard/company-profile" element={<ProtectedRoute roles={['recruiter']}><CompanyProfilePage /></ProtectedRoute>} />

          <Route path="*" element={<div className="mx-auto max-w-2xl px-6 py-24 text-center"><h1 className="font-serif text-3xl">Page not found</h1></div>} />
        </Routes>
      </main>
      <Footer />
      <HelpWidget />
    </div>
  );
}
