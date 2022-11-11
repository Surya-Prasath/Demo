import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Sender from './components/sender';
import Receiver from './components/receiver'; 
import {BrowserRouter, Route, Routes} from 'react-router-dom'; 
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/sender" element={<Sender />} />
      <Route path="/receiver" element={<Receiver />} />
    </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
