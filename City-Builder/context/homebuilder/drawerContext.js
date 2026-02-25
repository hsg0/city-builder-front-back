// context/homebuilder/drawerContext.js
import { createContext, useContext } from "react";

const HomeDrawerContext = createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
  drawerOpen: false,
});

export const useHomeDrawer = () => useContext(HomeDrawerContext);

export default HomeDrawerContext;
