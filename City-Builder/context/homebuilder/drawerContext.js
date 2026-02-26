// context/homebuilder/drawerContext.js
import { createContext, useContext } from "react";

const HomeDrawerContext = createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
  drawerOpen: false,
  searchParams: { userId: null, name: null, email: null },
});

export const useHomeDrawer = () => useContext(HomeDrawerContext);

export default HomeDrawerContext;
