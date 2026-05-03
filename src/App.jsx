import React from "react";
import GlobalStyles from "./components/stripe/GlobalStyles";
import Navbar from "./components/stripe/Navbar";
import MainContent from "./components/stripe/MainContent";
import Footer from "./components/stripe/Footer";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardOverview from "./components/dashboard/pages/DashboardOverview";
import LaunchesPage from "./components/dashboard/pages/LaunchesPage";
import CampaignsPage from "./components/dashboard/pages/CampaignsPage";
import AnalyticsPage from "./components/dashboard/pages/AnalyticsPage";
import HistoryPage from "./components/dashboard/pages/HistoryPage";
import EarlyBuyersPage from "./components/dashboard/pages/EarlyBuyersPage";
import IncentivesPage from "./components/dashboard/pages/IncentivesPage";
import SettingsPage from "./components/dashboard/pages/SettingsPage";
import HelpPage from "./components/dashboard/pages/HelpPage";
import { appClassName } from "./lib/stripeSource";

const dashboardRoutes = {
  "/dashboard": DashboardOverview,
  "/launches": LaunchesPage,
  "/campaigns": CampaignsPage,
  "/analytics": AnalyticsPage,
  "/history": HistoryPage,
  "/campaigns/early-buyers": EarlyBuyersPage,
  "/incentives": IncentivesPage,
  "/settings": SettingsPage,
  "/help": HelpPage,
};

function getPathname() {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}

export default function App() {
  const [pathname, setPathname] = React.useState(getPathname);

  React.useEffect(() => {
    const handleNavigation = () => setPathname(getPathname());

    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  const DashboardPage = dashboardRoutes[pathname];

  if (DashboardPage) {
    return (
      <>
        <GlobalStyles />
        <DashboardLayout pathname={pathname}>
          <DashboardPage />
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className={appClassName}>
        <Navbar />
        <MainContent />
        <Footer />
      </div>
    </>
  );
}
