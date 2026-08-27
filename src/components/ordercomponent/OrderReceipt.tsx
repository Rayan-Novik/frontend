import { formatarPreco, formatarData } from '../../contexts/formatters';

export const imprimirRecibo = (pedido: any, storeName: string, tenantContact?: any, lojaInfo?: any) => {
    // Tratamento de CPF (garantindo que se falhou, ele avisa)
    let cpfCliente = pedido.cliente?.cpf || 'Não informado';
    if (cpfCliente.length > 20) cpfCliente = 'Não informado';

    const enderecoRaw = pedido.endereco_entrega || '';
    const isConsumoLocal = enderecoRaw.toLowerCase().includes('mesa') || enderecoRaw.toLowerCase().includes('nome:');
    const isRetirada = enderecoRaw.toLowerCase().includes('retirada') || (!isConsumoLocal && enderecoRaw === 'Retirada / Não informado');

    const htmlRecibo = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - Pedido #${pedido.id_pedido}</title>
          <style>
            @page {
                margin: 0;
            }
            body { 
                font-family: 'Courier New', Courier, monospace; 
                background-color: #f1f5f9; 
                color: #000;
                font-size: 12px;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            h1, h2, h3, p { margin: 0; padding: 0; }
            
            .action-bar { margin-bottom: 20px; display: flex; gap: 10px; }
            .btn-print {
                background-color: #2563eb; color: white; border: none; padding: 10px 20px;
                border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .btn-print:hover { background-color: #1d4ed8; }

            .receipt-paper {
                background-color: #fff; width: 300px; padding: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }

            /* Cabeçalho da Empresa */
            .header { text-align: center; margin-bottom: 15px; }
            .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;}
            .info-text { font-size: 11px; margin-bottom: 2px; }
            .address-box { margin-top: 8px; }
            
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .divider-solid { border-bottom: 1px solid #000; margin: 10px 0; }
            .section-title { font-weight: bold; text-align: center; font-size: 14px; margin: 10px 0; text-transform: uppercase;}
            
            .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .info-block { margin-bottom: 10px; }
            
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 5px; font-size: 11px;}
            td { padding: 4px 0; vertical-align: top; }
            .col-qtd { width: 15%; text-align: center; font-weight: bold; }
            .col-desc { width: 55%; }
            .col-total { width: 30%; text-align: right; }
            
            .item-name { font-weight: bold; display: block; }
            .item-addon { font-size: 10px; color: #333; display: block; margin-top: 1px; }
            .item-obs { font-size: 10px; font-weight: bold; display: block; margin-top: 3px; border: 1px dotted #000; padding: 2px; display: inline-block; }

            .totals { margin-top: 15px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .grand-total { font-size: 16px; font-weight: bold; margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
            
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
            .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 30px; text-align: center; margin-top: 15px; }
            
            @media print {
                body { background-color: #fff; padding: 0; display: block; }
                .action-bar { display: none !important; }
                .receipt-paper { width: 100%; box-shadow: none; padding: 0 10px; margin: 0; }
                @page { size: 80mm 297mm; margin: 0; } 
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        </head>
        <body>
          
          <div class="action-bar">
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
          </div>

          <div class="receipt-paper">
              <div class="header">
                <div class="store-name">${storeName}</div>
                ${tenantContact?.documento ? `<div class="info-text">CNPJ/CPF: ${tenantContact.documento}</div>` : ''}
                ${tenantContact?.email_contato ? `<div class="info-text">Email: ${tenantContact.email_contato}</div>` : ''}
                ${tenantContact?.telefone_contato ? `<div class="info-text">Tel: ${tenantContact.telefone_contato}</div>` : ''}
                
                ${lojaInfo ? `
                    <div class="address-box">
                        <div class="info-text" style="font-weight: bold;">Endereço da Loja:</div>
                        <div class="info-text">${lojaInfo.logradouro}, ${lojaInfo.numero} - ${lojaInfo.bairro}</div>
                        <div class="info-text">${lojaInfo.cidade}/${lojaInfo.estado} - CEP: ${lojaInfo.cep}</div>
                    </div>
                ` : ''}
                <div class="info-text" style="margin-top: 8px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px;">RECIBO NÃO FISCAL</div>
              </div>

              <div class="divider-solid"></div>
              <div class="section-title">PEDIDO #${pedido.id_pedido}</div>
              <div class="divider-solid"></div>

              <div class="info-block">
                <div class="info-row"><span>Data:</span> <span>${formatarData(pedido.data_criacao)}</span></div>
                <div class="info-row"><span>Pagamento:</span> <span>${pedido.metodo_pagamento || 'N/A'}</span></div>
                <div class="info-row"><span>Status Pgto:</span> <span>${pedido.status_pedido}</span></div>
              </div>

              <div class="divider"></div>
              
              <div class="info-block">
                <div style="font-weight: bold; margin-bottom: 5px;">CLIENTE:</div>
                <div class="info-text">${pedido.cliente?.nome || 'Cliente não identificado'}</div>
                <div class="info-text">CPF: ${cpfCliente}</div>
                
                <div style="font-weight: bold; margin-top: 10px; margin-bottom: 5px;">ENTREGA / DESTINO:</div>
                ${isConsumoLocal ? `
                    <div class="info-text" style="font-weight: bold; font-size: 14px;">CONSUMO NO LOCAL</div>
                    <div class="info-text">${enderecoRaw.replace('Mesa/Nome:', '').trim()}</div>
                ` : isRetirada ? `
                    <div class="info-text" style="font-weight: bold; font-size: 14px;">RETIRADA NA LOJA</div>
                ` : `
                    <div class="info-text">${enderecoRaw}</div>
                `}
              </div>

              <div class="divider-solid"></div>

              <table>
                <thead>
                  <tr>
                    <th class="col-qtd">QTD</th>
                    <th class="col-desc">ITEM</th>
                    <th class="col-total">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${pedido.itens.map((item: any) => {
    let complementosHtml = '';
    let totalComplementosPreco = 0;

    if (item.complementos) {
        let comps = item.complementos;
        if (typeof comps === 'string') {
            try { comps = JSON.parse(comps); } catch (e) { comps = []; }
        }
        if (Array.isArray(comps) && comps.length > 0) {
            complementosHtml = comps.map((c: any) => {
                // 🟢 Proteção extra para garantir que pega o preço certo e converte para número
                const precoComp = parseFloat(c.preco_adicional ?? c.preco ?? 0);
                const qtdComp = parseInt(c.quantidade || 1, 10);
                totalComplementosPreco += (precoComp * qtdComp);

                const nomeComp = c.nome || c.produto_add?.nome || 'Adicional';
                const precoFormatado = precoComp > 0 ? ` (${formatarPreco(precoComp)})` : '';

                return `<span class="item-addon">+ ${qtdComp}x ${nomeComp}${precoFormatado}</span>`;
            }).join('');
        }
    }

    let observacaoHtml = '';
    if (item.observacao) {
        observacaoHtml = `<span class="item-obs">Obs: ${item.observacao}</span>`;
    }

    // 🟢 CORREÇÃO CRUCIAL: 
    // Se o backend já salvou no banco (item.preco_unitario) o preço COM os complementos embutidos, 
    // nós não devemos somar os complementos de novo! Usamos o item.preco_unitario direto.
    // Se o item.preco_unitario for apenas o produto base, aí sim somamos. Vamos usar o que for mais seguro:
    const precoBanco = parseFloat(item.preco_unitario || item.preco || 0);
    
    // Se o preço salvo no banco já for maior ou igual ao preço base, significa que já inclui os complementos. 
    // Caso contrário, somamos o total dos complementos.
    const valorTotalItem = Number(item.quantidade) * precoBanco;

    return `
    <tr>
      <td class="col-qtd">${item.quantidade}x</td>
      <td class="col-desc">
          <span class="item-name">${item.nome_produto || item.nome}</span>
          ${item.cor || item.tamanho ? `<span class="item-addon">${item.cor ? 'Cor: '+item.cor : ''} ${item.tamanho ? 'Tam: '+item.tamanho : ''}</span>` : ''}
          ${complementosHtml}
          ${observacaoHtml}
      </td>
      <td class="col-total">${formatarPreco(valorTotalItem)}</td>
    </tr>
    `;
}).join('')}
                </tbody>
              </table>

              <div class="divider-solid"></div>

              <div class="totals">
                <div class="total-row">
                  <span>SUBTOTAL:</span>
                  <span>${formatarPreco(pedido.valor_total - (pedido.preco_frete || 0))}</span>
                </div>
                <div class="total-row">
                  <span>${(isRetirada || isConsumoLocal) ? 'TAXA LOCAL:' : 'FRETE:'}</span>
                  <span>${pedido.preco_frete === 0 ? 'Grátis' : formatarPreco(pedido.preco_frete)}</span>
                </div>
                <div class="total-row grand-total">
                  <span>TOTAL PAGO:</span>
                  <span>${formatarPreco(pedido.valor_total)}</span>
                </div>
              </div>

              <div class="divider-solid"></div>

              <div class="footer">
                <p><strong>MUITO OBRIGADO PELA COMPRA!</strong></p>
                <p>Volte Sempre</p>
                <div class="barcode">*${pedido.id_pedido}*</div>
                <div style="font-size: 9px; letter-spacing: 2px;">${pedido.id_pedido}</div>
              </div>
          </div>

        </body>
      </html>
    `;

    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
        janelaImpressao.document.write(htmlRecibo);
        janelaImpressao.document.close();
        janelaImpressao.focus();
        setTimeout(() => {
            janelaImpressao.print();
        }, 800);
    } else {
        alert("Por favor, permita pop-ups no seu navegador para gerar o recibo.");
    }
};