import { Home, ListChecks, Tags } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/review", label: "Review", icon: ListChecks },
  { to: "/categories", label: "Categories", icon: Tags }
];

export function AppNavigation() {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end={item.to === "/"} key={item.to} to={item.to}>
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

