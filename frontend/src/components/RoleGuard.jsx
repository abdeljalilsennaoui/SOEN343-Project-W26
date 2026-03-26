import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleGuard({ allowed, children }) {
  const { userRole } = useAuth();

  if (!userRole || !allowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
