// authentication api route for employee logout
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    sukses: true,
    pesan: 'Successfully logged out from the system.',
  });

  // clear employee session cookie
  response.cookies.set('employee_session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
