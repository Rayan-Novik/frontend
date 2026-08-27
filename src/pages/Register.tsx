import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
// 🟢 Importando o contexto para pegar as cores e a logo
import { useStoreConfig } from '../contexts/StoreConfigContext';

export const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // 🟢 Puxando as configurações visuais da loja
  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB'; // Cor padrão de fallback
  const primaryText = appearance?.BTN_PRIMARY_TEXT || '#FFFFFF';
  const logoUrl = appearance?.LOGO_URL;

  // --- MÁSCARAS ---
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    setTelefone(value);
  };

  // --- LÓGICA DE FORÇA DA SENHA ---
  const calcularForcaSenha = (pass: string) => {
    let forca = 0;
    if (pass.length >= 8) forca += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) forca += 25;
    if (/[0-9]/.test(pass)) forca += 25;
    if (/[!@#$%^&*]/.test(pass)) forca += 25;
    return forca;
  };

  const forcaSenha = calcularForcaSenha(senha);

  const getCorBarra = () => {
    if (forcaSenha <= 25) return 'bg-red-500';
    if (forcaSenha <= 50) return 'bg-orange-500';
    if (forcaSenha <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    
    // 🟢 1. VALIDAÇÃO DE CAMPOS VAZIOS
    if (!nome || !email || !cpf || !telefone || !senha || !confirmarSenha) {
      return setErro('Por favor, preencha todos os campos obrigatórios (*).');
    }

    // 🟢 2. VALIDAÇÕES ESPECÍFicas
    if (cpf.length < 14) return setErro('Por favor, digite um CPF válido e completo.');
    if (telefone.length < 14) return setErro('Por favor, digite o número do WhatsApp completo com DDD.');
    if (forcaSenha < 75) return setErro('Sua senha ainda está muito fraca.');
    if (senha !== confirmarSenha) return setErro('As senhas não coincidem.');

    setIsLoading(true);

    try {
      const payload = {
        nome,
        email,
        cpf: cpf.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, ''),
        senha,
        id_tenant: Number(localStorage.getItem('tenantId') || 1) 
      };

      await api.post('/usuarios', payload);
      setSucesso('Conta criada com sucesso!');
      
      setTimeout(() => navigate('/login', { state: location.state }), 2000);
    } catch (error: any) {
      setErro(error.response?.data?.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="text-center mb-8 flex flex-col items-center">
          {/* 🟢 Renderizando a Logo dinâmica (se existir) */}
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="Logo da Loja" 
              className="h-16 w-auto mb-4 object-contain drop-shadow-sm" 
            />
          )}
          <h2 className="text-3xl font-bold text-gray-800">Criar Conta</h2>
          <p className="text-gray-500 mt-2">Preencha os dados para começar</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="Nome Completo *" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="E-mail *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="CPF *" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} required />
            <Input label="WhatsApp *" placeholder="(00) 00000-0000" value={telefone} onChange={handleTelefoneChange} required />
          </div>

          <div className="space-y-1">
            <Input
              label="Senha *"
              type="password"
              placeholder="Crie uma senha forte"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full transition-all duration-500 ${getCorBarra()}`} 
                style={{ width: `${forcaSenha}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 flex justify-between">
              <span>Segurança da senha</span>
              <span className="font-bold">{forcaSenha}%</span>
            </p>
          </div>

          <div>
            <Input
              label="Confirmar Senha *"
              type="password"
              placeholder="Repita sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
            {confirmarSenha && (
              <p className={`text-[10px] mt-1 ${senha === confirmarSenha ? 'text-green-600' : 'text-red-500'}`}>
                {senha === confirmarSenha ? '✅ As senhas coincidem' : '❌ As senhas estão diferentes'}
              </p>
            )}
          </div>

          {(erro || sucesso) && (
            <div className={`p-3 border text-sm rounded-md font-medium text-center ${
              erro ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {erro || sucesso}
            </div>
          )}

          <div className="mt-6">
            {/* 🟢 Aplicando as cores dinâmicas no botão */}
            <Button 
              type="submit" 
              isLoading={isLoading} 
              disabled={forcaSenha < 75 || senha !== confirmarSenha}
              className="w-full h-12 text-lg rounded-xl border-0 hover:brightness-110 transition-all disabled:opacity-50 disabled:hover:brightness-100"
              style={{ 
                backgroundColor: primaryBg, 
                color: primaryText,
                boxShadow: `0 4px 14px 0 ${primaryBg}50`
              }}
            >
              Cadastrar Agora
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Já tem conta?{' '}
            {/* 🟢 Aplicando a cor no link de "Entrar" */}
            <Link to="/login" state={location.state} className="font-bold hover:underline transition-all" style={{ color: primaryBg }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};