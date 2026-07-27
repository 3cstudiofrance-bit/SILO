import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { frFR } from "@clerk/localizations";
import { dark } from "@clerk/themes";
import { useEffect, useRef } from "react";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SiloLogo } from "@/components/SiloLogo";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Portfolio from "@/pages/Portfolio";
// Client
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Quotes from "@/pages/Quotes";
import QuoteDetail from "@/pages/QuoteDetail";
import ClientMessages from "@/pages/client/ClientMessages";
import ClientFiles from "@/pages/client/ClientFiles";
import ClientNotifications from "@/pages/client/ClientNotifications";
import ClientProfile from "@/pages/client/ClientProfile";
import ClientRequests from "@/pages/client/ClientRequests";
import ClientSubscriptions from "@/pages/client/ClientSubscriptions";
import ClientTransactions from "@/pages/client/ClientTransactions";
import ClientDeliverables from "@/pages/client/ClientDeliverables";
import ClientValidations from "@/pages/client/ClientValidations";
import ClientReviews from "@/pages/client/ClientReviews";
// PM
import PMDashboard from "@/pages/pm/PMDashboard";
import PMOrders from "@/pages/pm/PMOrders";
import PMTreatmentCenter from "@/pages/pm/PMTreatmentCenter";
import PMPlanning from "@/pages/pm/PMPlanning";
import PMClientChat from "@/pages/pm/PMClientChat";
import PMAgencyChat from "@/pages/pm/PMAgencyChat";
import PMDeliverables from "@/pages/pm/PMDeliverables";
import PMFeed from "@/pages/pm/PMFeed";
import PMAttribution from "@/pages/pm/PMAttribution";
import PMPartnerApplications from "@/pages/pm/PMPartnerApplications";
// Agency / Partner
import PartnerDashboard from "@/pages/partner/PartnerDashboard";
import PartnerMissions from "@/pages/partner/PartnerMissions";
import AgencyUpload from "@/pages/agency/AgencyUpload";
import AgencyMessages from "@/pages/agency/AgencyMessages";
import PartnerFeed from "@/pages/partner/PartnerFeed";
import PartnerBrief from "@/pages/partner/PartnerBrief";
import PartnerFiles from "@/pages/partner/PartnerFiles";
import PartnerCorrections from "@/pages/partner/PartnerCorrections";
import PartnerFinance from "@/pages/partner/PartnerFinance";
import PartnerScore from "@/pages/partner/PartnerScore";
// Admin
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminProjectDetail from "@/pages/admin/AdminProjectDetail";
import AdminQuotes from "@/pages/admin/AdminQuotes";
import AgencyList from "@/pages/admin/AgencyList";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCommunication from "@/pages/admin/AdminCommunication";
import AdminPermissions from "@/pages/admin/AdminPermissions";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminPMs from "@/pages/admin/AdminPMs";
import AdminStats from "@/pages/admin/AdminStats";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminFinance from "@/pages/admin/AdminFinance";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

/*
 * Clerk appearance — baseTheme dark pour les valeurs par défaut sombres,
 * variables pour les couleurs SILO, elements pour les surcharges ciblées.
 * Les éléments d'en-tête (headerTitle, headerSubtitle) reçoivent une surcharge
 * explicite !opacity-100 car Clerk dark applique une opacité interne (~0.7).
 */
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    /* Couleurs SILO */
    colorPrimary: "#2563EB",                  /* bouton principal bleu */
    colorBackground: "#182848",               /* fond carte — nettement plus clair que la page #0A1428 */
    colorInputBackground: "#0F1C38",          /* inputs — légèrement plus sombre que la carte */
    colorText: "#EFF4FF",                     /* texte principal quasi-blanc */
    colorTextOnPrimaryBackground: "#FFFFFF",  /* texte sur bouton bleu */
    colorTextSecondary: "#B8CADF",            /* texte secondaire / labels (≥4.5:1 sur #182848) */
    colorInputText: "#EFF4FF",                /* texte dans les champs */
    colorNeutral: "#6E8AB0",                  /* séparateurs, bordures neutres */
    colorDanger: "#F87171",
    colorSuccess: "#34D399",
    colorShimmer: "#1E3564",
    /* Typographie */
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    card: "!border !border-white/10 !shadow-2xl !shadow-black/50",
    /* En-têtes : opacité forcée à 100 % + couleur explicite */
    headerTitle: "!text-white !opacity-100",
    headerSubtitle: "!text-slate-300 !opacity-100",
    /* Bouton social (Google) : texte blanc opaque */
    socialButtonsBlockButtonText: "!text-white !opacity-100",
    socialButtonsBlockButtonArrow: "!text-white/60",
    /* Footer : texte secondaire + lien jaune SILO */
    footerActionText: "!text-slate-300 !opacity-100",
    footerActionLink: "!text-[#F2C21B] hover:!text-[#FFD84D] !opacity-100",
    /* Séparateur */
    dividerText: "!text-slate-500 !opacity-100",
    /* UserButton popover */
    userButtonPopoverCard: "!bg-[#182848] !border !border-white/10 !shadow-2xl",
    userButtonPopoverActionButton: "!text-[#EFF4FF] hover:!bg-white/8",
    userButtonPopoverActionButtonText: "!text-[#EFF4FF]",
    userButtonPopoverActionButtonIcon: "!text-[#94A3B8]",
    userButtonPopoverFooter: "!border-t !border-white/10",
    userPreviewMainIdentifier: "!text-[#EFF4FF] !font-semibold",
    userPreviewSecondaryIdentifier: "!text-[#94A3B8]",
    userButtonTrigger: "focus:shadow-none",
  },
};

