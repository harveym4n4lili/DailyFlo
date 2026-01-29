import React, { createContext } from 'react';

// tabbarcontext: global context for controlling tab bar-related flags
// here we expose a setter to hide/show the search trigger from anywhere in the app
export const TabBarContext = createContext<{
  setIsSearchHidden: (hidden: boolean) => void;
}>({
  // default implementation: no-op so screens can render even before provider is mounted
  setIsSearchHidden: () => {},
});

