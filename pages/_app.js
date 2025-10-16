// ✅ This makes sure your CSS actually loads
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <div className="main-container">
      <Component {...pageProps} />
      <footer>Jobbyjob • Your Personal ATS Tool • Private & Secure</footer>
    </div>
  );
}
