// components/ui/Tabs/index.js
import React from 'react';
import useScreenSize from '../../../hooks/useScreenSize';
import "../../../index.css";

const Tabs = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  variant = 'default',
  className = '',
  tabClassName = '',
  badgeClassName = '',
  showLabels = true,
  contentClassName = ''
}) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;

  const handleTabClick = (e, tabId) => {
    e.preventDefault();
    onTabChange(tabId);
  };

  const variants = {
    default: {
      container: 'border-b border-amber-default rounded-b-none',
      tabContainer: isMobile ? 'flex space-x-2 overflow-x-auto scrollbar-hide' : 'flex space-x-2',
      tab: `
        px-4 py-2 
        text-sm font-medium 
        transition-all relative 
        focus:outline-none 
        focus-visible:ring-2 
        focus-visible:ring-offset-2 
        focus-visible:ring-blue-500
        whitespace-nowrap
      `,
      activeTab: 'text-blue-default border-b border-blue-default',
      inactiveTab: 'text-gray-500 hover:text-blue-default',
      badge: 'text-xs px-2 py-0.5 rounded-full bg-gray-100 text-blue-default border border-amber-default',
      indicator: 'absolute bottom-0 left-0 w-full h-0.5 bg-blue-default'
    },
    pills: {
      container: 'flex items-center gap-2',
      tabContainer: 'flex space-x-2',
      tab: `
      ${isMobile ? 'p-2 flex items-center ':'px-4 py-2 '}
        
        text-sm font-medium 
        rounded-full 
        transition-all
        focus:border-2 
        focus-visible:ring-2
        whitespace-nowrap
      `,
      activeTab: 'text-blue-default border-2 border-blue-default',
      inactiveTab: 'text-gray-600 hover:bg-gray-100',
      badge: 'text-xs px-2 py-0.5 ml-2 bg-white/20 rounded-full',
      indicator: ''
    },
    underline: {
      container: 'border-b border-gray-200',
      tabContainer: isMobile ? 'flex space-x-4 overflow-x-auto scrollbar-hide' : 'flex space-x-4',
      tab: `
        py-2 px-1
        text-sm font-medium
        transition-all relative
        focus:outline-none
        whitespace-nowrap
      `,
      activeTab: 'text-blue-default border-b-2 border-blue-default',
      inactiveTab: 'text-gray-500 hover:text-blue-default',
      badge: 'text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600',
      indicator: ''
    }
  };

  const styles = variants[variant] || variants.default;

  return (
    <div className={`${styles.container} ${className} rounded-md`}>
      <div className={`${styles.tabContainer} ${contentClassName}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabStyle = isActive ? styles.activeTab : styles.inactiveTab;

          return (
            <button
              key={tab.id}
              onClick={(e) => handleTabClick(e, tab.id)}
              className={`
                ${styles.tab}
                ${tabStyle}
                ${tabClassName}
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              type="button"
              title={!showLabels ? tab.title : undefined}
            >
              <span className={`relative flex items-center ${isMobile ? (!showLabels ? 'justify-center' : 'flex-col items-center') : 'gap-2'}`}>
                {/* Badge para móvil - posicionado encima del icono/texto */}
                {isMobile && tab.badge && (
                  <span className={`absolute -top-2 -right-2 text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white text-center min-w-5 h-5 flex items-center justify-center ${badgeClassName}`}>
                    {tab.badge}
                  </span>
                )}
                
                {tab.icon && (
                  <span className={`relative ${isMobile && !showLabels ? 'mx-auto' : ''}`}>
                    {tab.icon}
                  </span>
                )}
                
                {(showLabels || !isMobile) && (
                  <span>{tab.title}</span>
                )}
                
                {/* Badge para desktop - al lado del texto */}
                {!isMobile && tab.badge && (
                  <span className={`${styles.badge} ${badgeClassName}`}>
                    {tab.badge}
                  </span>
                )}
              </span>
              
              {isActive && styles.indicator && (
                <span className={styles.indicator} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;