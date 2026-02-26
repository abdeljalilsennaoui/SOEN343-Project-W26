import Router from '@/Router';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router />
      <Toaster />
    </div>
  );
}

export default App;
