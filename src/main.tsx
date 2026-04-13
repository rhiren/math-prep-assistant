import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AppServicesProvider } from "./state/AppServicesProvider";
import "./app/styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppServicesProvider>
      <RouterProvider router={router} />
    </AppServicesProvider>
  </React.StrictMode>,
);
