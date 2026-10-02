import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import usePrefersReducedMotion from "@/hooks/use-prefers-reduced-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  Calculator,
  Clock,
  Compass,
  Eye,
  FileCheck,
  Globe2,
  Inbox,
  LoaderCircle,
  Lock,
  MessageSquare,
  Menu,
  PieChart,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";

const LazyGlobe = lazy(async () => {
  const module = await import("@/components/ui/globe");
  return { default: module.Globe };
});

const LazyTimeline = lazy(() => import("@/components/ui/radial-orbital-timeline"));

const appUrl = "/dashboard";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#why", label: "Why Edgecase" },
  { href: "#security", label: "Security" },
] as const;

type FeatureSort = "priority" | "alphabetical" | "track";

type EventPayload = Record<string, string | number | boolean>;

const trackEvent = (eventName: string, payload: EventPayload = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  const maybeWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: string, eventName: string, params?: EventPayload) => void;
  };

  maybeWindow.dataLayer?.push({ event: eventName, ...payload });
  maybeWindow.gtag?.("event", eventName, payload);

  if (import.meta.env.DEV) {
    console.info("[analytics]", eventName, payload);
  }
};

type IconItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const processSteps = [
  { id: 1, label: "Risk detected" },
  { id: 2, label: "Analyzed" },
  { id: 3, label: "Protected" },
];

const whyPillars: IconItem[] = [
  {
    icon: Shield,
    title: "Built for resilience",
    description: "Protect your operations from hidden vulnerabilities.",
  },
  {
    icon: Globe2,
    title: "Global visibility",
    description: "Monitor supply chains across continents in real-time.",
  },
  {
    icon: Sparkles,
    title: "Continuous improvement",
    description: "Learn from every event-build stronger supply chains.",
  },
];

const featureMatrix: (IconItem & { track: string })[] = [
  {
    icon: Eye,
    title: "Real-Time Monitoring",
    description:
      "Continuous surveillance of your supply chain with instant alerts for disruptions and anomalies.",
    track: "Monitoring",
  },
  {
    icon: Brain,
    title: "Risk Intelligence",
    description:
      "AI-powered analysis identifies hidden vulnerabilities before they become critical issues.",
    track: "Intelligence",
  },
  {
    icon: Globe2,
    title: "Network Mapping",
    description:
      "Visual representation of supplier relationships and dependency chains across global operations.",
    track: "Network",
  },
  {
    icon: PieChart,
    title: "Performance Analytics",
    description:
      "Comprehensive metrics and KPIs to optimize efficiency and reduce operational costs.",
    track: "Analytics",
  },
  {
    icon: Zap,
    title: "Predictive Insights",
    description:
      "Machine learning models forecast potential disruptions weeks before they occur.",
    track: "Forecasting",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "Bank-grade encryption and compliance standards protect your sensitive supply chain data.",
    track: "Security",
  },
  {
    icon: FileCheck,
    title: "Compliance Monitoring",
    description:
      "Automated tracking of regulatory requirements and certification standards across your supply network.",
    track: "Compliance",
  },
  {
    icon: Calculator,
    title: "Cost Optimization",
    description:
      "Intelligent cost analysis and optimization recommendations to maximize profitability and efficiency.",
    track: "Finance",
  },
  {
    icon: Building2,
    title: "Supplier Intelligence",
    description:
      "Comprehensive supplier profiling and performance tracking to ensure reliable partnerships.",
    track: "Suppliers",
  },
];

const trustPoints: IconItem[] = [
  {
    icon: Shield,
    title: "Your data stays protected-always.",
    description:
      "Enterprise-grade encryption and strict security practices keep your supply chain information safe.",
  },
  {
    icon: Target,
    title: "Insights you can rely on.",
    description:
      "Carefully trained AI models focus on accuracy and relevance-not noise.",
  },
  {
    icon: Clock,
    title: "Timely insights, right when you need them.",
    description:
      "Fast, responsive analysis helps teams act early instead of reacting late.",
  },
];

const customerLogos = [
  "Atlas Freight",
  "Northstar Foods",
  "Blue Harbor Retail",
  "Astra Manufacturing",
  "Helios Pharma",
  "Meridian Logistics",
] as const;