/*
 * Localisation : frFR complet comme base, surcharge uniquement les titres SILO.
 * Tous les labels (boutons, champs, placeholders, erreurs) sont désormais en français.
 */
const clerkLocalization = {
  ...frFR,
  signIn: {
    ...frFR.signIn,
    start: {
      ...(frFR.signIn as Record<string, unknown>)?.start as Record<string, unknown>,
      title: "Connexion à Silo",
      subtitle: "Connectez-vous pour accéder à votre espace sécurisé",
    },
  },
  signUp: {
    ...frFR.signUp,
    start: {
      ...(frFR.signUp as Record<string, unknown>)?.start as Record<string, unknown>,
      title: "Créer votre compte Silo",
      subtitle: "Rejoignez la plateforme de mise en relation audiovisuelle",
    },
  },
};

function AuthShell({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0A1428] px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#F2C21B]" />
            <span className="text-xs font-medium tracking-[0.3em] text-[#A9B4CC] uppercase">{kicker}</span>
          </div>
          <div className="flex items-center justify-center">
            <SiloLogo size="lg" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthShell kicker="Plateforme audiovisuelle">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthShell>
  );
}

function SignUpPage() {
  return (
    <AuthShell kicker="Créer un compte client">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthShell>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function RoleRedirect() {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  const role = user?.publicMetadata?.role as string | undefined;
  if (role === "admin") return <Redirect to="/admin" />;
  if (role === "project_manager" || role === "pm") return <Redirect to="/pm" />;
  if (role === "agency" || role === "partner") return <Redirect to="/partner" />;
  return <Redirect to="/dashboard" />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <SiloLogo size="lg" className="animate-pulse" />
      <div className="text-muted-foreground text-sm animate-pulse">Chargement…</div>
    </div>
  );
}

/**
 * ClientRoute — Espace client uniquement.
 * Rôle "client" OU aucun rôle (nouveau compte en attente d'assignation).
 * Tout autre rôle est redirigé vers son propre espace via /accueil.
 */
function ClientRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "client" && role !== "admin") return <Redirect to="/accueil" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  const isAdmin = user?.publicMetadata?.role === "admin";
  if (!isAdmin) return <Redirect to="/accueil" />;
  return <Component />;
}

function PartnerRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  const role = user?.publicMetadata?.role as string | undefined;
  if (role !== "partner" && role !== "agency" && role !== "admin") return <Redirect to="/accueil" />;
  return <Component />;
}

function PMRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  const role = user?.publicMetadata?.role as string | undefined;
  if (role !== "pm" && role !== "project_manager" && role !== "admin") return <Redirect to="/accueil" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/realisations"><Redirect to="/portfolio" /></Route>
      <Route path="/services"><Redirect to="/" /></Route>
      <Route path="/tarifs"><Redirect to="/" /></Route>
      <Route path="/contact"><Redirect to="/" /></Route>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* Redirect post-auth selon rôle */}
      <Route path="/accueil">
        <RoleRedirect />
      </Route>

      {/* ── ESPACE CLIENT — ClientRoute vérifie role === "client" ── */}
      <Route path="/dashboard"><ClientRoute component={Dashboard} /></Route>
      <Route path="/dashboard/projets"><ClientRoute component={Projects} /></Route>
      <Route path="/dashboard/projets/:id"><ClientRoute component={ProjectDetail} /></Route>
      <Route path="/dashboard/devis"><ClientRoute component={Quotes} /></Route>
      <Route path="/dashboard/devis/:id"><ClientRoute component={QuoteDetail} /></Route>
      <Route path="/dashboard/messages"><ClientRoute component={ClientMessages} /></Route>
      <Route path="/dashboard/fichiers"><ClientRoute component={ClientFiles} /></Route>
      <Route path="/dashboard/notifications"><ClientRoute component={ClientNotifications} /></Route>
      <Route path="/dashboard/profil"><ClientRoute component={ClientProfile} /></Route>
      <Route path="/dashboard/demandes"><ClientRoute component={ClientRequests} /></Route>
      <Route path="/dashboard/abonnements"><ClientRoute component={ClientSubscriptions} /></Route>
      <Route path="/dashboard/transactions"><ClientRoute component={ClientTransactions} /></Route>
      <Route path="/dashboard/livrables"><ClientRoute component={ClientDeliverables} /></Route>
      <Route path="/dashboard/validations"><ClientRoute component={ClientValidations} /></Route>
      <Route path="/dashboard/evaluations"><ClientRoute component={ClientReviews} /></Route>

      {/* ── ESPACE CHEF DE PROJET ── */}
      <Route path="/pm"><PMRoute component={PMDashboard} /></Route>
      <Route path="/pm/commandes"><PMRoute component={PMOrders} /></Route>
      <Route path="/pm/dossiers"><PMRoute component={PMTreatmentCenter} /></Route>
      <Route path="/pm/planning"><PMRoute component={PMPlanning} /></Route>
      <Route path="/pm/messages/client"><PMRoute component={PMClientChat} /></Route>
      <Route path="/pm/messages/agence"><PMRoute component={PMAgencyChat} /></Route>
      <Route path="/pm/livrables"><PMRoute component={PMDeliverables} /></Route>
      <Route path="/pm/feed"><PMRoute component={PMFeed} /></Route>
      <Route path="/pm/attribution"><PMRoute component={PMAttribution} /></Route>
      <Route path="/pm/qualite"><PMRoute component={PMDeliverables} /></Route>
      <Route path="/pm/souscriptions"><PMRoute component={PMPartnerApplications} /></Route>

      {/* ── ESPACE AGENCE / PARTENAIRE ── */}
      <Route path="/partner"><PartnerRoute component={PartnerDashboard} /></Route>
      <Route path="/partner/missions"><PartnerRoute component={PartnerMissions} /></Route>
      <Route path="/partner/livraison"><PartnerRoute component={AgencyUpload} /></Route>
      <Route path="/partner/messages"><PartnerRoute component={AgencyMessages} /></Route>
      <Route path="/partner/feed"><PartnerRoute component={PartnerFeed} /></Route>
      <Route path="/partner/brief"><PartnerRoute component={PartnerBrief} /></Route>
      <Route path="/partner/fichiers"><PartnerRoute component={PartnerFiles} /></Route>
      <Route path="/partner/corrections"><PartnerRoute component={PartnerCorrections} /></Route>
      <Route path="/partner/remuneration"><PartnerRoute component={PartnerFinance} /></Route>
      <Route path="/partner/score"><PartnerRoute component={PartnerScore} /></Route>

      {/* ── ESPACE ADMIN ── */}
      <Route path="/admin"><AdminRoute component={AdminDashboard} /></Route>
      <Route path="/admin/projets"><AdminRoute component={AdminProjects} /></Route>
      <Route path="/admin/projets/:id"><AdminRoute component={AdminProjectDetail} /></Route>
      <Route path="/admin/devis"><AdminRoute component={AdminQuotes} /></Route>
      <Route path="/admin/agences"><AdminRoute component={AgencyList} /></Route>
      <Route path="/admin/utilisateurs"><AdminRoute component={AdminUsers} /></Route>
      <Route path="/admin/communication"><AdminRoute component={AdminCommunication} /></Route>
      <Route path="/admin/permissions"><AdminRoute component={AdminPermissions} /></Route>
      <Route path="/admin/abonnements"><AdminRoute component={AdminSubscriptions} /></Route>
      <Route path="/admin/pm"><AdminRoute component={AdminPMs} /></Route>
      <Route path="/admin/stats"><AdminRoute component={AdminStats} /></Route>
      <Route path="/admin/logs"><AdminRoute component={AdminLogs} /></Route>
      <Route path="/admin/finance"><AdminRoute component={AdminFinance} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={clerkLocalization as Parameters<typeof ClerkProvider>[0]["localization"]}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/accueil`}
      signUpFallbackRedirectUrl={`${basePath}/accueil`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ProfileProvider>
          <Router />
        </ProfileProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <TooltipProvider>
          <ClerkProviderWithRoutes />
        </TooltipProvider>
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
