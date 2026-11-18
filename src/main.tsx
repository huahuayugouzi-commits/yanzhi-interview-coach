import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import Home from './Home';
import './styles.css';
import './soft-os.css';
import './home.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{window.location.pathname.replace(/\/+$/,'')==='/train'?<App/>:<Home/>}</React.StrictMode>);
