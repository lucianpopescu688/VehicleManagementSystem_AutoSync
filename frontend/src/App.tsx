import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import FleetManagerDashboard from './views/FleetManagerDashboard';
import Login from './views/Login';
import Register from './views/Register';
import { 
  DriverDashboard, 
  StandardUserDashboard, 
  ServiceShopDashboard, 
  AdminDashboard 
} from './views/OtherDashboards';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/manager" replace />} />
                    <Route path="/manager" element={<FleetManagerDashboard />} />
                    <Route path="/driver" element={<DriverDashboard />} />
                    <Route path="/standard" element={<StandardUserDashboard />} />
                    <Route path="/service" element={<ServiceShopDashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
