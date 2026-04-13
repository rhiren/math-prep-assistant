import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/progress", label: "Progress" },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="panel mb-6 overflow-hidden">
        <div className="panel-padding flex flex-col gap-5 border-b border-stone-200 bg-[linear-gradient(135deg,#fffdf8_0%,#fff3d6_100%)] sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold text-ink">Math Practice</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Pick a concept, answer the questions, and keep moving forward.
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
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
