import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";
import { graphqlQuery, QUERIES } from "../lib/graphql";
import PS2AmbientLayer from "./PS2AmbientLayer.js";
import Header from "./Header.js";
import XPProgressGraph from "./XPProgressGraph.js";
import SkillsRadar from "./SkillsRadar.js";
import AuditRatioGraph from "./AuditRatioGraph.js";
import LoadingScreen from "./LoadingScreen.js";
import { playHoverSound, playClickSound } from "../lib/sound";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromLogin = location.state?.fromLogin ?? false;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [stats, setStats] = useState({
    totalXP: 0,
    auditUp: 0,
    auditDown: 0,
    transactions: [],
    skills: [],
    recentProjects: [],
  });
  const [overlayState, setOverlayState] = useState(cameFromLogin ? "cover" : "hidden");
  const overlayTimersRef = useRef([]);
  const clearedRouteStateRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [userData, levelData, auditData, xpData, xpOverviewData, skillsData, projectsData] = await Promise.all([
        graphqlQuery(QUERIES.USER),
        graphqlQuery(QUERIES.LEVEL),
        graphqlQuery(QUERIES.AUDIT_TOTALS),
        graphqlQuery(QUERIES.XP_PROGRESS),
        graphqlQuery(QUERIES.XP_OVERVIEW),
        graphqlQuery(QUERIES.SKILLS),
        graphqlQuery(QUERIES.PROJECTS),
      ]);

      setUser(userData.user[0]);
      setUserLevel(levelData.transaction?.[0]?.amount ?? null);

      setStats({
        totalXP: xpOverviewData.transaction_aggregate?.aggregate?.sum?.amount || 0,
        auditUp: auditData.up?.aggregate?.sum?.amount || 0,
        auditDown: auditData.down?.aggregate?.sum?.amount || 0,
        transactions: xpData.transaction || [],
        skills: skillsData.transaction || [],
        recentProjects: projectsData.result?.slice(0, 5) || [],
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      overlayTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!cameFromLogin) return;
    if (overlayState !== "cover") return;
    if (loading) return;

    const revealTimer = setTimeout(() => setOverlayState("opening"), 80);
    const hideTimer = setTimeout(() => setOverlayState("hidden"), 700);
    overlayTimersRef.current = [revealTimer, hideTimer];
  }, [cameFromLogin, overlayState, loading]);

  useEffect(() => {
    if (!cameFromLogin) return;
    if (overlayState !== "hidden" || clearedRouteStateRef.current) return;

    clearedRouteStateRef.current = true;
    navigate(location.pathname, { replace: true, state: {} });
  }, [overlayState, cameFromLogin, navigate, location.pathname]);

  const formatXP = (xp) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(2)} MB`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(0)} KB`;
    return `${xp} B`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.login || "—";
  const memberSince = user?.createdAt ? formatDate(user.createdAt) : "—";
  const recentProjectsPreview = stats.recentProjects.slice(0, 4);

  if (loading && !cameFromLogin) {
    return <LoadingScreen message="Loading profile data..." />;
  }

  const shouldShowRouteOverlay = overlayState !== "hidden";
  const overlayClass = overlayState === "cover"
    ? "route-transition-overlay route-transition-overlay--cover"
    : overlayState === "opening"
      ? "route-transition-overlay route-transition-overlay--opening"
      : "";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {shouldShowRouteOverlay && <div className={overlayClass} />}
      <PS2AmbientLayer />

      <div className="relative z-10">
        <Header user={user} />

        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="ps2-card p-5 space-y-3">
              <div className="flex flex-col gap-2 mb-4">
                <p className="zrnic-font text-xs uppercase tracking-[0.4em] text-muted-foreground">User Profile</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="psold-font text-2xl text-primary ps2-glow-text tracking-[0.3em] uppercase">{user?.login}</p>
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 ml-3">
                      <span className="zrnic-font text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Level</span>
                      <span className="font-orbitron text-2xl text-primary">{userLevel ?? "—"}</span>
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground font-rajdhani">{fullName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base font-rajdhani leading-tight">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-xs">Full Name</p>
                  <p className="text-foreground">{fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-xs">Email</p>
                  <p className="text-foreground break-all">{user?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-xs">Member Since</p>
                  <p className="text-foreground">{memberSince}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-xs">User ID</p>
                  <p className="text-foreground">{user?.id}</p>
                </div>
              </div>
            </div>

            <div className="ps2-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="zrnic-font text-xs uppercase tracking-[0.4em] text-muted-foreground">Experience Points</p>
                  <p className="font-orbitron text-3xl text-primary mt-1">{formatXP(stats.totalXP)}</p>
                </div>
                <Link
                  to="/projects"
                  className="ps2-button px-4 py-2 text-xs tracking-[0.4em]"
                  onMouseEnter={playHoverSound}
                  onFocus={playHoverSound}
                  onClick={playClickSound}
                >
                  View All
                </Link>
              </div>

              <div>
                <p className="zrnic-font text-xs uppercase tracking-[0.4em] text-muted-foreground mb-2">Recent Projects</p>
                {recentProjectsPreview.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recentProjectsPreview.map((project, index) => (
                      <div
                        key={`${project.object?.name}-${index}`}
                        className="border border-border/60 rounded-lg px-3 py-2 bg-card/40 flex flex-col gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="zrnic-font text-xs text-foreground uppercase tracking-[0.2em] line-clamp-2">
                            {project.object?.name || "Untitled"}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full font-rajdhani uppercase tracking-[0.25em] ${
                              project.grade >= 1 ? "ps2-tag-pass" : "ps2-tag-fail"
                            }`}
                          >
                            {project.grade >= 1 ? "Pass" : "Fail"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-rajdhani">{formatDate(project.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground font-rajdhani">No recent projects yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <XPProgressGraph transactions={stats.transactions} totalXP={stats.totalXP} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkillsRadar skills={stats.skills} />
            <AuditRatioGraph up={stats.auditUp} down={stats.auditDown} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
