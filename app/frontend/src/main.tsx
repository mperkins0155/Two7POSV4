import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadRuntimeConfig } from './lib/config';

const root = createRoot(document.getElementById('root')!);

loadRuntimeConfig().finally(() => {
  root.render(<App />);
});
