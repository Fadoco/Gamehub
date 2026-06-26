/**
 * GameHub - Tutorial interativo por página
 */
(function initSiteTutorialModule() {
    if (window.siteTutorialLoaded) return;
    window.siteTutorialLoaded = true;

    const NEVER_SHOW_PREFIX = 'gh_site_tutorial_never_show_v3';
    const PROMPTED_SESSION_PREFIX = 'gh_site_tutorial_prompted_session_v3';

    const createStep = (title, text, selector, extras = {}) => ({
        title,
        text,
        selector,
        eyebrow: extras.eyebrow || 'Guia do site',
        icon: extras.icon || 'fas fa-circle-info',
        chips: extras.chips || [],
        bullets: extras.bullets || [],
        fallbackSelectors: extras.fallbackSelectors || []
    });

    const TUTORIALS = {
        index: {
            autoPromptDelay: 900,
            promptTitle: 'Quer um tour bem guiado pela GameHub?',
            promptText: 'Vou mostrar as áreas principais da loja, destacando a tela certa em cada passo e explicando o que você pode fazer ali.',
            helperLabel: 'Ajuda',
            floatingHelper: true,
            steps: [
                createStep(
                    'Navegação principal',
                    'Esse menu leva você para as áreas mais importantes do site sem precisar procurar links espalhados.',
                    '.topbar__menu',
                    {
                        eyebrow: 'Mapa da loja',
                        icon: 'fas fa-compass',
                        chips: ['Biblioteca', 'Roleta', 'Carrinho', 'Perfil'],
                        bullets: [
                            'Biblioteca: veja os jogos que já são seus.',
                            'Roleta: descubra recompensas e eventos.',
                            'Carrinho, revenda e perfil ficam a um clique de distância.'
                        ]
                    }
                ),
                createStep(
                    'Busca e descoberta',
                    'Aqui você pesquisa jogos e também pode usar o botão aleatório para achar novidades.',
                    '.main-header',
                    {
                        eyebrow: 'Explorando jogos',
                        icon: 'fas fa-magnifying-glass',
                        chips: ['Pesquisar', 'Aleatório', 'Atalho rápido'],
                        bullets: [
                            'A barra filtra a loja em tempo real.',
                            'O botão aleatório ajuda a descobrir jogos novos.',
                            'Se você estiver perdido, esse bloco é o melhor ponto de partida.'
                        ]
                    }
                ),
                createStep(
                    'Destaque principal',
                    'Essa área mostra o jogo em destaque, o preço, a descrição curta e os botões de ação.',
                    '.hero-section',
                    {
                        eyebrow: 'O que vale ver primeiro',
                        icon: 'fas fa-star',
                        chips: ['Comprar', 'Carrinho', 'Favoritar', 'Preço'],
                        bullets: [
                            'Comprar agora leva direto para a compra.',
                            'O carrinho guarda o jogo para depois.',
                            'O preço atual e o preço antigo ajudam a comparar a oferta.'
                        ]
                    }
                ),
                createStep(
                    'Sua conta e saldo',
                    'No topo ficam sua carteira, notificações, perfil e o botão de entrar.',
                    '.topbar__actions',
                    {
                        eyebrow: 'Painel do usuário',
                        icon: 'fas fa-user-shield',
                        chips: ['Saldo', 'Notificações', 'Perfil'],
                        bullets: [
                            'A carteira mostra o saldo disponível.',
                            'As notificações avisam pedidos e eventos.',
                            'O perfil concentra as ações da sua conta e o acesso ao histórico.'
                        ]
                    }
                ),
                createStep(
                    'Promoções e rankings',
                    'Aqui você encontra ofertas, categorias e listas com o que está em alta.',
                    '.promo-section',
                    {
                        eyebrow: 'Descobrindo ofertas',
                        icon: 'fas fa-tags',
                        chips: ['Ofertas', 'Categorias', 'Destaques', 'Banners'],
                        bullets: [
                            'As promoções mostram jogos com desconto.',
                            'As categorias ajudam a filtrar por estilo.',
                            'Os rankings mostram o que está mais forte na loja agora.'
                        ]
                    }
                ),
                createStep(
                    'Rodapé e ajuda',
                    'No rodapé ficam atalhos de suporte, privacidade e o botão para reabrir este tutorial.',
                    '.main-footer',
                    {
                        eyebrow: 'Suporte rápido',
                        icon: 'fas fa-circle-question',
                        chips: ['Ajuda', 'Suporte', 'Reabrir'],
                        bullets: [
                            'Você pode abrir o tour de novo quando quiser.',
                            'Os atalhos do rodapé ajudam na navegação.',
                            'É a área final da loja, com links úteis.'
                        ]
                    }
                )
            ]
        },
        biblioteca: {
            promptTitle: 'Quer ver como funciona a sua Biblioteca?',
            promptText: 'Vou mostrar onde ficam seus jogos, como reconhecer o que já é seu e onde abrir a ajuda novamente.',
            steps: [
                createStep('Título da biblioteca', 'Aqui você vê quantos jogos já estão na sua conta.', '.section-title', {
                    eyebrow: 'Seu acervo',
                    icon: 'fas fa-gamepad',
                    chips: ['Jogos seus', 'Contador', 'Organização']
                }),
                createStep('Lista de jogos', 'Essa área exibe os cards da sua biblioteca para abrir ou consultar.', 'main', {
                    eyebrow: 'Seus jogos',
                    icon: 'fas fa-grid-2',
                    chips: ['Abrir', 'Explorar', 'Organizar', 'Cards'],
                    fallbackSelectors: ['.game-grid', '.library-grid']
                }),
                createStep('Ações dos cards', 'Cada card normalmente leva para detalhes, abrir o jogo ou outras ações rápidas.', '.game-card', {
                    eyebrow: 'O que fazer em cada card',
                    icon: 'fas fa-arrow-pointer',
                    fallbackSelectors: ['.library-game-card', '.game-card']
                }),
                createStep('Rodapé', 'Os atalhos do rodapé ajudam a voltar para a loja e pedir ajuda.', '.main-footer', {
                    eyebrow: 'Saída da página',
                    icon: 'fas fa-circle-question'
                })
            ]
        },
        carrinho: {
            promptTitle: 'Vamos olhar o Carrinho?',
            promptText: 'Vou mostrar onde ficam os itens guardados, como conferir o total e onde finalizar a compra.',
            steps: [
                createStep('Carrinho', 'Aqui você vê o que guardou antes de concluir a compra.', 'main', {
                    eyebrow: 'Compras pendentes',
                    icon: 'fas fa-cart-shopping',
                    chips: ['Itens guardados', 'Total', 'Finalizar', 'Cupom']
                }),
                createStep('Resumo e ações', 'Nesta área ficam o resumo do valor e os botões para fechar o pedido.', '.cart-summary', {
                    eyebrow: 'Fechando a compra',
                    icon: 'fas fa-receipt',
                    fallbackSelectors: ['.order-summary', '.checkout-panel']
                }),
                createStep('Itens no carrinho', 'Aqui você costuma revisar quantidades, remover jogos ou seguir para checkout.', '.cart-item', {
                    eyebrow: 'Revisão antes de pagar',
                    icon: 'fas fa-box',
                    fallbackSelectors: ['.cart-list', '.cart-products']
                }),
                createStep('Rodapé', 'Se precisar, o rodapé leva você de volta à loja e à ajuda.', '.main-footer', {
                    eyebrow: 'Ajuda rápida',
                    icon: 'fas fa-circle-question'
                })
            ]
        },
        historico: {
            promptTitle: 'Quer entender o Histórico de Compras?',
            promptText: 'Vou mostrar onde ver o que você já comprou e por que alguns dados podem demorar um pouco.',
            steps: [
                createStep('Histórico', 'Essa página reúne suas compras e movimentações mais recentes.', 'main', {
                    eyebrow: 'Seu registro',
                    icon: 'fas fa-clock-rotate-left',
                    chips: ['Compras', 'Atualização em lote', 'Consulta']
                }),
                createStep('Aviso de sincronização', 'Algumas informações podem aparecer com atraso porque o site otimiza gravações.', '.sync-notice', {
                    eyebrow: 'Atualização em lote',
                    icon: 'fas fa-triangle-exclamation',
                    fallbackSelectors: ['.history-sync-warning', '.alert']
                }),
                createStep('Rodapé', 'Use o rodapé para voltar ou abrir a ajuda novamente.', '.main-footer', {
                    eyebrow: 'Ajuda rápida',
                    icon: 'fas fa-circle-question'
                })
            ]
        },
        emprestimo: {
            promptTitle: 'Vamos entender os Empréstimos?',
            promptText: 'Vou mostrar como pedir, pagar e acompanhar sua dívida nesta central com calma.',
            steps: [
                createStep('Central de empréstimos', 'Aqui você encontra um resumo da sua situação financeira na plataforma.', '.loan-page-hero', {
                    eyebrow: 'Resumo financeiro',
                    icon: 'fas fa-hand-holding-dollar'
                }),
                createStep('Solicitar e acompanhar', 'Nesta área você pede empréstimo e vê a situação atual.', '.loan-page-grid', {
                    eyebrow: 'Operações principais',
                    icon: 'fas fa-credit-card',
                    chips: ['Solicitar', 'Saldo', 'Dívida', 'Limites']
                }),
                createStep('Pagar com jogos', 'Se quiser, você pode quitar parte da dívida com jogos.', '.loan-games-panel', {
                    eyebrow: 'Quitar com biblioteca',
                    icon: 'fas fa-gamepad'
                }),
                createStep('Pagar com dinheiro', 'Se preferir, você também pode usar saldo para reduzir a dívida mais rápido.', '.loan-page-grid', {
                    eyebrow: 'Pagamento alternativo',
                    icon: 'fas fa-wallet',
                    fallbackSelectors: ['.loan-pay-money', '.loan-summary']
                }),
                createStep('Saída extrema', 'Se aparecer, esse painel explica a saída emergencial quando a dívida estoura.', '.loan-emergency-panel', {
                    eyebrow: 'Plano de emergência',
                    icon: 'fas fa-triangle-exclamation',
                    fallbackSelectors: ['.loan-summary', '.loan-page-grid']
                })
            ]
        },
        ranking: {
            promptTitle: 'Quer entender o Ranking?',
            promptText: 'Essa página mostra quem mais acumulou riqueza e quem está no topo.',
            steps: [
                createStep('Ranking', 'Aqui você acompanha os usuários mais fortes da plataforma.', 'main', {
                    eyebrow: 'Disputa de riqueza',
                    icon: 'fas fa-trophy',
                    chips: ['Top usuários', 'Posição', 'Saldo']
                }),
                createStep('Tabela principal', 'O quadro central mostra a classificação e os valores.', '.ranking-table', {
                    eyebrow: 'Lista principal',
                    icon: 'fas fa-ranking-star',
                    fallbackSelectors: ['table', '.leaderboard']
                }),
                createStep('Rodapé', 'O rodapé te leva de volta e abre a ajuda quando precisar.', '.main-footer', {
                    eyebrow: 'Ajuda rápida',
                    icon: 'fas fa-circle-question'
                })
            ]
        },
        reseller: {
            promptTitle: 'Revenda de Jogos: quer ver como funciona?',
            promptText: 'Vou te mostrar a área de jogos disponíveis e o resumo da revenda.',
            steps: [
                createStep('Revenda', 'Essa página organiza os jogos que você pode revender.', '.reseller-hero', {
                    eyebrow: 'Mercado de revenda',
                    icon: 'fas fa-tags'
                }),
                createStep('Jogos disponíveis', 'Aqui ficam os itens que podem entrar na revenda.', '.reseller-section', {
                    eyebrow: 'Catálogo pessoal',
                    icon: 'fas fa-box-open'
                }),
                createStep('Resumo da operação', 'Quando houver jogos selecionados, este bloco mostra o resumo da revenda.', '.reseller-summary', {
                    eyebrow: 'Fechando a operação',
                    icon: 'fas fa-receipt'
                })
            ]
        },
        busca: {
            promptTitle: 'Entendendo os resultados da busca',
            promptText: 'Vou mostrar o filtro e a área que exibe os jogos encontrados.',
            steps: [
                createStep('Busca', 'Essa tela mostra o que você pesquisou na loja.', 'main', {
                    eyebrow: 'Resultados filtrados',
                    icon: 'fas fa-magnifying-glass',
                    chips: ['Filtro', 'Resultados', 'Relevância']
                }),
                createStep('Consulta atual', 'O termo buscado aparece aqui para você não se perder.', '#search-query-text', {
                    eyebrow: 'Termo pesquisado',
                    icon: 'fas fa-bullseye',
                    fallbackSelectors: ['h2', '.section-title']
                }),
                createStep('Lista de resultados', 'Os cards abaixo são os jogos encontrados para o termo pesquisado.', '.game-grid', {
                    eyebrow: 'Jogos encontrados',
                    icon: 'fas fa-layer-group'
                })
            ]
        },
        'lista-jogos': {
            promptTitle: 'Quer explorar o catálogo completo?',
            promptText: 'Vou mostrar o filtro, a contagem de jogos e os cards do catálogo.',
            steps: [
                createStep('Catálogo completo', 'Aqui você navega por todos os jogos disponíveis.', 'main', {
                    eyebrow: 'Explorar catálogo',
                    icon: 'fas fa-gamepad',
                    chips: ['Todos os jogos', 'Filtros', 'Cards']
                }),
                createStep('Contador de jogos', 'O número ao lado do título indica quantos jogos existem no catálogo.', '#games-count', {
                    eyebrow: 'Tamanho da loja',
                    icon: 'fas fa-hashtag',
                    fallbackSelectors: ['.count-badge']
                }),
                createStep('Grid principal', 'Os cards abaixo são os jogos que você pode abrir, comprar ou consultar.', '.game-grid', {
                    eyebrow: 'Lista visual',
                    icon: 'fas fa-th-large'
                })
            ]
        },
        jogo: {
            promptTitle: 'Detalhes do jogo: quer saber onde olhar?',
            promptText: 'Vou destacar a descrição, os botões e as informações principais do jogo.',
            steps: [
                createStep('Nome do jogo', 'Esse é o título principal da página de detalhes.', '#game-title-detail', {
                    eyebrow: 'Cabeçalho do jogo',
                    icon: 'fas fa-heading',
                    fallbackSelectors: ['h1']
                }),
                createStep('Sobre este jogo', 'Aqui ficam a descrição, os dados e os detalhes do conteúdo.', 'main', {
                    eyebrow: 'Informações do jogo',
                    icon: 'fas fa-info-circle',
                    chips: ['Descrição', 'Preço', 'Compra']
                }),
                createStep('Rodapé', 'Se precisar sair ou voltar, o rodapé ajuda nisso.', '.main-footer', {
                    eyebrow: 'Ajuda rápida',
                    icon: 'fas fa-circle-question'
                })
            ]
        },
        perfil: {
            promptTitle: 'Vamos ver o Perfil?',
            promptText: 'Aqui você ajusta seus dados, entra na conta ou cria uma nova.',
            steps: [
                createStep('Perfil', 'Essa página reúne os dados do usuário e as opções de conta.', 'main', {
                    eyebrow: 'Sua identidade',
                    icon: 'fas fa-user',
                    chips: ['Editar perfil', 'Entrar', 'Criar conta']
                }),
                createStep('Editar dados', 'Se estiver logado, esta área serve para personalizar nome, avatar e outras informações.', '.profile-card', {
                    eyebrow: 'Personalização',
                    icon: 'fas fa-pen-to-square',
                    fallbackSelectors: ['.profile-section']
                }),
                createStep('Login e cadastro', 'Quando você não está logado, essas áreas aparecem para entrar ou criar conta.', '.auth-card', {
                    eyebrow: 'Acesso à conta',
                    icon: 'fas fa-right-to-bracket',
                    fallbackSelectors: ['form', '.login-card']
                })
            ]
        },
        admin: {
            promptTitle: 'Painel Admin: quer saber o que faz cada bloco?',
            promptText: 'Vou mostrar onde adiciona jogos, ajusta saldo e gerencia usuários.',
            steps: [
                createStep('Adicionar jogo', 'Esse formulário cadastra ou edita jogos do catálogo.', '#admin-game-form', {
                    eyebrow: 'Catálogo',
                    icon: 'fas fa-plus',
                    chips: ['Criar', 'Editar', 'Salvar']
                }),
                createStep('Carteira do usuário', 'Aqui você envia saldo manualmente para um UID.', '#add-balance-form', {
                    eyebrow: 'Saldo administrativo',
                    icon: 'fas fa-wallet'
                }),
                createStep('Usuários registrados', 'Essa lista mostra os perfis cadastrados e permite buscar rapidamente.', '.user-list-container', {
                    eyebrow: 'Gerenciamento de usuários',
                    icon: 'fas fa-users'
                }),
                createStep('Catálogo e eventos', 'Os painéis restantes ajudam no controle de jogos e eventos especiais.', '#admin-table', {
                    eyebrow: 'Ferramentas extras',
                    icon: 'fas fa-table',
                    fallbackSelectors: ['.admin-grid', '.admin-card']
                })
            ]
        },
        'admin-user-detail': {
            promptTitle: 'Detalhe do usuário: o que você encontra aqui?',
            promptText: 'Vou mostrar onde mexer na carteira, biblioteca e histórico desse usuário.',
            steps: [
                createStep('Cabeçalho do usuário', 'Aqui você confirma quem está sendo administrado.', '#target-user-header', {
                    eyebrow: 'Usuário alvo',
                    icon: 'fas fa-id-card'
                }),
                createStep('Carteira', 'Esse bloco altera saldo e movimentos financeiros desse perfil.', '.admin-card', {
                    eyebrow: 'Carteira e ações',
                    icon: 'fas fa-wallet',
                    fallbackSelectors: ['#wallet-panel', '.admin-grid']
                }),
                createStep('Biblioteca e histórico', 'Essas áreas mostram os jogos e as transações do usuário.', 'main', {
                    eyebrow: 'Dados do usuário',
                    icon: 'fas fa-clock-rotate-left'
                })
            ]
        },
        'admin-event-roulette': {
            promptTitle: 'Roleta de eventos: quer entender o painel?',
            promptText: 'Esse painel serve para escolher pessoas, quantidade e disparar eventos ao vivo.',
            steps: [
                createStep('Ranking inicial', 'Aqui você vê os usuários em destaque antes de aplicar eventos.', 'main', {
                    eyebrow: 'Base da roleta',
                    icon: 'fas fa-ranking-star'
                }),
                createStep('Roleta de eventos', 'Esse bloco central controla o giro e os efeitos da apresentação.', '.roulette-wheel', {
                    eyebrow: 'Controle ao vivo',
                    icon: 'fas fa-dice',
                    fallbackSelectors: ['.roulette', '.event-roulette']
                }),
                createStep('Seleção de pessoas', 'Nesta área você escolhe quem participa do evento.', '.people-selection', {
                    eyebrow: 'Alvos do evento',
                    icon: 'fas fa-user-group',
                    fallbackSelectors: ['.selection-panel', '.admin-card']
                }),
                createStep('Status', 'O painel de status mostra o progresso e o resultado da ação.', '.status-panel', {
                    eyebrow: 'Andamento',
                    icon: 'fas fa-signal',
                    fallbackSelectors: ['.status', '.admin-card']
                })
            ]
        },
        roleta: {
            promptTitle: 'Roleta e caixas: quer ver como funciona?',
            promptText: 'Vou destacar a roleta, as caixas e o espaço onde os resultados aparecem.',
            steps: [
                createStep('Roleta da sorte', 'Esse é o painel principal para girar e tentar ganhar recompensas.', '.rewards-section', {
                    eyebrow: 'Área principal',
                    icon: 'fas fa-dice',
                    chips: ['Girar', 'Prêmios', 'Caixas']
                }),
                createStep('Caixas misteriosas', 'Aqui ficam as caixas e recompensas especiais da página.', 'main', {
                    eyebrow: 'Recompensas extras',
                    icon: 'fas fa-box-open',
                    fallbackSelectors: ['.special-roulette-wrapper', '.box-card']
                }),
                createStep('Resultados', 'Os modais aparecem aqui quando algo é revelado.', '#reveal-result-title', {
                    eyebrow: 'Resultado',
                    icon: 'fas fa-trophy',
                    fallbackSelectors: ['.modal', '.result-card']
                })
            ]
        },
        'mercado-negro': {
            promptTitle: 'Mercado Negro: quer saber o que ele faz?',
            promptText: 'Essa página é temporária e mostra compras especiais, timer e as áreas proibidas. Se a sessão acabar, você volta sozinho para a loja.',
            steps: [
                createStep('Aviso principal', 'O título e o aviso deixam claro que essa área é restrita.', '.warning', {
                    eyebrow: 'Acesso proibido',
                    icon: 'fas fa-skull-crossbones'
                }),
                createStep('Timer da sessão', 'Aqui você vê quanto tempo falta para voltar automaticamente para a loja.', '#market-session-timer', {
                    eyebrow: 'Sessão temporária',
                    icon: 'fas fa-hourglass-half'
                }),
                createStep('Roleta e caixas', 'Essas áreas concentram as ações secretas do mercado negro e os itens especiais.', '.market-section', {
                    eyebrow: 'Ações secretas',
                    icon: 'fas fa-bolt',
                    chips: ['Roleta', 'Caixas', 'Descontos', 'Itens raros']
                }),
                createStep('Jogos com desconto', 'Essa parte mostra jogos desviados com desconto e preços menores.', '#cheaper-games-list', {
                    eyebrow: 'Ofertas secretas',
                    icon: 'fas fa-tags',
                    fallbackSelectors: ['.market-list']
                }),
                createStep('Saída segura', 'Esse botão te devolve para a loja quando acabar a sessão.', '.btn-hack', {
                    eyebrow: 'Desconectar',
                    icon: 'fas fa-door-open',
                    fallbackSelectors: ['button']
                })
            ]
        },
        login: {
            promptTitle: 'Login: vamos entender a entrada?',
            promptText: 'Aqui você entra na conta ou cria uma nova, dependendo do que aparecer na tela.',
            steps: [
                createStep('Entrar', 'Esse bloco é onde você coloca suas credenciais para acessar a conta.', 'main', {
                    eyebrow: 'Acesso',
                    icon: 'fas fa-right-to-bracket'
                }),
                createStep('Criar conta', 'Se estiver disponível, esta área serve para novos usuários se cadastrarem.', '.register-form', {
                    eyebrow: 'Novo usuário',
                    icon: 'fas fa-user-plus',
                    fallbackSelectors: ['form']
                })
            ]
        },
        welcome: {
            promptTitle: 'Bem-vindo ao GameHub!',
            promptText: 'Essa é uma tela de boas-vindas antes de seguir para a loja principal.',
            steps: [
                createStep('Boas-vindas', 'Essa página apresenta o início da sua jornada no site.', 'main', {
                    eyebrow: 'Primeiro contato',
                    icon: 'fas fa-door-open'
                }),
                createStep('Continuar', 'Use o botão principal para entrar na loja e começar a explorar.', 'main', {
                    eyebrow: 'Próximo passo',
                    icon: 'fas fa-arrow-right'
                })
            ]
        }
    };

    const DEFAULT_TUTORIAL = {
        autoPromptDelay: 1000,
        promptTitle: 'Quer um tour rápido desta página?',
        promptText: 'Vou te mostrar as áreas principais da tela e o que cada uma faz.',
        helperLabel: 'Ajuda',
        floatingHelper: false,
        steps: [
            createStep('Cabeçalho', 'Essa faixa superior concentra a navegação e os atalhos mais importantes.', 'header.topbar', {
                eyebrow: 'Topo da página',
                icon: 'fas fa-bars'
            }),
            createStep('Área principal', 'O conteúdo mais importante da página fica nesta região central.', 'main', {
                eyebrow: 'Conteúdo principal',
                icon: 'fas fa-layer-group'
            }),
            createStep('Rodapé', 'O rodapé costuma ter suporte, atalhos e links úteis.', '.main-footer', {
                eyebrow: 'Fechamento',
                icon: 'fas fa-circle-question'
            })
        ]
    };

    let activeOverlay = null;
    let currentStepIndex = 0;
    let currentTutorial = null;
    let autoPromptTimer = null;
    let autoPromptBootstrapped = false;

    function getPageKey() {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.endsWith('/index.html') || path === '/' || path === '') return 'index';
        const parts = path.split('/').filter(Boolean);
        const file = parts.length ? parts[parts.length - 1] : 'index.html';
        return file.replace(/\.html$/, '');
    }

    function getTutorialUserToken() {
        return window.auth?.currentUser?.uid || 'guest';
    }

    function getStorageKey(prefix) {
        return `${prefix}:${getPageKey()}:${getTutorialUserToken()}`;
    }

    function getTutorialConfig() {
        return TUTORIALS[getPageKey()] || DEFAULT_TUTORIAL;
    }

    function shouldNeverShowAutomatically() {
        return localStorage.getItem(getStorageKey(NEVER_SHOW_PREFIX)) === '1';
    }

    function setNeverShowAutomatically(shouldHide) {
        const key = getStorageKey(NEVER_SHOW_PREFIX);
        if (shouldHide) localStorage.setItem(key, '1');
        else localStorage.removeItem(key);
    }

    function wasPromptedThisSession() {
        return sessionStorage.getItem(getStorageKey(PROMPTED_SESSION_PREFIX)) === '1';
    }

    function markPromptedThisSession() {
        sessionStorage.setItem(getStorageKey(PROMPTED_SESSION_PREFIX), '1');
    }

    function clearTutorialHighlight() {
        document.querySelectorAll('.tutorial-highlight-target').forEach((element) => {
            element.classList.remove('tutorial-highlight-target');
        });
    }

    function getTutorialCard() {
        return activeOverlay ? activeOverlay.querySelector('.site-tutorial-card') : null;
    }

    function closeActiveOverlay() {
        if (!activeOverlay) return;
        clearTutorialHighlight();
        activeOverlay.remove();
        activeOverlay = null;
        currentTutorial = null;
    }

    function mountOverlay(innerHtml) {
        closeActiveOverlay();
        const overlay = document.createElement('div');
        overlay.className = 'site-tutorial-overlay';
        overlay.innerHTML = innerHtml;
        document.body.appendChild(overlay);
        activeOverlay = overlay;
        return overlay;
    }

    function getTargetForStep(step) {
        const selectors = [step.selector].concat(step.fallbackSelectors || ['main', 'header.topbar', '.main-footer']);
        for (const selector of selectors) {
            if (!selector) continue;
            const target = document.querySelector(selector);
            if (target) return target;
        }
        return null;
    }

    function positionSpotlightForStep(overlay, stepIndex) {
        const step = currentTutorial?.steps?.[stepIndex];
        if (!step) return;

        const card = getTutorialCard();
        const target = getTargetForStep(step);

        if (!target) {
            return;
        }

        target.classList.add('tutorial-highlight-target');

        if (!card) return;

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const margin = 12;
        const mobile = viewportWidth <= 768;
        const targetRect = target.getBoundingClientRect();
        const preferredWidth = mobile ? Math.min(400, Math.max(280, viewportWidth - (margin * 2))) : 360;

        card.style.width = mobile ? `${Math.min(viewportWidth - (margin * 2), 400)}px` : `${preferredWidth}px`;
        card.style.maxWidth = mobile ? `${Math.min(viewportWidth - (margin * 2), 400)}px` : `${preferredWidth}px`;
        card.style.transform = 'none';
        card.style.left = '';
        card.style.top = '';
        card.style.right = '';
        card.style.bottom = '';

        const cardRect = card.getBoundingClientRect();
        const cardWidth = cardRect.width || preferredWidth;
        const cardHeight = cardRect.height || 360;

        let left = margin;
        let top = margin;

        if (mobile) {
            left = Math.max(margin, Math.min((viewportWidth - cardWidth) / 2, viewportWidth - cardWidth - margin));
            top = Math.max(margin, Math.min(targetRect.bottom + 12, viewportHeight - cardHeight - margin));
        } else {
            const spaceRight = viewportWidth - targetRect.right - margin;
            const spaceLeft = targetRect.left - margin;
            const placeRight = spaceRight >= cardWidth + 24 || spaceRight >= spaceLeft;
            const placeBelow = targetRect.bottom + cardHeight + 24 <= viewportHeight;

            if (placeRight) {
                left = Math.min(targetRect.right + 16, viewportWidth - cardWidth - margin);
                top = Math.max(margin, Math.min(targetRect.top, viewportHeight - cardHeight - margin));
            } else if (spaceLeft >= cardWidth + 24) {
                left = Math.max(margin, targetRect.left - cardWidth - 16);
                top = Math.max(margin, Math.min(targetRect.top, viewportHeight - cardHeight - margin));
            } else if (placeBelow) {
                left = Math.max(margin, Math.min(targetRect.left, viewportWidth - cardWidth - margin));
                top = Math.min(targetRect.bottom + 16, viewportHeight - cardHeight - margin);
            } else {
                left = Math.max(margin, Math.min(targetRect.left, viewportWidth - cardWidth - margin));
                top = Math.max(margin, Math.min(targetRect.top - cardHeight - 16, viewportHeight - cardHeight - margin));
            }
        }

        card.style.left = `${left}px`;
        card.style.top = `${top}px`;
    }

    function renderStep(overlay, stepIndex) {
        const step = currentTutorial?.steps?.[stepIndex];
        if (!step) return;

        currentStepIndex = stepIndex;
        clearTutorialHighlight();

        const progress = overlay.querySelector('.site-tutorial-progress');
        const title = overlay.querySelector('.site-tutorial-title');
        const text = overlay.querySelector('.site-tutorial-text');
        const eyebrow = overlay.querySelector('.site-tutorial-eyebrow');
        const visualIcon = overlay.querySelector('.site-tutorial-visual-icon i');
        const visualTitle = overlay.querySelector('.site-tutorial-visual-title');
        const visualSubtitle = overlay.querySelector('.site-tutorial-visual-subtitle');
        const chips = overlay.querySelector('.site-tutorial-chips');
        const bullets = overlay.querySelector('.site-tutorial-points');
        const prevBtn = overlay.querySelector('.site-tutorial-prev');
        const nextBtn = overlay.querySelector('.site-tutorial-next');

        if (progress) progress.textContent = `Passo ${stepIndex + 1} de ${currentTutorial.steps.length}`;
        if (eyebrow) eyebrow.textContent = step.eyebrow || 'Guia do site';
        if (title) title.textContent = step.title;
        if (text) text.textContent = step.text;
        if (visualIcon) visualIcon.className = step.icon || 'fas fa-circle-info';
        if (visualTitle) visualTitle.textContent = step.title;
        if (visualSubtitle) visualSubtitle.textContent = step.eyebrow || 'Tutorial interativo';
        if (chips) chips.innerHTML = (step.chips || []).map((chip) => `<span class="site-tutorial-chip">${chip}</span>`).join('');
        if (bullets) bullets.innerHTML = (step.bullets || []).map((bullet) => `<li>${bullet}</li>`).join('');
        if (prevBtn) prevBtn.disabled = stepIndex === 0;
        if (nextBtn) nextBtn.textContent = stepIndex === currentTutorial.steps.length - 1 ? 'Finalizar' : 'Próximo';

        const target = getTargetForStep(step);
        if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }

        window.requestAnimationFrame(() => {
            positionSpotlightForStep(overlay, stepIndex);
            window.requestAnimationFrame(() => {
                positionSpotlightForStep(overlay, stepIndex);
            });
        });
    }

    function startTour(forceManualOpen = false) {
        currentTutorial = getTutorialConfig();
        const overlay = mountOverlay(`
            <div class="site-tutorial-card" role="dialog" aria-modal="true" aria-labelledby="site-tutorial-title">
                <div class="site-tutorial-card__header">
                    <div class="site-tutorial-progress"></div>
                    <div class="site-tutorial-badge">Tour guiado</div>
                </div>
                <div class="site-tutorial-layout">
                    <aside class="site-tutorial-visual">
                        <div class="site-tutorial-visual-icon">
                            <i class="fas fa-circle-info" aria-hidden="true"></i>
                        </div>
                        <strong class="site-tutorial-visual-title"></strong>
                        <span class="site-tutorial-visual-subtitle"></span>
                        <div class="site-tutorial-chips"></div>
                    </aside>
                    <section class="site-tutorial-copy">
                        <div class="site-tutorial-eyebrow"></div>
                        <h2 id="site-tutorial-title" class="site-tutorial-title"></h2>
                        <p class="site-tutorial-text"></p>
                        <ul class="site-tutorial-points"></ul>
                        <label class="site-tutorial-never-show">
                            <input type="checkbox" id="tutorial-never-show-checkbox">
                            <span>Não mostrar automaticamente novamente</span>
                        </label>
                    </section>
                </div>
                <div class="site-tutorial-actions">
                    <button type="button" class="btn btn-ghost site-tutorial-skip">Pular tutorial</button>
                    <button type="button" class="btn btn-ghost site-tutorial-prev">Anterior</button>
                    <button type="button" class="btn btn-primary site-tutorial-next">Próximo</button>
                </div>
            </div>
        `);

        renderStep(overlay, 0);
        window.requestAnimationFrame(() => {
            positionSpotlightForStep(overlay, 0);
        });
        const neverShowCheckbox = overlay.querySelector('#tutorial-never-show-checkbox');
        const skipBtn = overlay.querySelector('.site-tutorial-skip');
        const prevBtn = overlay.querySelector('.site-tutorial-prev');
        const nextBtn = overlay.querySelector('.site-tutorial-next');

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                closeActiveOverlay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                renderStep(overlay, Math.max(0, currentStepIndex - 1));
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentStepIndex >= currentTutorial.steps.length - 1) {
                    setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                    closeActiveOverlay();
                    if (forceManualOpen && typeof window.showToast === 'function') {
                        window.showToast('Tutorial concluído! Você pode abrir de novo no rodapé.', 'success');
                    }
                    return;
                }
                renderStep(overlay, currentStepIndex + 1);
            });
        }

        return true;
    }

    function showTutorialPrompt() {
        if (activeOverlay) return;
        if (shouldNeverShowAutomatically()) return;
        if (wasPromptedThisSession()) return;

        markPromptedThisSession();
        currentTutorial = getTutorialConfig();

        const overlay = mountOverlay(`
            <div class="site-tutorial-card site-tutorial-prompt" role="dialog" aria-modal="true" aria-labelledby="site-tutorial-prompt-title">
                <div class="site-tutorial-prompt__hero">
                    <div class="site-tutorial-visual-icon">
                        <i class="fas fa-user-astronaut" aria-hidden="true"></i>
                    </div>
                    <div>
                        <div class="site-tutorial-eyebrow">Boas-vindas</div>
                        <h2 id="site-tutorial-prompt-title" class="site-tutorial-title">${currentTutorial.promptTitle || 'Quer um tour rápido?'}</h2>
                    </div>
                </div>
                <p class="site-tutorial-text">${currentTutorial.promptText || 'Vou te guiar em poucos passos mostrando as partes mais importantes desta página.'}</p>
                <label class="site-tutorial-never-show">
                    <input type="checkbox" id="tutorial-prompt-never-show-checkbox">
                    <span>Não mostrar automaticamente novamente</span>
                </label>
                <div class="site-tutorial-actions">
                    <button type="button" class="btn btn-ghost site-tutorial-no">Agora não</button>
                    <button type="button" class="btn btn-primary site-tutorial-yes">Sim, mostrar tutorial</button>
                </div>
            </div>
        `);

        const neverShowCheckbox = overlay.querySelector('#tutorial-prompt-never-show-checkbox');
        const noBtn = overlay.querySelector('.site-tutorial-no');
        const yesBtn = overlay.querySelector('.site-tutorial-yes');

        if (noBtn) {
            noBtn.addEventListener('click', () => {
                setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                closeActiveOverlay();
            });
        }

        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                startTour(false);
            });
        }
    }

    function ensureFloatingHelperButton() {
        if (getPageKey() !== 'index') return;
        if (document.getElementById('floating-tutorial-helper')) return;

        const helperBtn = document.createElement('button');
        helperBtn.id = 'floating-tutorial-helper';
        helperBtn.className = 'floating-tutorial-helper';
        helperBtn.type = 'button';
        helperBtn.setAttribute('aria-label', 'Abrir tutorial da loja');
        helperBtn.title = 'Ajuda rápida';
        helperBtn.innerHTML = `
            <span class="floating-helper-icon" aria-hidden="true">
                <i class="fas fa-user-astronaut"></i>
            </span>
            <span class="floating-helper-label">${getTutorialConfig().helperLabel || 'Ajuda'}</span>
        `;
        helperBtn.addEventListener('click', () => {
            if (typeof window.startSiteTutorial === 'function') {
                window.startSiteTutorial(true);
            }
        });

        document.body.appendChild(helperBtn);
    }

    function scheduleAutomaticPrompt() {
        if (autoPromptTimer) {
            clearTimeout(autoPromptTimer);
            autoPromptTimer = null;
        }

        const tutorial = getTutorialConfig();
        const delay = Number(tutorial.autoPromptDelay || 1000);
        autoPromptTimer = setTimeout(() => {
            if (activeOverlay) return;
            showTutorialPrompt();
        }, delay);
    }

    function bootstrapAutomaticPrompt() {
        if (autoPromptBootstrapped) return;
        autoPromptBootstrapped = true;

        const startAfterPageLoad = () => {
            setTimeout(() => {
                scheduleAutomaticPrompt();
            }, 1200);
        };

        if (document.readyState === 'complete') {
            startAfterPageLoad();
        } else {
            window.addEventListener('load', startAfterPageLoad, { once: true });
        }

        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                scheduleAutomaticPrompt();
            }
        });
    }

    window.startSiteTutorial = (forceManualOpen = false) => {
        return startTour(Boolean(forceManualOpen));
    };

    function initializeTutorial() {
        ensureFloatingHelperButton();
        bootstrapAutomaticPrompt();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTutorial);
    } else {
        initializeTutorial();
    }
})();
