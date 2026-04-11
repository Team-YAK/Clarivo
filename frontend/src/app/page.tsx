import { redirect } from 'next/navigation';

export default function Home() {
  // Temporary redirect to the primary screen we are building in Step 1
  redirect('/patient');
}
