import { createBrowserRouter, RouterProvider } from "react-router-dom";
import '@mantine/core/styles.css';
import { MantineProvider } from "@mantine/core";
import Home from '@/screens/home';
import '@/index.css';

const paths = [
  {
    path: '/',
    element: (
      <Home/>
    ),
  },
];

// Create the router using the paths defined above
const BrowserRouter = createBrowserRouter(paths);

const App = () => {
  return (
    // MantineProvider wraps the entire app to provide Mantine's styling and theme context
    <MantineProvider>
      <RouterProvider router = {BrowserRouter}/>;
    </MantineProvider>
  );
}

export default App;