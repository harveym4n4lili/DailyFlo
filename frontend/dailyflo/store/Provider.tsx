/**
 * Redux Provider Component
 * 
 * This component wraps the entire app with the Redux Provider,
 * making the Redux store available to all components in the app.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { store } from './index';

/**
 * Props for the ReduxProvider component
 */
interface ReduxProviderProps {
  children: React.ReactNode; // The app components to wrap
}

/**
 * ReduxProvider Component
 * 
 * This component provides the Redux store to all child components.
 * It should be placed at the root of your app, wrapping all other components.
 */
export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

export default ReduxProvider;
