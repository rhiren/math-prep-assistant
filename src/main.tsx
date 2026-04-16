import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AppServicesProvider } from "./state/AppServicesProvider";
import { TestModeProvider } from "./state/TestModeProvider";
import "./app/styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppServicesProvider>
      <TestModeProvider>
        <RouterProvider router={router} />
      </TestModeProvider>
    </AppServicesProvider>
  </React.StrictMode>,
);
