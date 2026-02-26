import { AuthProvider } from '@/contexts/AuthContext';
import Router from '@/Router';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
