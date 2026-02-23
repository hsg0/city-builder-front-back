// context/homebuilder/drawerContext.jsx
import { createContext, useContext } from "react";

const HomeDrawerContext = createContext(null);

export function useHomeDrawer() {
  const ctx = useContext(HomeDrawerContext);
  if (!ctx) throw new Error("useHomeDrawer must be used inside HomeBuilderLayout");
  return ctx;
}

export default HomeDrawerContext;
