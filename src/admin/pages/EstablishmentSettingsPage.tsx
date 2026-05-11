import { useOutletContext } from "react-router-dom";
import type { EstablishmentDetail } from "../../types";
import { AdminPasswordResetCard } from "../components/AdminPasswordResetCard";
import { AiCreditsCard } from "../components/AiCreditsCard";
import { BrandingCard } from "../components/BrandingCard";
import { EstablishmentStatusToggle } from "../components/EstablishmentStatusToggle";
import { SettingsForm } from "../components/SettingsForm";

type Context = {
  establishment: EstablishmentDetail;
  reload: () => Promise<void>;
  isPlatformAdmin: boolean;
};

export function EstablishmentSettingsPage() {
  const { establishment, reload, isPlatformAdmin } = useOutletContext<Context>();

  return (
    <div className="space-y-5">
      <BrandingCard establishment={establishment} reload={reload} />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <SettingsForm establishment={establishment} reload={reload} />
          <EstablishmentStatusToggle establishment={establishment} reload={reload} />
        </div>
        <div className="space-y-5">
          <AiCreditsCard establishment={establishment} canManage={isPlatformAdmin} reload={reload} />
          {isPlatformAdmin && <AdminPasswordResetCard establishmentId={establishment.id} />}
        </div>
      </div>
    </div>
  );
}
