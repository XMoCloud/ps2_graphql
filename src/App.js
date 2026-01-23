import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login.js";
import Dashboard from "./components/Dashboard.js";
import ProjectsPage from "./components/ProjectsPage.js";
import NotFound from "./components/404.js";
import PS2Shell from "./components/PS2Shell.js";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<PS2Shell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
