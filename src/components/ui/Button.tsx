import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  // 🟢 Adicionamos as variantes de cor que podemos usar em todo o sistema
  variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'disabled';
}

export const Button = ({ children, isLoading, variant = 'primary', className = '', ...props }: ButtonProps) => {
  
  // 🟢 Lógica centralizada de cores
  let variantClasses = '';
  
  if (isLoading || props.disabled || variant === 'disabled') {
    variantClasses = 'bg-gray-200 text-gray-500 cursor-not-allowed';
  } else if (variant === 'success') {
    variantClasses = 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/30';
  } else if (variant === 'danger') {
    variantClasses = 'bg-red-500 hover:bg-red-600 text-white';
  } else if (variant === 'secondary') {
    variantClasses = 'bg-gray-100 hover:bg-gray-200 text-gray-800';
  } else {
    // Padrão (Primary)
    variantClasses = 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm';
  }

  return (
    <button
      disabled={isLoading || props.disabled || variant === 'disabled'}
      // Removemos o w-full daqui para não forçar em todo lugar, mas mantemos as transições
      className={`py-2 px-4 rounded-md font-semibold transition-all duration-300 flex justify-center items-center ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {/* Adicionando um spinner bonitinho quando estiver carregando */}
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Aguarde...
        </span>
      ) : children}
    </button>
  );
};