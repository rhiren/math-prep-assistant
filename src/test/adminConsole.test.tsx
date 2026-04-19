import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { APP_VERSION } from "../app/version";
import { routes } from "../app/router";
import {
  AppServicesProvider,
  createAppServices,
} from "../state/AppServicesProvider";
import { TestModeProvider } from "../state/TestModeProvider";
import { MemoryStorageService } from "../storage/memoryStorageService";

describe("admin console", () => {
  it("opens from the hidden title gesture and manages only test students", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, {
      initialEntries: ["/"],
    });
    const services = await createAppServices(new MemoryStorageService());

    await services.studentProfileService.createProfile("Test Student", "6", undefined, {
      profileType: "test",
      featureFlags: {
        smartRetry: true,
      },
    });

    render(
      <AppServicesProvider services={services}>
        <TestModeProvider>
          <RouterProvider router={router} />
        </TestModeProvider>
      </AppServicesProvider>,
    );

    const titleButton = await screen.findByRole("button", { name: "School Prep Assistant" });
    for (let count = 0; count < 5; count += 1) {
      await user.click(titleButton);
    }

    expect(await screen.findByText("Admin Console")).toBeInTheDocument();
    expect(screen.getByText(APP_VERSION)).toBeInTheDocument();
    expect(screen.getByText("smartRetry")).toBeInTheDocument();
    expect(screen.getByText("enabled")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Delete test profile" })).toHaveLength(1);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete test profile" }));

    await waitFor(() => {
      expect(screen.queryByText("Test Student")).not.toBeInTheDocument();
    });

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Delete test profile" })).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
