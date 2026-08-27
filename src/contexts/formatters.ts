/**
 * Formata um número para o padrão de moeda brasileiro (BRL)
 * Exemplo: 1500.5 -> R$ 1.500,50
 */
export const formatarPreco = (valor: number): string => {
  if (valor === undefined || valor === null) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(valor);
};

/**
 * Formata uma string de data ISO (do banco de dados) para o padrão brasileiro
 * Exemplo: "2023-10-25T14:30:00Z" -> "25/10/2023 11:30"
 */
export const formatarData = (dataIso: string | undefined | null): string => {
  if (!dataIso) return 'Data indisponível';
  
  const data = new Date(dataIso);
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(data);
};

// 🟢 Bônus: Deixei aqui outras formatações úteis para o seu E-commerce caso precise no futuro!

export const formatarCEP = (cep: string): string => {
  if (!cep) return '';
  return cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})/, "$1-$2");
};

export const formatarCPF = (cpf: string): string => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
};