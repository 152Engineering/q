import SecurityTab from "./SecurityTab";
import ThemeSettingsTab from "./ThemeSettingsTab";
import AirBudgetIntegration from "./AirBudgetIntegration";

const AccountSettingsTab = () => {
  return (
    <div className="space-y-8">
      <ThemeSettingsTab />
      <AirBudgetIntegration />
      <SecurityTab />
    </div>
  );
};

export default AccountSettingsTab;