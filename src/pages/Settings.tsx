import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PilotDetailsTab from "@/components/settings/PilotDetailsTab";
import AircraftTab from "@/components/settings/AircraftTab";
import CrewTab from "@/components/settings/CrewTab";
import AccountSettingsTab from "@/components/settings/AccountSettingsTab";
import SubscriptionTab from "@/components/settings/SubscriptionTab";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("pilot-details");

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Account Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="pilot-details">Pilot Details</TabsTrigger>
            <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="account-settings">Account Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="pilot-details">
            <PilotDetailsTab />
          </TabsContent>

          <TabsContent value="aircraft">
            <AircraftTab />
          </TabsContent>

          <TabsContent value="crew">
            <CrewTab />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="account-settings">
            <AccountSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Settings;