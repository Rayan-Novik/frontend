import { AppRoutes } from './routes';
import { CartProvider } from './contexts/CartContext';
import { StoreConfigProvider } from './contexts/StoreConfigContext';
import { GoogleOAuthProvider } from '@react-oauth/google'; // 🟢 1. Importa o provedor do Google

function App() {
  return (
    // 🟢 2. Envolve a aplicação inteira com o GoogleOAuthProvider
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <StoreConfigProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </StoreConfigProvider>
    </GoogleOAuthProvider>
  );
}

export default App;