require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Conecta ao Supabase usando as chaves do arquivo .env
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para criar URLs amigáveis (slugs) tirando acentos e espaços
const gerarSlug = (texto) => {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// Lista completa de categorias e subcategorias baseada na Udemy
const categoriasMapa = [
    {
        nome: "Estude IA", 
        urls: { udemy: "https://www.udemy.com/pt/courses/artificial-intelligence/" },
        subcategorias: [
            { nome: "Fundamentos da IA", urls: { udemy: "https://www.udemy.com/pt/courses/artificial-intelligence/ai-fundamentals/" } },
            { nome: "IA para profissionais", urls: { udemy: "https://www.udemy.com/pt/courses/artificial-intelligence/ai-for-business/" } },
            { nome: "IA para desenvolvedores", urls: { udemy: "https://www.udemy.com/pt/courses/artificial-intelligence/ai-for-developers/" } },
            { nome: "IA para criativos", urls: { udemy: "https://www.udemy.com/pt/courses/artificial-intelligence/ai-for-creatives/" } }
        ]
    },
    {
        nome: "Desenvolvimento", 
        urls: { udemy: "https://www.udemy.com/pt/courses/development/" },
        subcategorias: [
            { nome: "Desenvolvimento Web", urls: { udemy: "https://www.udemy.com/pt/courses/development/web-development/" } },
            { nome: "Data Science", urls: { udemy: "https://www.udemy.com/pt/courses/development/data-science/" } },
            { nome: "Desenvolvimento móvel", urls: { udemy: "https://www.udemy.com/pt/courses/development/mobile-apps/" } },
            { nome: "Linguagens de programação", urls: { udemy: "https://www.udemy.com/pt/courses/development/programming-languages/" } },
            { nome: "Desenvolvimento de games", urls: { udemy: "https://www.udemy.com/pt/courses/development/game-development/" } },
            { nome: "Design e desenvolvimento de bancos de dados", urls: { udemy: "https://www.udemy.com/pt/courses/development/databases/" } },
            { nome: "Teste de software", urls: { udemy: "https://www.udemy.com/pt/courses/development/software-testing/" } },
            { nome: "Engenharia de software", urls: { udemy: "https://www.udemy.com/pt/courses/development/software-engineering/" } },
            { nome: "Ferramentas de desenvolvimento de software", urls: { udemy: "https://www.udemy.com/pt/courses/development/development-tools/" } },
            { nome: "Desenvolvimento sem código", urls: { udemy: "https://www.udemy.com/pt/courses/development/no-code-development/" } }
        ]
    },
    {
        nome: "Negócios", 
        urls: { udemy: "https://www.udemy.com/pt/courses/business/" },
        subcategorias: [
            { nome: "Empreendedorismo", urls: { udemy: "https://www.udemy.com/pt/courses/business/entrepreneurship/" } },
            { nome: "Comunicação", urls: { udemy: "https://www.udemy.com/pt/courses/business/communications/" } },
            { nome: "Administração", urls: { udemy: "https://www.udemy.com/pt/courses/business/management/" } },
            { nome: "Vendas", urls: { udemy: "https://www.udemy.com/pt/courses/business/sales/" } },
            { nome: "Estratégia de negócios", urls: { udemy: "https://www.udemy.com/pt/courses/business/strategy/" } },
            { nome: "Operações", urls: { udemy: "https://www.udemy.com/pt/courses/business/operations/" } },
            { nome: "Gestão de projetos", urls: { udemy: "https://www.udemy.com/pt/courses/business/project-management/" } },
            { nome: "Direito comercial", urls: { udemy: "https://www.udemy.com/pt/courses/business/business-law/" } },
            { nome: "Business Analytics e Intelligence", urls: { udemy: "https://www.udemy.com/pt/courses/business/analytics-and-intelligence/" } },
            { nome: "Recursos humanos", urls: { udemy: "https://www.udemy.com/pt/courses/business/human-resources/" } },
            { nome: "Indústria", urls: { udemy: "https://www.udemy.com/pt/courses/business/industry/" } },
            { nome: "e-Commerce", urls: { udemy: "https://www.udemy.com/pt/courses/business/e-commerce/" } },
            { nome: "Mídia", urls: { udemy: "https://www.udemy.com/pt/courses/business/media/" } },
            { nome: "Imóveis", urls: { udemy: "https://www.udemy.com/pt/courses/business/real-estate/" } },
            { nome: "Mais opções em negócios", urls: { udemy: "https://www.udemy.com/pt/courses/business/other-business/" } }
        ]
    },
    {
        nome: "Finanças e contabilidade", 
        urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/" },
        subcategorias: [
            { nome: "Contabilidade e escrituração contábil", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/accounting-bookkeeping/" } },
            { nome: "Conformidade", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/compliance/" } },
            { nome: "Criptomoeda e blockchain", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/cryptocurrency-and-blockchain/" } },
            { nome: "Economia", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/economics/" } },
            { nome: "Finanças", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/finance-management/" } },
            { nome: "Preparação para exame e certificação financeira", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/finance-certification-and-exam-prep/" } },
            { nome: "Modelagem e análise financeira", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/financial-modeling-and-analysis/" } },
            { nome: "Investimentos e trading", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/investing-and-trading/" } },
            { nome: "Ferramentas de gerenciamento de dinheiro", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/money-management-tools/" } },
            { nome: "Impostos", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/taxes/" } },
            { nome: "Mais opções em finanças e contabilidade", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/other-finance-and-accounting/" } }
        ]
    },
    {
        nome: "TI e software", 
        urls: { udemy: "https://www.udemy.com/pt/courses/it-and-software/" },
        subcategorias: [
            { nome: "Certificações de TI", urls: { udemy: "https://www.udemy.com/pt/courses/it-and-software/it-certification/" } },
            { nome: "Rede e segurança", urls: { udemy: "https://www.udemy.com/pt/courses/it-and-software/network-and-security/" } },
            { nome: "Hardware", urls: { udemy: "https://www.udemy.com/pt/courses/it-and-software/hardware/" } },
            { nome: "Sistemas operacionais e servidores", urls: { udemy: "https://www.udemy.com/pt/courses/it-and-software/operating-systems/" } },
            { nome: "Mais opções em TI e software", urls: { udemy: "https://www.udemy.com/pt/courses/it-and-software/other-it-and-software/" } }
        ]
    },
    {
        nome: "Produtividade no escritório", 
        urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/" },
        subcategorias: [
            { nome: "Microsoft", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/microsoft/" } },
            { nome: "Apple", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/apple/" } },
            { nome: "Google", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/google/" } },
            { nome: "SAP", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/sap/" } },
            { nome: "Oracle", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/oracle/" } },
            { nome: "Mais opções em produtividade no escritório", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/other-productivity/" } }
        ]
    },
    {
        nome: "Desenvolvimento Pessoal", 
        urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/" },
        subcategorias: [
            { nome: "Transformação pessoal", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/personal-transformation/" } },
            { nome: "Produtividade pessoal", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/productivity/" } },
            { nome: "Liderança", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/leadership/" } },
            { nome: "Desenvolvimento de carreira", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/career-development/" } },
            { nome: "Maternidade/paternidade e relacionamentos", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/parenting-and-relationships/" } },
            { nome: "Felicidade", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/happiness/" } },
            { nome: "Práticas esotéricas", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/esoteric-practices/" } },
            { nome: "Religião e espiritualidade", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/religion-and-spirituality/" } },
            { nome: "Criação de marketing pessoal", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/personal-brand-building/" } },
            { nome: "Criatividade", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/creativity/" } },
            { nome: "Influência", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/influence/" } },
            { nome: "Mais opções em autoestima e confiança", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/self-esteem-and-confidence/" } },
            { nome: "Gestão de estresse", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/stress-management/" } },
            { nome: "Habilidades de memória e estudo", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/memory/" } },
            { nome: "Motivação", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/motivation/" } },
            { nome: "Mais opções em desenvolvimento pessoal", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/other-personal-development/" } }
        ]
    },
    {
        nome: "Design", 
        urls: { udemy: "https://www.udemy.com/pt/courses/design/" },
        subcategorias: [
            { nome: "Web design", urls: { udemy: "https://www.udemy.com/pt/courses/design/web-design/" } },
            { nome: "Design gráfico e ilustração", urls: { udemy: "https://www.udemy.com/pt/courses/design/graphic-design-and-illustration/" } },
            { nome: "Ferramentas de design", urls: { udemy: "https://www.udemy.com/pt/courses/design/design-tools/" } },
            { nome: "Design de experiência do usuário", urls: { udemy: "https://www.udemy.com/pt/courses/design/user-experience/" } },
            { nome: "Design de games", urls: { udemy: "https://www.udemy.com/pt/courses/design/game-design/" } },
            { nome: "3D e animação", urls: { udemy: "https://www.udemy.com/pt/courses/design/3d-and-animation/" } },
            { nome: "Design de moda", urls: { udemy: "https://www.udemy.com/pt/courses/design/fashion/" } },
            { nome: "Design arquitetônico", urls: { udemy: "https://www.udemy.com/pt/courses/design/architectural-design/" } },
            { nome: "Design de interiores", urls: { udemy: "https://www.udemy.com/pt/courses/design/interior-design/" } },
            { nome: "Mais opções em design", urls: { udemy: "https://www.udemy.com/pt/courses/design/other-design/" } }
        ]
    },
    {
        nome: "Marketing", 
        urls: { udemy: "https://www.udemy.com/pt/courses/marketing/" },
        subcategorias: [
            { nome: "Marketing digital", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/digital-marketing/" } },
            { nome: "Otimização de mecanismo de busca", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/search-engine-optimization/" } },
            { nome: "Marketing de redes sociais", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/social-media-marketing/" } },
            { nome: "Branding", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/branding/" } },
            { nome: "Fundamentos de marketing", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/marketing-fundamentals/" } },
            { nome: "Análise de marketing e automação", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/analytics-and-automation/" } },
            { nome: "Relações públicas", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/public-relations/" } },
            { nome: "Publicidade paga", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/advertising/" } },
            { nome: "Marketing móvel e em vídeo", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/video-and-mobile-marketing/" } },
            { nome: "Marketing de conteúdo", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/content-marketing/" } },
            { nome: "Aumento de usuários de produto/serviço", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/growth-hacking/" } },
            { nome: "Marketing de afiliados", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/affiliate-marketing/" } },
            { nome: "Marketing de produtos", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/product-marketing/" } },
            { nome: "Mais opções em marketing", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/other-marketing/" } }
        ]
    },
    {
        nome: "Estilo de vida", 
        urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/" },
        subcategorias: [
            { nome: "Artes e artesanato", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/arts-and-crafts/" } },
            { nome: "Beleza e maquiagem", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/beauty-and-makeup/" } },
            { nome: "Práticas esotéricas", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/esoteric-practices/" } },
            { nome: "Alimentos e bebidas", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/food-and-beverage/" } },
            { nome: "Jogos", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/gaming/" } },
            { nome: "Reforma da casa e jardinagem", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/home-improvement/" } },
            { nome: "Cuidados com animais de estimação e adestramento", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/pet-care-and-training/" } },
            { nome: "Viagem", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/travel/" } },
            { nome: "Mais opções em estilo de vida", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/other-lifestyle/" } }
        ]
    },
    {
        nome: "Fotografia e vídeo", 
        urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/" },
        subcategorias: [
            { nome: "Fotografia digital", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/digital-photography/" } },
            { nome: "Fotografia", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/photography-fundamentals/" } },
            { nome: "Retrato fotográfico", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/portraits/" } },
            { nome: "Ferramentas de fotografia", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/photography-tools/" } },
            { nome: "Fotografia comercial", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/commercial-photography/" } },
            { nome: "Design de vídeos", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/video-design/" } },
            { nome: "Mais opções em fotografia e vídeo", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/other-photography-and-video/" } }
        ]
    },
    {
        nome: "Saúde e fitness", 
        urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/" },
        subcategorias: [
            { nome: "Fitness", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/fitness/" } },
            { nome: "Saúde geral", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/general-health/" } },
            { nome: "Esportes", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/sports/" } },
            { nome: "Nutrição e dieta", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/nutrition/" } },
            { nome: "Ioga", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/yoga/" } },
            { nome: "Saúde mental", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/mental-health/" } },
            { nome: "Artes marciais e autodefesa", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/self-defense/" } },
            { nome: "Segurança e primeiros socorros", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/safety-and-first-aid/" } },
            { nome: "Dança", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/dance/" } },
            { nome: "Meditação", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/meditation/" } },
            { nome: "Mais opções em saúde e fitness", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/other-health-and-fitness/" } }
        ]
    },
    {
        nome: "Música", 
        urls: { udemy: "https://www.udemy.com/pt/courses/music/" },
        subcategorias: [
            { nome: "Instrumentos", urls: { udemy: "https://www.udemy.com/pt/courses/music/instruments/" } },
            { nome: "Produção musical", urls: { udemy: "https://www.udemy.com/pt/courses/music/production/" } },
            { nome: "Fundamentos da música", urls: { udemy: "https://www.udemy.com/pt/courses/music/music-fundamentals/" } },
            { nome: "Vocais", urls: { udemy: "https://www.udemy.com/pt/courses/music/vocal/" } },
            { nome: "Técnicas de música", urls: { udemy: "https://www.udemy.com/pt/courses/music/music-techniques/" } },
            { nome: "Software de música", urls: { udemy: "https://www.udemy.com/pt/courses/music/music-software/" } },
            { nome: "Mais opções em música", urls: { udemy: "https://www.udemy.com/pt/courses/music/other-music/" } }
        ]
    },
    {
        nome: "Ensino e estudo acadêmico", 
        urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/" },
        subcategorias: [
            { nome: "Engenharia", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/engineering/" } },
            { nome: "Ciências humanas", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/humanities/" } },
            { nome: "Matemática", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/math/" } },
            { nome: "Ciência", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/science/" } },
            { nome: "Educação online", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/online-education/" } },
            { nome: "Ciências sociais", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/social-science/" } },
            { nome: "Aprendizagem de idiomas", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/language/" } },
            { nome: "Treinamento de professores", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/teacher-training/" } },
            { nome: "Preparação Para Teste", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/test-prep/" } },
            { nome: "Outros tipos de ensino e estudo acadêmico", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/other-teaching-academics/" } }
        ]
    }
];

async function semearBanco() {
    console.log('Iniciando o cadastro de categorias no banco...');

    for (const catPai of categoriasMapa) {
        // Salva a categoria principal no banco. Se o slug já existir, atualiza a url.
        const { data: paiInserido, error: erroPai } = await supabase
            .from('categorias')
            .upsert([{ 
                nome: catPai.nome, 
                slug: gerarSlug(catPai.nome),
                url_udemy: catPai.urls.udemy, 
                categoria_pai_id: null 
            }], { onConflict: 'slug' }) 
            .select();

        if (erroPai) {
            console.error(`Erro na categoria principal ${catPai.nome}:`, erroPai.message);
            continue;
        }

        const idPai = paiInserido[0].id;

        // Salva as subcategorias vinculando com o ID da categoria principal
        for (const sub of catPai.subcategorias) {
            const { error: erroSub } = await supabase
                .from('categorias')
                .upsert([{ 
                    nome: sub.nome, 
                    slug: gerarSlug(sub.nome),
                    url_udemy: sub.urls.udemy, 
                    categoria_pai_id: idPai 
                }], { onConflict: 'slug' });
            
            if (erroSub) {
                console.error(`Erro na subcategoria ${sub.nome}:`, erroSub.message);
            }
        }
    }
    
    console.log('Categorias cadastradas com sucesso!');
}

semearBanco();