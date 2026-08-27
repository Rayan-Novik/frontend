import type { ReactNode } from 'react';
import { formatarPreco, formatarData } from '../../contexts/formatters';

interface OrderModalProps {
  pedido: any;
  onClose: () => void;
  primaryBg: string;
  getStatusBadge: (status: string) => ReactNode;
  storeName?: string;
  logoUrl?: string | null;
  tenantContact?: any;
  lojaInfo?: any;
}

export const OrderModal: React.FC<OrderModalProps> = ({ 
  pedido, 
  onClose, 
  primaryBg, 
  getStatusBadge, 
  storeName = 'Minha Loja', 
  logoUrl, 
  tenantContact, 
  lojaInfo 
}) => {
  if (!pedido) return null;

  // Lógica de Logística
  const enderecoRaw = pedido.endereco_entrega || '';
  const isConsumoLocal = enderecoRaw.toLowerCase().includes('mesa') || enderecoRaw.toLowerCase().includes('nome:');
  const isRetirada = enderecoRaw.toLowerCase().includes('retirada') || (!isConsumoLocal && enderecoRaw === 'Retirada / Não informado');

  // Cálculos Financeiros
  const freteCalculado = parseFloat(pedido.preco_frete) || 0;
  const subtotal = parseFloat(pedido.valor_total) - freteCalculado;

  // Formatação de CPF e Telefone Segura
  let cpfCliente = pedido.cliente?.cpf || 'Não informado';
  let telefoneCliente = pedido.cliente?.telefone || 'Não informado'; 

  if (cpfCliente.length === 11) cpfCliente = cpfCliente.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (telefoneCliente.length === 11) telefoneCliente = telefoneCliente.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (cpfCliente.length > 20) cpfCliente = "Não informado";
  if (telefoneCliente.length > 20) telefoneCliente = "Não informado";

  // 🟢 FUNÇÃO DE IMPRESSÃO A4 (PADRÃO ADMIN)
  const handlePrintA4 = () => {
    const isPago = pedido.status_pagamento === 'PAGO' || pedido.status_pagamento === 'Aprovado';
    const isFalha = pedido.status_pagamento === 'CANCELADO' || pedido.status_pagamento === 'REJEITADO';

    const urlLojaExibicao = window.location.host; // Pega o domínio atual que o cliente está acessando

    const htmlA4 = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Pedido #${pedido.id_pedido} - ${storeName}</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .a4-page {
                width: 21cm;
                min-height: 29.7cm;
                padding: 1.5cm;
                margin: 0 auto;
                background-color: white;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                border-radius: 8px;
                border: 1px solid #cbd5e1;
            }
            .fw-black { font-weight: 900; }
            .border-dashed { border-style: dashed !important; border-color: #cbd5e1 !important; }
            .invoice-table th { font-size: 12px; letter-spacing: 0.5px; }
            .invoice-table td { font-size: 13px; color: #334155; }
            
            .action-bar { text-align: center; margin-bottom: 20px; }
            .btn-print { background-color: ${primaryBg}; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: 0.2s; }
            .btn-print:hover { opacity: 0.9; }

            @media print {
                @page { size: A4 portrait; margin: 0; }
                body { background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0; }
                .no-print { display: none !important; }
                .a4-page { width: 100%; min-height: auto; padding: 1.5cm; margin: 0; box-shadow: none; border-radius: 0; border: none; }
            }
          </style>
        </head>
        <body>
          
          <div class="no-print action-bar">
            <button class="btn-print" onclick="window.print()"><i class="bi bi-printer"></i> Imprimir ou Salvar PDF</button>
          </div>

          <div class="a4-page d-flex flex-column">
            
            <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-2" style="border-color: ${primaryBg} !important;">
                <div class="d-flex align-items-center gap-3 w-50">
                    ${logoUrl ? `
                        <img src="${logoUrl}" alt="Logo da Loja" style="max-width: 120px; max-height: 80px; object-fit: contain; border-radius: 4px;" />
                    ` : `
                        <div class="text-white d-flex align-items-center justify-content-center fw-bold rounded p-2 text-center" style="width: 80px; height: 80px; background-color: ${primaryBg}; font-size: 11px;">
                            ${storeName}
                        </div>
                    `}
                    <div>
                        <h3 class="m-0 fw-black text-uppercase" style="letter-spacing: 1px; color: ${primaryBg};">${storeName}</h3>
                        <div class="text-muted small fw-medium mt-1">${urlLojaExibicao}</div>
                    </div>
                </div>
                
                <div class="text-end w-50">
                    <h2 class="fw-black text-uppercase mb-1" style="color: ${primaryBg}; letter-spacing: 1px;">Pedido de Compra</h2>
                    <h4 class="fw-bold m-0 text-dark">#${pedido.id_pedido}</h4>
                    <div class="text-muted mt-1 fw-medium" style="font-size: 14px;">
                        Data: ${formatarData(pedido.data_criacao)}
                    </div>
                </div>
            </div>

            <div class="row mb-4 gx-4">
                <div class="col-6">
                    <div class="p-2 mb-2 fw-bold text-white text-uppercase" style="background-color: #475569; font-size: 12px; letter-spacing: 1px;">
                        Dados da Empresa (Vendedor)
                    </div>
                    <div class="ps-2 text-dark" style="font-size: 13px; line-height: 1.6;">
                        <div class="fw-bold fs-6 mb-1">${storeName}</div>
                        ${tenantContact?.documento ? `<div><strong>CNPJ/CPF:</strong> ${tenantContact.documento}</div>` : ''}
                        ${tenantContact?.email_contato ? `<div><strong>Email:</strong> ${tenantContact.email_contato}</div>` : ''}
                        ${tenantContact?.telefone_contato ? `<div><strong>Tel:</strong> ${tenantContact.telefone_contato}</div>` : ''}
                        
                        ${lojaInfo ? `
                            <div class="mt-2 border-top border-dashed pt-2">
                                <strong>Endereço da Loja:</strong><br />
                                ${lojaInfo.logradouro}, ${lojaInfo.numero} - ${lojaInfo.bairro}<br/>
                                ${lojaInfo.cidade}/${lojaInfo.estado} - CEP: ${lojaInfo.cep}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="col-6">
                    <div class="p-2 mb-2 fw-bold text-white text-uppercase" style="background-color: ${primaryBg}; font-size: 12px; letter-spacing: 1px;">
                        Cliente / Destino
                    </div>
                    <div class="ps-2 text-dark" style="font-size: 13px; line-height: 1.6;">
                        <div class="fw-bold fs-6 mb-1">${pedido.cliente?.nome || 'Cliente não identificado'}</div>
                        <div><strong>CPF:</strong> ${cpfCliente}</div>
                        <div><strong>Tel:</strong> ${telefoneCliente}</div>
                        
                        <div class="mt-2 pt-2 border-top border-dashed">
                            ${isConsumoLocal ? `
                                <div>
                                    <div class="fw-bold text-danger mb-1"><i class="bi bi-cup-hot me-1"></i> CONSUMO NO LOCAL</div>
                                    <div class="fs-6 fw-bold">${enderecoRaw.replace('Mesa/Nome:', '').trim() || 'Mesa não informada'}</div>
                                </div>
                            ` : isRetirada ? `
                                <div>
                                    <div class="fw-bold text-primary mb-1"><i class="bi bi-shop me-1"></i> RETIRADA NA LOJA</div>
                                    ${lojaInfo ? `
                                        <>O pedido deverá ser retirado no balcão da loja.</>
                                    ` : `<strong>Loja Principal</strong>`}
                                </div>
                            ` : `
                                <address class="mb-0">
                                    <div class="fw-bold mb-1"><i class="bi bi-truck me-1"></i> ENDEREÇO DE ENTREGA</div>
                                    ${enderecoRaw}
                                </address>
                            `}
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <table class="table table-sm mb-0 invoice-table" style="border: 1px solid #e2e8f0;">
                    <thead style="background-color: ${primaryBg}; color: white;">
                        <tr>
                            <th class="text-center py-2 border-0" style="width: 10%;">QTD</th>
                            <th class="py-2 border-0" style="width: 50%;">DESCRIÇÃO DO ITEM</th>
                            <th class="text-end py-2 border-0" style="width: 20%;">PREÇO UNIT.</th>
                            <th class="text-end py-2 border-0" style="width: 20%;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedido.itens.map((item: any) => {
                            let comps = [];
                            try { comps = typeof item.complementos === 'string' ? JSON.parse(item.complementos) : (item.complementos || []); } catch(e){}

                            // Calcula o total dos complementos deste item
                            let totalComplementosPreco = 0;
                            comps.forEach((c: any) => {
                                const precoComp = parseFloat(c.preco_adicional ?? c.preco ?? 0);
                                const qtdComp = parseInt(c.quantidade || 1, 10);
                                totalComplementosPreco += (precoComp * qtdComp);
                            });

                            const precoUnitarioBase = parseFloat(item.preco_unitario || item.preco || 0);
                            const precoUnitarioFinal = precoUnitarioBase + totalComplementosPreco;
                            const valorTotalItem = Number(item.quantidade) * precoUnitarioFinal;

                            return `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td class="text-center align-middle fw-bold py-2">${item.quantidade}</td>
                                <td class="align-middle py-2">
                                    <div class="d-flex align-items-center gap-3">
                                        ${item.imagem_url ? `
                                            <img src="${item.imagem_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;" />
                                        ` : `
                                            <div style="width: 40px; height: 40px; background-color: #f1f5f9; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0;">
                                                <i class="bi bi-image text-muted"></i>
                                            </div>
                                        `}
                                        <div>
                                          <span class="fw-medium d-block">${item.nome_produto || item.nome || 'Item do Pedido'}</span>
                                          
                                          <!-- 🟢 MÁGICA DOS COMPLEMENTOS NO A4 COM PREÇOS -->
                                          ${(() => {
                                              let compsHtml = '';
                                              if(item.cor) compsHtml += `<span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">Cor: ${item.cor}</span>`;
                                              if(item.tamanho) compsHtml += `<span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">Tam: ${item.tamanho}</span>`;
                                              
                                              comps.forEach((c: any) => {
                                                  const precoComp = parseFloat(c.preco_adicional ?? c.preco ?? 0);
                                                  const nomeComp = c.nome || c.produto_add?.nome || 'Adicional';
                                                  const precoFormatado = precoComp > 0 ? ` (${formatarPreco(precoComp)})` : '';
                                                  compsHtml += `<span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">+ ${c.quantidade}x ${nomeComp}${precoFormatado}</span>`;
                                              });
                                              
                                              if(item.observacao) compsHtml += `<span style="font-size: 11px; color: #ef4444; font-weight: 500; display: block; margin-top: 4px;">Obs: ${item.observacao}</span>`;
                                              
                                              return compsHtml;
                                          })()}
                                        </div>
                                    </div>
                                </td>
                                <td class="text-end align-middle py-2">${formatarPreco(precoUnitarioFinal)}</td>
                                <td class="text-end align-middle fw-bold py-2">${formatarPreco(valorTotalItem)}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="row mt-auto">
                <div class="col-7">
                    <div class="p-3 h-100 rounded" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
                        <h6 class="fw-bold text-uppercase mb-2 text-muted" style="font-size: 11px; letter-spacing: 1px;">Observações / Status de Pagamento</h6>
                        <p class="mb-1" style="font-size: 13px;"><strong>Método:</strong> ${pedido.metodo_pagamento || 'Não informado'}</p>
                        <p class="mb-1" style="font-size: 13px;">
                            <strong>Situação Financeira:</strong> <span class="fw-bold text-${isPago ? 'success' : isFalha ? 'danger' : 'warning'}">${pedido.status_pagamento || 'PENDENTE'}</span>
                        </p>
                        <p class="mb-1" style="font-size: 13px;">
                            <strong>Logística:</strong> ${pedido.status_entrega || 'Pendente'}
                        </p>
                        <p class="mb-0 mt-4 text-muted" style="font-size: 10px; font-style: italic;">
                            Documento emitido eletronicamente. Confirmação do pedido sujeita à aprovação de pagamento.
                        </p>
                    </div>
                </div>
                
                <div class="col-5">
                    <div class="p-3 rounded h-100 d-flex flex-column justify-content-end" style="border: 2px solid ${primaryBg}20; background-color: ${primaryBg}05;">
                        <div class="d-flex justify-content-between mb-2 pb-2 border-bottom border-dark border-opacity-10">
                            <span class="fw-bold text-muted" style="font-size: 13px;">SUBTOTAL:</span>
                            <span class="fw-medium" style="font-size: 13px;">${formatarPreco(subtotal)}</span>
                        </div>
                        
                        <div class="d-flex justify-content-between mb-2 pb-2 border-bottom border-dark border-opacity-10">
                            <span class="fw-bold text-muted text-uppercase" style="font-size: 13px;">${(isRetirada || isConsumoLocal) ? 'TAXA LOCAL:' : 'FRETE / ENVIO:'}</span>
                            <span class="fw-medium" style="font-size: 13px;">
                                ${freteCalculado === 0 ? 'Grátis' : formatarPreco(freteCalculado)}
                            </span>
                        </div>

                        <div class="d-flex justify-content-between mt-2 pt-2">
                            <span class="fw-black fs-5 text-dark">TOTAL:</span>
                            <span class="fw-black fs-5" style="color: ${primaryBg};">${formatarPreco(pedido.valor_total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-5 text-center">
                <div class="fw-black text-uppercase" style="font-size: 28px; opacity: 0.1; letter-spacing: 8px; color: ${primaryBg};">
                    MUITO OBRIGADO!
                </div>
                <div class="mt-3 pt-3 border-top d-flex justify-content-around text-white p-2 rounded-bottom" style="background-color: #1e293b; font-size: 12px;">
                    ${tenantContact?.email_contato ? `<span><i class="bi bi-envelope me-1"></i> ${tenantContact.email_contato}</span>` : ''}
                    ${tenantContact?.telefone_contato ? `<span><i class="bi bi-telephone me-1"></i> ${tenantContact.telefone_contato}</span>` : ''}
                    <span><i class="bi bi-globe me-1"></i> ${urlLojaExibicao}</span>
                </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 800); // Aguarda fontes/imagens carregarem
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlA4);
      printWindow.document.close();
    } else {
      alert('Por favor, permita pop-ups para gerar a Nota.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative">
        
        {/* Cabeçalho Fixo do Modal */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Resumo do Pedido #{pedido.id_pedido}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Realizado em {formatarData(pedido.data_criacao)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">{getStatusBadge(pedido.status_pedido)}</div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* 📱 CORPO ROLÁVEL (Design Tailwind Intacto!) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          
          <div className="sm:hidden mb-2">
             {getStatusBadge(pedido.status_pedido)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco Vendedor */}
            <div className="border border-gray-200 bg-gray-50 rounded-xl p-4">
              <div className="bg-slate-600 text-white text-[10px] font-bold px-2 py-1 uppercase rounded inline-block mb-3 tracking-wider">
                Vendedor (Loja)
              </div>
              <div className="text-gray-800 text-sm">
                <p className="font-bold text-base mb-1">{storeName}</p>
                <p className="text-gray-500">Obrigado por comprar conosco!</p>
              </div>
            </div>

            {/* Bloco Cliente / Destino */}
            <div className="border rounded-xl p-4" style={{ borderColor: `${primaryBg}30`, backgroundColor: `${primaryBg}08` }}>
              <div className="text-white text-[10px] font-bold px-2 py-1 uppercase rounded inline-block mb-3 tracking-wider" style={{ backgroundColor: primaryBg }}>
                Cliente / Destino
              </div>
              
              <div className="text-sm text-gray-800 space-y-1">
                {pedido.cliente && (
                  <>
                    <p className="font-bold text-base mb-1">{pedido.cliente.nome}</p>
                    <p><span className="font-medium text-gray-500">Doc:</span> {cpfCliente}</p>
                    <p className="mb-2"><span className="font-medium text-gray-500">Tel:</span> {telefoneCliente}</p>
                  </>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200/60 border-dashed">
                  {isConsumoLocal ? (
                      <div>
                          <div className="font-bold text-red-600 mb-1 flex items-center gap-1 text-xs uppercase tracking-wide">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                            Consumo no Local
                          </div>
                          <div className="font-bold text-gray-900">{enderecoRaw.replace('Mesa/Nome:', '').trim()}</div>
                      </div>
                  ) : isRetirada ? (
                      <div>
                          <div className="font-bold text-blue-600 mb-1 flex items-center gap-1 text-xs uppercase tracking-wide">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            Retirada na Loja
                          </div>
                          <div className="text-gray-700">O pedido será retirado no balcão.</div>
                      </div>
                  ) : (
                      <div>
                          <div className="font-bold text-gray-600 mb-1 flex items-center gap-1 text-xs uppercase tracking-wide">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            Endereço de Entrega
                          </div>
                          <div className="text-gray-700 leading-relaxed">{enderecoRaw}</div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE ITENS COM IMAGEM */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Itens do Pedido</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Qtd</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 text-right w-24 hidden sm:table-cell">Unit.</th>
                    <th className="px-4 py-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {pedido.itens?.map((item: any, idx: number) => {
                    let comps = [];
                    try { comps = typeof item.complementos === 'string' ? JSON.parse(item.complementos) : (item.complementos || []); } catch(e){}

                    // 🟢 Calcula o total dos complementos deste item específico
                    let totalComplementosPreco = 0;
                    comps.forEach((c: any) => {
                      const precoComp = parseFloat(c.preco_adicional ?? c.preco ?? 0);
                      const qtdComp = parseInt(c.quantidade || 1, 10);
                      totalComplementosPreco += (precoComp * qtdComp);
                    });

                    // Preço base salvo no banco + o total dos complementos
                    const precoUnitarioBase = parseFloat(item.preco_unitario || item.preco || 0);
                    const precoUnitarioFinal = precoUnitarioBase + totalComplementosPreco;
                    const valorTotalItem = Number(item.quantidade) * precoUnitarioFinal;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-center font-bold text-gray-700">{item.quantidade}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {item.imagem_url ? (
                              <img src={item.imagem_url} alt={item.nome_produto} className="w-10 h-10 object-cover rounded border border-gray-100 mt-1" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center mt-1">
                                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">{item.nome_produto || item.nome}</span>
                              
                              {/* 🟢 Renderiza os Adicionais com os respectivos preços ao lado */}
                              {(item.cor || item.tamanho || comps.length > 0 || item.observacao) && (
                                <div className="flex flex-col gap-0.5 mt-1">
                                  {item.cor && <span className="text-xs text-gray-500">Cor: {item.cor}</span>}
                                  {item.tamanho && <span className="text-xs text-gray-500">Tam: {item.tamanho}</span>}
                                  {comps.map((c: any, i: number) => {
                                    const precoComp = parseFloat(c.preco_adicional ?? c.preco ?? 0);
                                    const nomeComp = c.nome || c.produto_add?.nome || 'Adicional';
                                    const precoFormatado = precoComp > 0 ? ` (${formatarPreco(precoComp)})` : '';
                                    return (
                                      <span key={i} className="text-[11px] text-gray-500 font-medium">
                                        + {c.quantidade}x {nomeComp}{precoFormatado}
                                      </span>
                                  );
                                })}
                                {item.observacao && <span className="text-xs text-red-500 font-bold mt-0.5">Obs: {item.observacao}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">{formatarPreco(precoUnitarioFinal)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatarPreco(valorTotalItem)}</td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>

          {/* TOTAIS E INFORMAÇÕES DE PAGAMENTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-center">
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Informações de Pagamento</p>
               <p className="text-sm text-gray-800 mb-1"><span className="font-medium text-gray-500">Método:</span> {pedido.metodo_pagamento || 'N/A'}</p>
               <p className="text-sm text-gray-800"><span className="font-medium text-gray-500">Gateway:</span> {pedido.gateway_provider || 'N/A'}</p>
            </div>

            <div className="rounded-xl p-4 border flex flex-col justify-center" style={{ borderColor: `${primaryBg}30`, backgroundColor: `${primaryBg}05` }}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-800">{formatarPreco(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 border-b border-gray-200/60 pb-2">
                  <span>{(isRetirada || isConsumoLocal) ? 'Taxa Local:' : 'Frete:'}</span>
                  <span className="font-medium text-gray-800">{freteCalculado === 0 ? 'Grátis' : formatarPreco(freteCalculado)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-black text-gray-900 text-base">TOTAL:</span>
                  <span className="font-black text-lg" style={{ color: primaryBg }}>{formatarPreco(pedido.valor_total)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 🟢 Rodapé Fixo com o Botão de Imprimir A4 Oficial */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white rounded-b-2xl shrink-0 flex flex-col sm:flex-row justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <button 
             onClick={handlePrintA4}
             className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 border-0 rounded-xl font-bold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
             style={{ backgroundColor: primaryBg }}
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Imprimir Pedido
           </button>
           <button 
             onClick={onClose}
             className="w-full sm:w-auto px-8 py-2.5 bg-gray-100 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
           >
             Fechar
           </button>
        </div>
        
      </div>
    </div>
  );
};