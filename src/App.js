import React, { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Experience from "./experience/Experience";
import Login from "./components/Login";
import Startup from "./components/Startup";
const ConsoleApp = lazy(() => import("./console/ConsoleApp"));
import NotFound from "./components/404";
import ConsoleWorld from "./components/ConsoleWorld";
const StartupStudy = import.meta.env.DEV ? lazy(() => import("./components/StartupStudy")) : null;
function Viewport() {
  const location = useLocation();
  if (import.meta.env.DEV && location.pathname === "/preview/startup")
    return (
      <Suspense
        fallback={
          <p className="startup-study-loading">Preparing startup comparison…</p>
        }
      >
        <StartupStudy />
      </Suspense>
    );
  return (
    <>
      <ConsoleWorld />
      <Suspense
        fallback={
          <div className="loading-console" role="status">
            Reading your memory cards…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Login />} />
          {["dashboard", "projects", "audits", "skills", "about"].flatMap((section) => [
            <Route
              key={section}
              path={`/${section}`}
              element={<ConsoleApp />}
            />,
            ...(import.meta.env.DEV ? [<Route
              key={`preview-${section}`}
              path={`/preview/${section}`}
              element={<ConsoleApp />}
            />] : []),
          ])}
          {["journey", "system"].flatMap((path) => [
            <Route
              key={path}
              path={`/${path}`}
              element={<Navigate to="/dashboard" replace />}
            />,
            ...(import.meta.env.DEV ? [<Route
              key={`preview-${path}`}
              path={`/preview/${path}`}
              element={<Navigate to="/preview/dashboard" replace />}
            />] : []),
          ])}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Startup />
      <div className="console-screen-lines" aria-hidden="true" />
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Experience>
        <Viewport />
      </Experience>
    </BrowserRouter>
  );
}
