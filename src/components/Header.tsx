import { useStoreConfig } from '../contexts/StoreConfigContext';

// HEADERS
import { HeaderEcommerce } from './layout/Headers/HeaderEcommerce';
import { HeaderCardapio } from './layout/Headers/HeaderCardapio';
import { HeaderMercadinho } from './layout/Headers/HeaderMercadinho';
import { HeaderAgendamento } from './layout/Headers/HeaderAgendamento';

export const Header = () => {

    const { appearance } = useStoreConfig();

    switch (appearance?.STORE_LAYOUT_STYLE) {

        case 'CARDAPIO':
            return <HeaderCardapio />;

        case 'MERCADINHO':
            return <HeaderMercadinho />;

        case 'AGENDAMENTO':
            return <HeaderAgendamento appearance={appearance} />;

        case 'ECOMMERCE':
        default:
            return <HeaderEcommerce />;
    }

};