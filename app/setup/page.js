import { hasAnyAdmins } from '@/lib/adminAuth';
import SetupForm from '@/components/SetupForm';
import Link from 'next/link';
import { Train } from 'lucide-react';

export default async function SetupPage() {
  const hasAdmins = await hasAnyAdmins();
  
  if (hasAdmins) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Train className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Setup Complete</h2>
          <p className="mt-4 text-slate-600">
            Admin setup is already completed.
            <br />
            Please login to manage administrator accounts.
          </p>
          <div className="mt-6">
            <Link href="/admin/login" className="inline-block w-full text-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
              GO TO LOGIN
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Train className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Trip Management
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Admin Setup
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-medium text-slate-900">Create your administrator account</h3>
          </div>
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
