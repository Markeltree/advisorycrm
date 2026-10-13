import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Layout from './components/Layout.jsx';
import { isSignedIn } from './lib/session.js';
import SignIn from './pages/SignIn.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Contacts from './pages/Contacts.jsx';
import NewContact from './pages/NewContact.jsx';
import ContactDetail from './pages/ContactDetail.jsx';
import Approvals from './pages/Approvals.jsx';
import Compliance from './pages/Compliance.jsx';
import Workflows from './pages/Workflows.jsx';

function RequireSession({ children }) {
  const location = useLocation();
  if (!isSignedIn()) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Page not found</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          The requested path does not exist or has been moved to another section.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Today</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route
        element={
          <RequireSession>
            <Layout />
          </RequireSession>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/new" element={<NewContact />} />
        <Route path="contacts/:id" element={<ContactDetail />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="workflows" element={<Workflows />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
