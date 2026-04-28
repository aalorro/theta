import { NavLink } from 'react-router-dom';

const links = [
  { to: '/regime', label: 'Regime' },
  { to: '/holdings', label: 'Holdings' },
  { to: '/strike-picker', label: 'Strike Picker' },
  { to: '/simulator', label: 'MC Simulator' },
];

export function Sidebar() {
  return (
    <nav className="flex w-56 flex-col border-r border-gray-800 bg-gray-900 p-4">
      <h1 className="mb-6 text-xl font-bold tracking-tight text-white">
        <span className="text-blue-400">θ</span> Theta
      </h1>
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
