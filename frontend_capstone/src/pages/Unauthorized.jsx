import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-red-500 mb-4">403</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page.</p>
        <Link to="/" className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700">
          Go Home
        </Link>
      </div>
    </div>
  );
}
