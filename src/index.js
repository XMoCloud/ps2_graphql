import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App.js";
import "./index.css";
import "./experience/console-blue.css";
import "./experience/console-clean.css";
import "./experience/console-menu.css";
import "./console/status.css";
import "./console/memory-browser.css";
import "./console/menu-finish.css";
import "./console/about.css";
import "./console/insights.css";
import { preloadStaticAssets } from "./lib/preloadAssets.js";

preloadStaticAssets();

createRoot(document.getElementById("root")).render(<App />);