const trustStats = [
  { value: "99.98%", label: "platform uptime" },
  { value: "2,480+", label: "incidents prevented this year" },
  { value: "37%", label: "faster mitigation response" },
  { value: "18 min", label: "median alert-to-action time" },
] as const;

const scaroTimelineData = [
  {
    id: 1,
    title: "Data Protection",
    date: "Always",
    content:
      "Enterprise-grade encryption and strict security practices keep your supply chain information safe and compliant.",
    category: "Security",
    icon: Shield,
    relatedIds: [2, 6],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Real-Time Monitoring",
    date: "24/7",
    content:
      "Continuous surveillance of your supply chain with instant alerts for disruptions and anomalies across global operations.",
    category: "Monitoring",
    icon: Eye,
    relatedIds: [1, 3, 4],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "AI Intelligence",
    date: "Live",
    content:
      "Carefully trained AI models focus on accuracy and relevance-identifying risks before they become critical issues.",
    category: "Intelligence",
    icon: Brain,
    relatedIds: [2, 4, 5],
    status: "in-progress" as const,
    energy: 90,
  },
  {
    id: 4,
    title: "Risk Analysis",
    date: "Instant",
    content:
      "Advanced risk assessment algorithms analyze patterns and predict potential supply chain vulnerabilities.",
    category: "Analysis",
    icon: AlertTriangle,
    relatedIds: [2, 3, 5],
    status: "in-progress" as const,
    energy: 85,
  },
  {
    id: 5,
    title: "Global Networks",
    date: "Worldwide",
    content:
      "Visual representation of supplier relationships and dependency chains across continents and regions.",
    category: "Network",
    icon: Globe2,
    relatedIds: [3, 4, 6],
    status: "completed" as const,
    energy: 80,
  },
  {
    id: 6,
    title: "Team Insights",
    date: "On-Demand",
    content:
      "Fast, responsive analysis helps teams act early instead of reacting late to supply chain disruptions.",
    category: "Insights",
    icon: Users,
    relatedIds: [1, 5, 7],
    status: "completed" as const,
    energy: 75,
  },
  {
    id: 7,
    title: "Performance Metrics",
    date: "Real-Time",
    content:
      "Comprehensive analytics and KPIs help optimize efficiency and reduce operational costs across your supply chain.",
    category: "Analytics",
    icon: PieChart,
    relatedIds: [6],
    status: "pending" as const,
    energy: 70,
  },
];

const stateBlocks = [
  {
    label: "Loading",
    detail: "Ingesting market advisories from distributed feeds.",
    tone: "loading",
    icon: LoaderCircle,
  },
  {
    label: "Error",
    detail: "One external connector needs authentication refresh.",
    tone: "error",
    icon: AlertTriangle,
  },
  {
    label: "Empty",
    detail: "No unresolved incidents in your active watchlist.",
    tone: "empty",
    icon: Inbox,
  },
] as const;

const revealDelayClasses = [
  "reveal-delay-0",
  "reveal-delay-1",
  "reveal-delay-2",
  "reveal-delay-3",
  "reveal-delay-4",
  "reveal-delay-5",
  "reveal-delay-6",
  "reveal-delay-7",
  "reveal-delay-8",
  "reveal-delay-9",
  "reveal-delay-10",
  "reveal-delay-11",
] as const;

const getRevealDelayClass = (index: number) =>
  revealDelayClasses[Math.min(index, revealDelayClasses.length - 1)];

