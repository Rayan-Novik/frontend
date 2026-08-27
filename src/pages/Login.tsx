import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios'; 
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'; 
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useStoreConfig } from '../contexts/StoreConfigContext'; 

// ==========================================
// 🟢 1. COMPONENTE ISOLADO DO BOTÃO GOOGLE
// ==========================================

// Criamos a tipagem para o TypeScript parar de reclamar
interface GoogleButtonProps {
  handleSucessoLogin: (data: any) => void;
  setErro: (erro: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const GoogleButton = ({ handleSucessoLogin, setErro, setIsLoading }: GoogleButtonProps) => {
  const loginComGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErro('');
      setIsLoading(true);
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        const tenantIdAtual = localStorage.getItem('tenantId');
        const response = await api.post('/usuarios/google-login', {
          token: tokenResponse.access_token,
          email: userInfo.data.email,
          nome: userInfo.data.name,
          tenant: tenantIdAtual
        });

        handleSucessoLogin(response.data);
      } catch (error: any) {
        console.error("Erro no Google Login:", error);
        setErro(error.response?.data?.message || 'Falha ao autenticar com o Google.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setErro('O login com o Google foi cancelado ou falhou.');
    }
  });

  return (
    <button
      type="button"
      onClick={() => loginComGoogle()}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold h-12 rounded-xl hover:bg-gray-50 transition-all mb-6"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
      Continuar com o Google
    </button>
  );
};

// ==========================================
// 🟢 2. TELA DE LOGIN PRINCIPAL
// ==========================================
export const Login = () => {
  const [loginInput, setLoginInput] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🟢 Estado para guardar a chave do Google desta loja
  const [googleClientId, setGoogleClientId] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB'; 
  const primaryText = appearance?.BTN_PRIMARY_TEXT || '#FFFFFF';
  const logoUrl = appearance?.LOGO_URL;

  useEffect(() => {
    const configurarLoja = async () => {
      const tenantAtual = localStorage.getItem('tenantId');
      if (!tenantAtual) {
        localStorage.setItem('tenantId', '1');
      }

      // 🟢 Busca a configuração do Google dessa loja específica
      try {
        const { data } = await api.get('/usuarios/google-client-id');
        if (data.clientId) {
          setGoogleClientId(data.clientId);
        }
      } catch (error) {
        console.warn('Loja sem Google Client ID configurado.');
      }
    };
    configurarLoja();
  }, []);

  const handleSucessoLogin = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      id_usuario: data.id_usuario,
      nome_completo: data.nome_completo,
      email: data.email,
      role: data.role
    }));

    window.dispatchEvent(new Event('authChange'));

    const returnUrl = location.state?.returnUrl || '/';
    const returnToStep = location.state?.returnToStep;
    navigate(returnUrl, { state: { returnToStep } }); 
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setIsLoading(true);

    try {
      const tenantIdAtual = localStorage.getItem('tenantId');
      const response = await api.post('/usuarios/store-login', { 
        email: loginInput, 
        senha,
        tenant: tenantIdAtual
      });

      handleSucessoLogin(response.data);
    } catch (error: any) {
      const mensagemErro = error.response?.data?.message || 'Erro ao conectar com o servidor.';
      setErro(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="text-center mb-8 flex flex-col items-center">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="Logo da Loja" 
              className="h-16 w-auto mb-4 object-contain drop-shadow-sm" 
            />
          )}
          <h2 className="text-3xl font-bold text-gray-800">Bem-vindo(a)</h2>
          <p className="text-gray-500 mt-2">Acesse sua conta para continuar</p>
        </div>

        {erro && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md font-medium text-center">
            {erro}
          </div>
        )}

        {/* 🟢 Renderiza o Google e o Divisor APENAS se a loja tem a chave configurada */}
        {googleClientId && (
          <GoogleOAuthProvider clientId={googleClientId}>
            <GoogleButton 
              handleSucessoLogin={handleSucessoLogin} 
              setErro={setErro} 
              setIsLoading={setIsLoading} 
            />
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-200 w-full absolute"></div>
              <span className="bg-white px-4 text-sm text-gray-400 relative font-medium">ou entre com e-mail</span>
            </div>
          </GoogleOAuthProvider>
        )}

        <form onSubmit={handleLogin}>
          <Input
            label="E-mail ou CPF"
            type="text"
            placeholder="Digite seu e-mail ou CPF"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            required
            autoComplete="username"
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end mb-4 -mt-2">
            <Link to="/forgot-password" className="text-sm font-medium hover:underline transition-all" style={{ color: primaryBg }}>
              Esqueceu a senha?
            </Link>
          </div>

          <div className="mt-6">
            <Button 
              type="submit" 
              isLoading={isLoading} 
              className="w-full h-12 text-lg rounded-xl border-0 hover:brightness-110 transition-all"
              style={{ 
                backgroundColor: primaryBg, 
                color: primaryText,
                boxShadow: `0 4px 14px 0 ${primaryBg}50`
              }}
            >
              Entrar na minha conta
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <Link to="/register" state={location.state} className="font-bold hover:underline transition-all" style={{ color: primaryBg }}>
              Cadastre-se grátis
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};