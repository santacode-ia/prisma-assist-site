import React from 'react';
import {createRoot} from 'react-dom/client';
import Institutional from './Institutional';
import Testar from './Testar';
const isTestar=window.location.pathname.replace(/\/$/,'')==='/testar';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{isTestar?<Testar/>:<Institutional/>}</React.StrictMode>);
