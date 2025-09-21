import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the today tab as the default route
  return <Redirect href="/today" />;
}
