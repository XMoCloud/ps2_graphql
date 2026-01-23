import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";
import { graphqlQuery, QUERIES } from "../lib/graphql";
import { Triangle, Circle, Cross, Square } from "./PS2Symbols.js";
import Header from "./Header.js";
import ProjectCard from "./ProjectCard.js";
import LoadingScreen from "./LoadingScreen.js";
import { playHoverSound, playClickSound } from "../lib/sound";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [xpMap, setXpMap] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [userData, projectsData] = await Promise.all([
        graphqlQuery(QUERIES.USER),
        graphqlQuery(QUERIES.PROJECTS),
      ]);

      setUser(userData.user[0]);

      const xpMapping = {};
      (projectsData.transaction || []).forEach((tx) => {
        const name = tx.object?.name;
        if (name) {
          xpMapping[name] = (xpMapping[name] || 0) + tx.amount;
        }
      });
      setXpMap(xpMapping);

      setProjects(projectsData.result || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    switch (filter) {
      case "passed":
        return projects.filter((p) => p.grade >= 1);
      case "failed":
        return projects.filter((p) => p.grade < 1);
      default:
        return projects;
    }
  }, [projects, filter]);

  const stats = useMemo(() => {
    const passed = projects.filter((p) => p.grade >= 1).length;
    const failed = projects.filter((p) => p.grade < 1).length;
    const total = projects.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    return { passed, failed, total, passRate };
  }, [projects]);

  if (loading) {
    return <LoadingScreen message="Loading projects..." />;
  }

  return (
    <div className="relative z-10">
      <Header user={user} />

      <main className="container mx-auto px-6 py-8">
          <div className="mb-8 animate-fade-in">
          <h2 className="zrnic-font text-2xl tracking-[0.25em] uppercase text-foreground">
            All <span className="text-primary ps2-glow-text">Projects</span>
          </h2>
          <p className="font-rajdhani text-muted-foreground mt-1">Your complete project history</p>
        </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div
              className="ps2-card p-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "0ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-3">
                <Square size={20} className="text-ps2-square" />
                <div>
                  <p className="zrnic-font text-2xl font-bold text-foreground tracking-[0.2em]">{stats.total}</p>
                  <p className="zrnic-font text-xs text-muted-foreground uppercase tracking-[0.4em]">Total</p>
                </div>
              </div>
            </div>

            <div
              className="ps2-card p-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-3">
                <Triangle size={20} className="text-ps2-triangle" />
                <div>
                  <p className="zrnic-font text-2xl font-bold text-success tracking-[0.2em]">{stats.passed}</p>
                  <p className="zrnic-font text-xs text-muted-foreground uppercase tracking-[0.4em]">Passed</p>
                </div>
              </div>
            </div>

            <div
              className="ps2-card p-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-3">
                <Circle size={20} className="text-ps2-circle" />
                <div>
                  <p className="zrnic-font text-2xl font-bold text-destructive tracking-[0.2em]">{stats.failed}</p>
                  <p className="zrnic-font text-xs text-muted-foreground uppercase tracking-[0.4em]">Failed</p>
                </div>
              </div>
            </div>

            <div
              className="ps2-card p-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-3">
                <Cross size={20} className="text-ps2-cross" />
                <div>
                  <p className="zrnic-font text-2xl font-bold text-primary tracking-[0.2em]">{stats.passRate}%</p>
                  <p className="zrnic-font text-xs text-muted-foreground uppercase tracking-[0.4em]">Pass Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="ps2-card p-6 mb-8 opacity-0 animate-slide-up"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
          >
            <h3 className="zrnic-font text-sm text-muted-foreground uppercase tracking-[0.4em] mb-4">
              Pass Rate Visualization
            </h3>
            <div className="relative h-8 rounded-lg overflow-hidden bg-muted">
              <div
                className="absolute inset-y-0 left-0 flex items-center justify-center transition-all duration-1000 ease-out"
                style={{
                  width: `${stats.passRate}%`,
                  background: "linear-gradient(90deg, hsl(145 70% 35%), hsl(145 70% 50%))",
                  minWidth: stats.passed > 0 ? "60px" : "0",
                }}
              >
                {parseFloat(stats.passRate) > 15 && (
                  <span className="text-xs font-orbitron text-white font-bold">{stats.passed} PASS</span>
                )}
              </div>
              <div
                className="absolute inset-y-0 right-0 flex items-center justify-center transition-all duration-1000 ease-out"
                style={{
                  width: `${100 - parseFloat(stats.passRate)}%`,
                  background: "linear-gradient(90deg, hsl(0 70% 40%), hsl(0 70% 55%))",
                  minWidth: stats.failed > 0 ? "60px" : "0",
                }}
              >
                {parseFloat(stats.passRate) < 85 && stats.failed > 0 && (
                  <span className="text-xs font-orbitron text-white font-bold">{stats.failed} FAIL</span>
                )}
              </div>
            </div>
          </div>

          <div
            className="flex gap-2 mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
          >
            {[
              { key: "all", label: "All Projects", count: stats.total },
              { key: "passed", label: "Passed", count: stats.passed },
              { key: "failed", label: "Failed", count: stats.failed },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  playClickSound();
                  setFilter(tab.key);
                }}
                onMouseEnter={playHoverSound}
                onFocus={playHoverSound}
                className={`px-4 py-2 rounded font-rajdhani text-sm uppercase tracking-wider transition-all ${
                  filter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <ProjectCard
                  key={index}
                  name={project.object?.name}
                  grade={project.grade}
                  xp={xpMap[project.object?.name] || 0}
                  createdAt={project.createdAt}
                  index={index}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Square size={48} className="text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground font-rajdhani">No projects found with the current filter</p>
              </div>
            )}
          </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
