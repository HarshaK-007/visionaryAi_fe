import { StrictMode } from 'react' // Importing StrictMode from React to enable additional checks in the application
import { createRoot } from 'react-dom/client' // Importing createRoot from react-dom/client for rendering the React app
import App from './App.tsx'
import './index.css'

// Creating a root element where the React application will be rendered
// In TypeScript, the ! is known as the non-null assertion operator

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
