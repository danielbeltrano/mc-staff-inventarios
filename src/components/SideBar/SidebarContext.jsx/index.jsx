// src/components/Sidebar/SidebarContext.jsx
import { createContext, useContext } from 'react';

const SidebarContext = createContext();

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider = ({ children, value }) => {
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};
