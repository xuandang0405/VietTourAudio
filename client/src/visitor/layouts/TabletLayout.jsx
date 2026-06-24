import { PCLayout } from './PCLayout';

export function TabletLayout(props) {
  // Use the new 3-Column Desktop/Tablet layout for tablet screens as well, 
  // ensuring a consistent Light Theme Desktop Web App experience.
  return <PCLayout {...props} />;
}
