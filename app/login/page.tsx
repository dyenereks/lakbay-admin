import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  // Already signed in — skip the form.
  const session = await getAdminSession();
  if (session) {
    redirect('/');
  }

  return <LoginForm />;
}
