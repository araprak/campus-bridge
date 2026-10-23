import { redirect } from 'next/navigation';

// Keep old bookmarks usable without exposing a plan outside account access.
export default function RetiredDemo() {
  redirect('/login');
}
