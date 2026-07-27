import { useUser } from "@clerk/react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { User, Mail, Phone, MapPin, Shield, Edit, Camera } from "lucide-react";

export default function ClientProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </DashboardLayout>
  );

  const role = user?.publicMetadata?.role as string | undefined;
  const roleLabel: Record<string, string> = {
    admin: "Administrateur", pm: "Chef de projet", project_manager: "Chef de projet",
    agency: "Agence partenaire", partner: "Agence partenaire", client: "Client",
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mon profil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez vos informations personnelles</p>
        </div>

        {/* Avatar + identité */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/30" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                  <User className="w-7 h-7 text-muted-foreground/70" />
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Camera className="w-3 h-3 text-foreground" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">{roleLabel[role ?? "client"] ?? "Client"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Informations personnelles</h3>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Edit className="w-3.5 h-3.5" /> Modifier
            </button>
          </div>

          {[
            { label: "Prénom", value: user?.firstName ?? "—", icon: User },
            { label: "Nom", value: user?.lastName ?? "—", icon: User },
            { label: "Email", value: user?.emailAddresses[0]?.emailAddress ?? "—", icon: Mail },
            { label: "Téléphone", value: "Non renseigné", icon: Phone },
            { label: "Ville", value: "Non renseigné", icon: MapPin },
          ].map(field => (
            <div key={field.label} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                <field.icon className="w-3.5 h-3.5 text-muted-foreground/70" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{field.label}</p>
                <p className="text-sm text-foreground mt-0.5">{field.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Préférences notifications */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Préférences de notification</h3>
          {[
            { label: "Nouveaux messages", sublabel: "Chat projet", enabled: true },
            { label: "Nouvelles livraisons", sublabel: "Fichiers et livrables", enabled: true },
            { label: "Devis et factures", sublabel: "Documents financiers", enabled: true },
            { label: "Notifications push", sublabel: "Sur votre navigateur", enabled: false },
          ].map(pref => (
            <div key={pref.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{pref.label}</p>
                <p className="text-xs text-muted-foreground/70">{pref.sublabel}</p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${pref.enabled ? "bg-primary" : "bg-secondary"} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${pref.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
