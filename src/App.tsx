import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Logbook from "./pages/Logbook";
import NewFlight from "./pages/NewFlight";
import SaveFlight from "./pages/SaveFlight";
import Fly from "./pages/Fly";
import Tools from "./pages/Tools";
import Settings from "./pages/Settings";
import E6BFlightComputer from "./pages/E6BFlightComputer";
import PDFViewer from "./pages/PDFViewer";
import ScratchPad from "./pages/ScratchPad";
import Checklists from "./pages/Checklists";
import DataImportExport from "./pages/DataImportExport";
import Reports from "./pages/Reports";
import LicensesRatingsEndorsements from "./pages/LicensesRatingsEndorsements";
import FlightTestsExams from "./pages/FlightTestsExams";
import AircraftMaintenance from "./pages/AircraftMaintenance";
import SyndicateCalendar from "./pages/SyndicateCalendar";
import Budgets from "./pages/Budgets";
import IFRClearances from "./pages/IFRClearances";
import AdminPortal from "./pages/AdminPortal";
import NotFound from "./pages/NotFound";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AboutUs from "./pages/AboutUs";
import AppLayout from "./components/AppLayout";
import AppAccessWrapper from "./components/AppAccessWrapper";
import Header from "./components/Header";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/help-center" element={
              <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 pt-32">
                  <HelpCenter />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/privacy-policy" element={
              <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 pt-32">
                  <PrivacyPolicy />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/terms-of-service" element={
              <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 pt-32">
                  <TermsOfService />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/about-us" element={
              <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 pt-32">
                  <AboutUs />
                </main>
                <Footer />
              </div>
            } />

            {/* Protected App Routes */}
            <Route path="/app/*" element={
              <AppAccessWrapper>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="logbook" element={<Logbook />} />
                    <Route path="new-flight" element={<NewFlight />} />
                    <Route path="save-flight" element={<SaveFlight />} />
                    <Route path="fly" element={<Fly />} />
                    <Route path="tools" element={<Tools />} />
                    <Route path="tools/e6b" element={<E6BFlightComputer />} />
                    <Route path="tools/pdf-viewer" element={<PDFViewer />} />
                    <Route path="tools/scratchpad" element={<ScratchPad />} />
                    <Route path="tools/checklists" element={<Checklists />} />
                    <Route path="tools/data-import-export" element={<DataImportExport />} />
                    <Route path="tools/reports" element={<Reports />} />
                    <Route path="tools/licenses-ratings-endorsements" element={<LicensesRatingsEndorsements />} />
                    <Route path="tools/flight-tests-exams" element={<FlightTestsExams />} />
                    <Route path="tools/aircraft-maintenance" element={<AircraftMaintenance />} />
                    <Route path="tools/syndicate-calendar" element={<SyndicateCalendar />} />
                    <Route path="tools/budgets" element={<Budgets />} />
                    <Route path="tools/ifr-clearances" element={<IFRClearances />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="admin" element={<AdminPortal />} />
                    <Route path="help" element={<HelpCenter />} />
                  </Routes>
                </AppLayout>
              </AppAccessWrapper>
            } />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
