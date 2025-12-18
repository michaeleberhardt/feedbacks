import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { Box } from '@mui/material';

import Login from './pages/Login';
import AdminLayout from './layout/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import Templates from './pages/Templates';
import PublicSurvey from './pages/PublicSurvey';
// import Settings from './pages/Settings';
import Settings from './components/Settings';
import EmailLogs from './pages/EmailLogs';
import SystemInfo from './pages/SystemInfo';

function App() {
  // Force HMR update
  return (
    <ThemeProvider>
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="templates" element={<Templates />} />
              <Route path="settings" element={<Settings />} />
              <Route path="logs" element={<EmailLogs />} />
              <Route path="info" element={<SystemInfo />} />
            </Route>
            <Route path="/survey/:id" element={<PublicSurvey />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
