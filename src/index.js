import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App.js";
import "./index.css";
import { preloadStaticAssets } from "./lib/preloadAssets.js";

preloadStaticAssets();

createRoot(document.getElementById("root")).render(<App />);
