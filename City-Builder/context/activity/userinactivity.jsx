//  City-Builder/context/activity/userinactivity.jsx
import React from "react";

// Create a context to track user inactivity
const UserInactivityContext = React.createContext({
  isInactive: false,
  setIsInactive: () => {},
});

export const UserInactivityProvider = ({ children }) => {
  const [isInactive, setIsInactive] = React.useState(false);    

  return (
    <UserInactivityContext.Provider value={{ isInactive, setIsInactive }}>
      {children}
    </UserInactivityContext.Provider>
  );
};

export const useUserInactivity = () => React.useContext(UserInactivityContext);