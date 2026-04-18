import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Route, ScrollText, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

type TabId = 'servers' | 'router' | 'settings' | 'logs';

interface SidebarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onQuickAdd: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeTab, onChange, onQuickAdd, collapsed, onToggleCollapse }: SidebarProps): JSX.Element {
  const items: Array<{ id: TabId; icon: JSX.Element; label: string }> = [
    { id: 'servers', icon: <LayoutGrid size={18} />, label: 'Серверы' },
    { id: 'router', icon: <Route size={18} />, label: 'Маршрутизатор' },
    { id: 'settings', icon: <Settings2 size={18} />, label: 'Настройки' },
    { id: 'logs', icon: <ScrollText size={18} />, label: 'Логи' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar__top">
        <button type="button" className="sidebar__collapse" onClick={onToggleCollapse} aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}>
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.18 }}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </motion.span>
        </button>

        <button type="button" className="sidebar__add" onClick={onQuickAdd}>
          <Plus size={18} />
          {!collapsed && <span>Добавить</span>}
        </button>
      </div>

      <div className="sidebar__brand">
        <img src={logo} alt="CAKIBRA" className="sidebar__logo" />
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => {
          const active = item.id === activeTab;
          return (
            <button key={item.id} type="button" className={`sidebar__item ${active ? 'is-active' : ''}`} onClick={() => onChange(item.id)}>
              {active && <motion.div layoutId="sidebar-pill" className="sidebar__pill" />}
              <span className="sidebar__item-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