const Index = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("#top");
  const [isPerformanceMode, setIsPerformanceMode] = useState(prefersReducedMotion);
  const [shouldLoadGlobe, setShouldLoadGlobe] = useState(false);
  const [shouldLoadTimeline, setShouldLoadTimeline] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const globeRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const featureChangeMountedRef = useRef(false);
  const trackedDepthRef = useRef(new Set<number>());

  const initialSearchParams = useMemo(
    () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)),
    [],
  );

  const [featureQuery, setFeatureQuery] = useState(() => initialSearchParams.get("q") ?? "");
  const [selectedTracks, setSelectedTracks] = useState<string[]>(() => {
    const rawTracks = initialSearchParams.get("tracks");
    return rawTracks ? rawTracks.split(",").map((track) => track.trim()).filter(Boolean) : [];
  });
  const [featureSort, setFeatureSort] = useState<FeatureSort>(() => {
    const incoming = initialSearchParams.get("sort");
    if (incoming === "alphabetical" || incoming === "track" || incoming === "priority") {
      return incoming;
    }

    return "priority";
  });

  const featureTracks = useMemo(() => [...new Set(featureMatrix.map((feature) => feature.track))], []);

  const selectedTrackSet = useMemo(() => new Set(selectedTracks), [selectedTracks]);

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = featureQuery.trim().toLowerCase();

    const filtered = featureMatrix
      .map((feature, index) => ({ ...feature, priorityIndex: index }))
      .filter((feature) => {
        const matchesTrack = selectedTrackSet.size === 0 || selectedTrackSet.has(feature.track);
        const matchesSearch =
          normalizedQuery.length === 0 ||
          `${feature.title} ${feature.description} ${feature.track}`.toLowerCase().includes(normalizedQuery);

        return matchesTrack && matchesSearch;
      });

    const sorted = [...filtered].sort((a, b) => {
      if (featureSort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }

      if (featureSort === "track") {
        return a.track.localeCompare(b.track) || a.title.localeCompare(b.title);
      }

      return a.priorityIndex - b.priorityIndex;
    });

    return sorted;
  }, [selectedTrackSet, featureQuery, featureSort]);

  useEffect(() => {
    setSelectedTracks((current) => current.filter((track) => featureTracks.includes(track)));
  }, [featureTracks]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (featureQuery.trim()) {
      params.set("q", featureQuery.trim());
    } else {
      params.delete("q");
    }

    if (selectedTracks.length > 0) {
      params.set("tracks", selectedTracks.join(","));
    } else {
      params.delete("tracks");
    }

    if (featureSort !== "priority") {
      params.set("sort", featureSort);
    } else {
      params.delete("sort");
    }

    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [featureQuery, selectedTracks, featureSort]);

  useEffect(() => {
    if (!featureChangeMountedRef.current) {
      featureChangeMountedRef.current = true;
      return;
    }

    trackEvent("capability_matrix_filter_changed", {
      selectedTracks: selectedTracks.join(",") || "all",
      searchLength: featureQuery.length,
      sort: featureSort,
      resultCount: filteredFeatures.length,
    });
  }, [selectedTracks, featureQuery, featureSort, filteredFeatures.length]);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", isNavOpen);

    if (isNavOpen) {
      const focusable = drawerRef.current?.querySelector<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
      focusable?.focus();
    }

    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [isNavOpen]);

  useEffect(() => {
    if (!isNavOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsNavOpen(false);
        menuTriggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isNavOpen]);

  useEffect(() => {
    if (isNavOpen) {
      trackEvent("mobile_drawer_opened");
    }
  }, [isNavOpen]);

  useEffect(() => {
    const sections = ["top", "features", "why", "security", "cta"]
      .map((sectionId) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(`#${visible[0].target.id}`);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.2, 0.45, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const detectPerformanceMode = () => {
      const mobileViewport = window.innerWidth <= 940;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      const cpuCores = navigator.hardwareConcurrency ?? 8;
      const lowPowerDevice = memory <= 4 || cpuCores <= 4;
      setIsPerformanceMode(prefersReducedMotion || (mobileViewport && lowPowerDevice));
    };

    detectPerformanceMode();
    window.addEventListener("resize", detectPerformanceMode);

    return () => {
      window.removeEventListener("resize", detectPerformanceMode);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (shouldLoadGlobe || !globeRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadGlobe(true);
          observer.disconnect();
        }
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(globeRef.current);

    return () => observer.disconnect();
  }, [shouldLoadGlobe]);

  useEffect(() => {
    if (prefersReducedMotion || shouldLoadTimeline || !timelineRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadTimeline(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px 0px" },
    );

    observer.observe(timelineRef.current);

    return () => observer.disconnect();
  }, [prefersReducedMotion, shouldLoadTimeline]);

  useEffect(() => {
    const thresholds = [25, 50, 75, 100];

    const onScroll = () => {
      const documentRoot = document.documentElement;
      const scrollableHeight = documentRoot.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        return;
      }

      const depth = Math.round((window.scrollY / scrollableHeight) * 100);
      thresholds.forEach((threshold) => {
        if (depth >= threshold && !trackedDepthRef.current.has(threshold)) {
          trackedDepthRef.current.add(threshold);
          trackEvent("scroll_depth_reached", { depth: threshold });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 940) {
        setIsNavOpen(false);
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const closeDrawer = () => {
    setIsNavOpen(false);
    menuTriggerRef.current?.focus();
  };

  const resetFeatureFilters = () => {
    setSelectedTracks([]);
    setFeatureQuery("");
    setFeatureSort("priority");
  };

  const toggleTrack = (track: string) => {
    setSelectedTracks((current) =>
      current.includes(track) ? current.filter((item) => item !== track) : [...current, track],
    );
  };

  const handleNavLinkClick = (href: string, source: "desktop" | "mobile") => {
    trackEvent("navigation_section_clicked", { href, source });
    setActiveSection(href);
  };

  return (
    <main className={`command-page ${isPerformanceMode ? "performance-mode" : ""}`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="command-atmosphere" aria-hidden="true">
        <div className="command-noise" />
        <div className="command-grid" />
        <div className="command-flare command-flare-left" />
        <div className="command-flare command-flare-right" />
      </div>

      <header className="command-header reveal reveal-delay-1">
        <a href="#top" className="brand-mark" aria-label="Edgecase home">
          <img src="/logo.png" alt="Edgecase Logo" className="brand-icon" />
          <span className="brand-copy">
            <span className="brand-title">Edgecase</span>
            <span className="brand-subtitle">Risk Command</span>
          </span>
        </a>

        <nav className="command-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`command-link ${activeSection === link.href ? "is-active" : ""}`}
              aria-current={activeSection === link.href ? "location" : undefined}
              onClick={() => handleNavLinkClick(link.href, "desktop")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="command-actions">
          <a
            href={appUrl}
            className="dispatch-button dispatch-button-quiet"
            onClick={() => trackEvent("header_cta_clicked", { variant: "login" })}
          >
            Log in
          </a>
          <a
            href={appUrl}
            className="dispatch-button dispatch-button-solid"
            onClick={() => trackEvent("header_cta_clicked", { variant: "get_started" })}
          >
            Get Started
          </a>
        </div>

        <button
          ref={menuTriggerRef}
          type="button"
          className="command-menu-trigger"
          aria-controls="command-mobile-drawer"
          aria-expanded={isNavOpen}
          aria-label={isNavOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsNavOpen((open) => !open)}
        >
          {isNavOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
          <span>Menu</span>
        </button>
      </header>

      {isNavOpen && (
        <div className="command-drawer-shell" role="presentation">
          <button
            type="button"
            className="command-drawer-backdrop"
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          />

          <aside
            id="command-mobile-drawer"
            ref={drawerRef}
            className="command-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="command-drawer-head">
              <p>Navigation</p>
              <button type="button" className="command-drawer-close" onClick={closeDrawer}>
                <X className="size-4" aria-hidden="true" />
                <span>Close</span>
              </button>
            </div>

            <nav className="command-drawer-nav" aria-label="Mobile primary">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`command-drawer-link ${activeSection === link.href ? "is-active" : ""}`}
                  aria-current={activeSection === link.href ? "location" : undefined}
                  onClick={() => {
                    handleNavLinkClick(link.href, "mobile");
                    closeDrawer();
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="command-drawer-actions">
              <a
                href={appUrl}
                className="dispatch-button dispatch-button-quiet"
                onClick={() => {
                  trackEvent("mobile_drawer_cta_clicked", { variant: "login" });
                  closeDrawer();
                }}
              >
                Log in
              </a>
              <a
                href={appUrl}
                className="dispatch-button dispatch-button-solid"
                onClick={() => {
                  trackEvent("mobile_drawer_cta_clicked", { variant: "get_started" });
                  closeDrawer();
                }}
              >
                Get Started
              </a>
            </div>
          </aside>
        </div>
      )}

      <section id="top" className="hero-hangar">
        <div className="hero-copy-block">
          <p className="hero-kicker reveal reveal-delay-2">Adaptive Risk Command</p>
          <h1 id="hero-heading" className="hero-title reveal reveal-delay-3">
            A smarter way to protect
            <span>your supply chain.</span>
          </h1>
          <p className="hero-subtitle reveal reveal-delay-4">
            Edgecase is your intelligent companion for supply chain clarity. Detect risks before they become crises.
          </p>

          <ul className="hero-metrics reveal reveal-delay-5" aria-label="Live command metrics">
            <li>
              <Eye className="size-4" aria-hidden="true" />
              <span>24/7 network surveillance</span>
            </li>
            <li>
              <Zap className="size-4" aria-hidden="true" />
              <span>Predictive disruption signals</span>
            </li>
            <li>
              <Shield className="size-4" aria-hidden="true" />
              <span>Enterprise-grade protection</span>
            </li>
          </ul>

          <div className="hero-actions reveal reveal-delay-6">
            <a href={appUrl} className="dispatch-button dispatch-button-solid dispatch-button-large">
              Start analyzing
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a href={appUrl} className="dispatch-button dispatch-button-outline dispatch-button-large">
              See how it works
            </a>
          </div>

          <p className="hero-meta reveal reveal-delay-7">No credit card required | Enterprise-ready security</p>
        </div>

        <aside className="hero-visual-console reveal reveal-delay-4" aria-label="Global network map">
          <div className="console-header">
            <span>Live Network Map</span>
            <span className="console-badge">Nominal</span>
          </div>

          <div className="globe-housing" ref={globeRef}>
            {shouldLoadGlobe ? (
              <Suspense fallback={<p className="visual-loading-placeholder">Loading global map...</p>}>
                <LazyGlobe
                  className="globe-canvas"
                  config={{
                    width: 600,
                    height: 600,
                    onRender: () => {},
                    devicePixelRatio: isPerformanceMode ? 1 : 2,
                    phi: 0,
                    theta: 0.32,
                    dark: 0,
                    diffuse: 0.45,
                    mapSamples: isPerformanceMode ? 8000 : 15000,
                    mapBrightness: 1.15,
                    baseColor: [0.14, 0.43, 0.38],
                    markerColor: [0.95, 0.42, 0.16],
                    glowColor: [0.91, 0.95, 0.81],
                    markers: [
                      { location: [14.5995, 120.9842], size: 0.03 },
                      { location: [19.076, 72.8777], size: 0.1 },
                      { location: [23.8103, 90.4125], size: 0.05 },
                      { location: [30.0444, 31.2357], size: 0.07 },
                      { location: [39.9042, 116.4074], size: 0.08 },
                      { location: [-23.5505, -46.6333], size: 0.1 },
                      { location: [19.4326, -99.1332], size: 0.1 },
                      { location: [40.7128, -74.006], size: 0.1 },
                      { location: [34.6937, 135.5022], size: 0.05 },
                      { location: [41.0082, 28.9784], size: 0.06 },
                      { location: [51.5074, -0.1278], size: 0.08 },
                      { location: [35.6762, 139.6503], size: 0.09 },
                      { location: [-33.8688, 151.2093], size: 0.07 },
                      { location: [55.7558, 37.6176], size: 0.06 },
                    ],
                  }}
                />
              </Suspense>
            ) : (
              <p className="visual-loading-placeholder">Map will load when visible</p>
            )}
            <span className="globe-tag globe-tag-a">Global community</span>
            <span className="globe-tag globe-tag-b">Shared clarity</span>
            <span className="globe-tag globe-tag-c">One gentle step</span>
          </div>

          <div className="console-strip" aria-label="Operational highlights">
            <p>
              <strong>142</strong> suppliers mapped
            </p>
            <p>
              <strong>17</strong> early warnings generated
            </p>
            <p>
              <strong>0</strong> unresolved critical incidents
            </p>
          </div>
        </aside>
      </section>

      <section className="state-dock" aria-label="Edgecase system states">
        {stateBlocks.map((state, index) => {
          const Icon = state.icon;
          return (
            <article
              key={state.label}
              className={`state-card state-card-${state.tone} reveal ${getRevealDelayClass(index + 8)}`}
              role="status"
              aria-live="polite"
            >
              <div className="state-icon">
                <Icon className={`size-4 ${state.tone === "loading" ? "spin" : ""}`} aria-hidden="true" />
              </div>
              <div className="state-content">
                <p className="state-label">{state.label}</p>
                <p className="state-detail">{state.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <div id="main-content" className="main-content-shell">
        <section id="why" className="dispatch-section section-why">
          <div className="section-heading">
            <p className="section-kicker">Mission</p>
            <h2>Why Edgecase exists</h2>
            <p>
              In supply chains that demand constant attention, we built clarity and confidence through intelligent,
              continuous monitoring.
            </p>
          </div>

          <div className="mission-grid">
            <div className="pillars-ledger">
              {whyPillars.map((pillar, index) => {
                const Icon = pillar.icon;

                return (
                  <article key={pillar.title} className={`pillar-item reveal ${getRevealDelayClass(index + 2)}`}>
                    <div className="pillar-icon">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3>{pillar.title}</h3>
                      <p>{pillar.description}</p>
                    </div>
                  </article>
                );
              })}

              <div className="process-lane" aria-label="From risk to protection">
                <div className="process-line" aria-hidden="true" />
                {processSteps.map((step) => (
                  <div key={step.id} className="process-step">
                    <div className="process-badge">{step.id}</div>
                    <p>{step.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="mission-broadcast reveal reveal-delay-5">
              <Compass className="size-8" aria-hidden="true" />
              <p>
                We built this space to help you find clarity one step at a time. Not another tool that demands more,
                but a companion that gives you room to breathe.
              </p>
              <div className="mission-foot">
                <span className="signal-dot" aria-hidden="true" />
                <span>Join thousands finding their calm</span>
              </div>
            </aside>
          </div>
        </section>

        <section id="features" className="dispatch-section section-features">
          <div className="section-heading">
            <p className="section-kicker">Capabilities</p>
            <h2>Intelligent Risk Detection</h2>
            <p>
              Advanced capabilities uncover hidden vulnerabilities and protect your supply chain with tools designed to
              monitor and optimize global operations.
            </p>
          </div>

          <div className="feature-controls reveal reveal-delay-2">
            <div className="feature-track-filter" role="toolbar" aria-label="Filter capabilities by track">
              {featureTracks.map((track) => (
                <button
                  key={track}
                  type="button"
                  className={`feature-track-chip ${selectedTrackSet.has(track) ? "is-active" : ""}`}
                  data-active={selectedTrackSet.has(track) ? "true" : "false"}
                  aria-pressed={selectedTrackSet.has(track)}
                  onClick={() => toggleTrack(track)}
                >
                  {track}
                </button>
              ))}
              <button
                type="button"
                className="feature-track-chip"
                onClick={() => setSelectedTracks([])}
                aria-label="Clear selected tracks"
              >
                Clear tracks
              </button>
            </div>

            <label className="feature-sort-control" htmlFor="feature-sort-select">
              <span>Sort matrix</span>
              <select
                id="feature-sort-select"
                name="feature-sort"
                value={featureSort}
                onChange={(event) => setFeatureSort(event.target.value as FeatureSort)}
              >
                <option value="priority">By priority</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="track">By track</option>
              </select>
            </label>

            <label className="feature-search">
              <span>Search capability matrix</span>
              <div className="feature-search-input-shell">
                <Search className="size-4" aria-hidden="true" />
                <input
                  type="search"
                  name="feature-search"
                  value={featureQuery}
                  onChange={(event) => setFeatureQuery(event.target.value)}
                  placeholder="Search modules, tracks, or descriptions"
                />
                {featureQuery.length > 0 && (
                  <button
                    type="button"
                    className="feature-search-clear"
                    onClick={() => setFeatureQuery("")}
                    aria-label="Clear capability search"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </label>

            <p className="feature-results-note" role="status" aria-live="polite">
              {filteredFeatures.length} module{filteredFeatures.length === 1 ? "" : "s"} shown
            </p>
          </div>

          <div className="feature-ledger" aria-label="Edgecase capability matrix">
            <div className="feature-ledger-head">
              <span>Module</span>
              <span>What it does</span>
              <span>Track</span>
            </div>

            {filteredFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`feature-ledger-row reveal ${getRevealDelayClass(index + 2)}`}
                >
                  <div className="feature-ledger-icon">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="feature-ledger-main">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                  <p className="feature-ledger-track">
                    {feature.track}
                  </p>
                </article>
              );
            })}

            {filteredFeatures.length === 0 && (
              <article className="feature-ledger-empty">
                <p>No modules match this filter yet. Adjust your filters to continue.</p>
                <button type="button" className="dispatch-button dispatch-button-outline" onClick={resetFeatureFilters}>
                  Reset filters
                </button>
              </article>
            )}
          </div>
        </section>

        <section id="security" className="dispatch-section section-security">
          <div className="section-heading">
            <p className="section-kicker">Reliability</p>
            <h2>Built for Supply Chain Teams</h2>
            <p>Reliability and clarity when stakes are high. Explore the Edgecase ecosystem below.</p>
          </div>

          <div className="timeline-shell reveal" ref={timelineRef}>
            {!prefersReducedMotion && shouldLoadTimeline && (
              <Suspense fallback={<p className="visual-loading-placeholder">Loading reliability timeline...</p>}>
                <LazyTimeline timelineData={scaroTimelineData} />
              </Suspense>
            )}
            {!prefersReducedMotion && !shouldLoadTimeline && (
              <div className="reduced-motion-note">Timeline loads on-demand when this section is in view.</div>
            )}
            {prefersReducedMotion && (
              <div className="reduced-motion-note">
                Interactive visualization is disabled to honor your motion preferences.
              </div>
            )}
          </div>

          <div className="trust-band">
            {trustPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <article key={point.title} className={`trust-chip reveal ${getRevealDelayClass(index + 3)}`}>
                  <div className="trust-icon">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3>{point.title}</h3>
                  <p>{point.description}</p>
                </article>
              );
            })}
          </div>

          <p className="section-footnote">Because trust is built through clarity, not complexity.</p>
        </section>

        <section id="proof" className="dispatch-section section-proof" aria-labelledby="proof-heading">
          <div className="section-heading">
            <p className="section-kicker">Proof</p>
            <h2 id="proof-heading">Trusted in live operations</h2>
            <p>
              Teams rely on Edgecase every hour. Here is concrete proof before you make your decision.
            </p>
          </div>

          <div className="proof-logo-band" aria-label="Selected customer logos">
            {customerLogos.map((logo) => (
              <p key={logo} className="proof-logo-chip">
                {logo}
              </p>
            ))}
          </div>

          <article className="proof-stat-block reveal reveal-delay-3" aria-label="Reliability and impact metrics">
            {trustStats.map((stat) => (
              <div key={stat.label} className="proof-stat-item">
                <p className="proof-stat-value">{stat.value}</p>
                <p className="proof-stat-label">{stat.label}</p>
              </div>
            ))}
          </article>
        </section>

        <section id="cta" className="dispatch-section section-cta" aria-labelledby="cta-heading">
          <div className="cta-vault reveal">
            <h2 id="cta-heading">Ready to Strengthen Your Supply Chain?</h2>
            <p>Join forward-thinking organizations using Edgecase to detect risks before they become crises.</p>
            <div className="cta-actions">
              <a
                href={appUrl}
                className="dispatch-button dispatch-button-solid dispatch-button-large"
                onClick={() => trackEvent("final_cta_clicked", { variant: "trial" })}
              >
                <Rocket className="size-4" aria-hidden="true" />
                Start Free Trial
              </a>
              <a
                href={appUrl}
                className="dispatch-button dispatch-button-outline dispatch-button-large"
                onClick={() => trackEvent("final_cta_clicked", { variant: "demo" })}
              >
                <MessageSquare className="size-4" aria-hidden="true" />
                Schedule Demo
              </a>
              <button type="button" className="dispatch-button dispatch-button-ghost dispatch-button-large" disabled>
                Drill Mode Locked
              </button>
            </div>
            <p className="cta-meta">No credit card required | 14-day free trial | Cancel anytime</p>
          </div>
        </section>
      </div>

      <footer className="command-footer">
        <a href="#top" className="brand-mark" aria-label="Edgecase home">
          <img src="/logo.png" alt="Edgecase Logo" className="brand-icon" />
          <span className="brand-copy">
            <span className="brand-title">Edgecase</span>
            <span className="brand-subtitle">Risk Command</span>
          </span>
        </a>

        <nav className="command-footer-links" aria-label="Footer links">
          <a href="https://docs.edgecase.ai" target="_blank" rel="noreferrer">
            Docs
          </a>
          <a href="https://www.edgecase.ai/privacy" target="_blank" rel="noreferrer">
            Privacy
          </a>
          <a href="https://www.edgecase.ai/terms" target="_blank" rel="noreferrer">
            Terms
          </a>
          <a href="mailto:hello@edgecase.ai">Contact</a>
        </nav>

        <p>© 2026 Edgecase. All rights reserved.</p>
      </footer>
    </main>
  );
};

export default Index;
