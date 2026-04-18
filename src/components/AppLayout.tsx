import { NavLink, Outlet } from "react-router-dom";
import { useTestMode } from "../state/TestModeProvider";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/progress", label: "Progress" },
];

export function AppLayout() {
  const { isTestMode } = useTestMode();

  return (
    <div className="app-shell">
      {!isTestMode ? (
        <header className="panel mb-6 overflow-hidden">
          <div className="panel-padding flex flex-col gap-5 border-b border-stone-200 bg-[linear-gradient(135deg,#fffdf8_0%,#fff3d6_100%)] sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold text-ink">School Prep Assistant</h1>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Start with mathematics today, and keep the structure ready for more subjects later.
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 px-5 py-4 sm:px-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive
                    ? "action-link"
                    : "secondary-link"
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
      ) : (
        <div className="mb-4 flex justify-end">
          <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Focus Mode
          </div>
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
