import { AuthProvider } from '../context/AuthContext';
import '../app/globals.css'; // Assuming globals.css is in app directory

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}