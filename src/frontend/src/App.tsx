import { AdminPinModal } from "@/components/AdminPinModal";
import { BottomNav } from "@/components/BottomNav";
import { Layout } from "@/components/Layout";
import { useVerifyAdminPin } from "@/hooks/useAdminData";
import { GeolocationProvider } from "@/hooks/useGeolocationContext";
import { AccountPage } from "@/pages/AccountPage";
import { AdminPage } from "@/pages/AdminPage";
import { DansalsPage } from "@/pages/DansalsPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { GalleryPage } from "@/pages/GalleryPage";
import { HomePage } from "@/pages/HomePage";
import { OrganizerProfilePage } from "@/pages/OrganizerProfilePage";
import type { TabId } from "@/types";
import { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedOrganizerPrincipal, setSelectedOrganizerPrincipal] = useState<
    string | null
  >(null);
  const verifyPin = useVerifyAdminPin();

  function handleAdminPinVerified() {
    setShowPinModal(false);
    setActiveTab("admin");
  }

  function handleNavigateOrganizerProfile(principal: string) {
    setSelectedOrganizerPrincipal(principal);
    setActiveTab("organizer-profile");
  }

  return (
    <GeolocationProvider>
      <div className="relative">
        <Layout>
          {activeTab === "home" && <HomePage onNavigate={setActiveTab} />}
          {activeTab === "dansals" && (
            <DansalsPage
              onViewOrganizerProfile={handleNavigateOrganizerProfile}
            />
          )}
          {activeTab === "gallery" && <GalleryPage />}
          {activeTab === "favorites" && <FavoritesPage />}
          {activeTab === "account" && (
            <AccountPage onRequestAdminPin={() => setShowPinModal(true)} />
          )}
          {activeTab === "admin" && (
            <AdminPage onBack={() => setActiveTab("account")} />
          )}
          {activeTab === "organizer-profile" && selectedOrganizerPrincipal && (
            <OrganizerProfilePage
              organizerPrincipal={selectedOrganizerPrincipal}
              onBack={() => setActiveTab("dansals")}
            />
          )}
        </Layout>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        {showPinModal && (
          <AdminPinModal
            onVerified={handleAdminPinVerified}
            onClose={() => setShowPinModal(false)}
            verifyPin={async (pin) => verifyPin.mutateAsync(pin)}
          />
        )}
      </div>
    </GeolocationProvider>
  );
}
