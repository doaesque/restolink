import { redirect } from 'next/navigation';

export default function EmployeePage() {
  // redirect to login by default
  redirect('/employee/login');
}
