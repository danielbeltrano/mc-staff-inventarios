import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../SideBar';
import useScreenSize from '../../hooks/useScreenSize';
import GakuFooter from '../GakuFooter';


const ProtectedLayout = () => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width < 768;

  return (
    <div className={`flex ${isMobile ? "flex-col" : ""}`}>
      <SideBar />
      <div className={`w-full  rounded-md  ${isMobile ? "" : "ml-2"}`}>
        <Outlet />
        <GakuFooter />
      </div>
    </div>
  );
};

export default ProtectedLayout;
