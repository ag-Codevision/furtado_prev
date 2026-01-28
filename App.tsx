import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { UIProvider } from './contexts/UIContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Clients from './pages/Clients';
import Agenda from './pages/Agenda';
import Login from './pages/Login';
import Finance from './pages/Finance';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import ServiceFlow from './pages/ServiceFlow';
import CalculoRMI from './pages/CalculoRMI';
import PrevIA from './pages/PrevIA';

import Landing from './pages/Landing';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Decisions from './pages/Decisions';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <UIProvider>
        <DataProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/crm" element={<ServiceFlow />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/team" element={<Team />} />
              <Route path="/calculations" element={<CalculoRMI />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/ai" element={<PrevIA />} />

              <Route path="/reports" element={<Reports />} />
              <Route path="/decisions" element={<Decisions />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        </DataProvider>
      </UIProvider>
    </Router>
  );
};

export default App;