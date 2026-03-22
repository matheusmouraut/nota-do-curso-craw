require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const gerarSlug = (texto) => texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// A TAXONOMIA MASTER DO "NOTA DO CURSO" (100% MAPEADA: UDEMY + HOTMART)
const categoriasMapa = [
    {
        nome: "Desenvolvimento", 
        urls: { udemy: "https://www.udemy.com/pt/courses/development/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=tecnologia-e-desenvolvimento-de-software" },
        subcategorias: [
            { nome: "Desenvolvimento Web", urls: { udemy: "https://www.udemy.com/pt/courses/development/web-development/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=site" } },
            { nome: "Programação", urls: { udemy: "https://www.udemy.com/pt/courses/development/programming-languages/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=programacao" } },
            { nome: "Desenvolvimento de games", urls: { udemy: "https://www.udemy.com/pt/courses/development/game-development/" } },
            { nome: "Data Science", urls: { udemy: "https://www.udemy.com/pt/courses/development/data-science/" } },
            { nome: "Desenvolvimento móvel", urls: { udemy: "https://www.udemy.com/pt/courses/development/mobile-apps/" } }
        ]
    },
    {
        nome: "Negócios", 
        urls: { udemy: "https://www.udemy.com/pt/courses/business/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=financas-e-negocios" },
        subcategorias: [
            { nome: "Empreendedorismo", urls: { udemy: "https://www.udemy.com/pt/courses/business/entrepreneurship/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=empreendedorismo" } },
            { nome: "Comunicação e Oratória", urls: { udemy: "https://www.udemy.com/pt/courses/business/communications/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=oratoria" } },
            { nome: "Administração", urls: { udemy: "https://www.udemy.com/pt/courses/business/management/" } },
            { nome: "Vendas", urls: { udemy: "https://www.udemy.com/pt/courses/business/sales/" } },
            { nome: "Recursos humanos", urls: { udemy: "https://www.udemy.com/pt/courses/business/human-resources/" } },
            { nome: "e-Commerce", urls: { udemy: "https://www.udemy.com/pt/courses/business/e-commerce/" } }
        ]
    },
    {
        nome: "Finanças e contabilidade", 
        urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=financas-e-negocios" },
        subcategorias: [
            { nome: "Finanças", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/finance-management/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=financas" } },
            { nome: "Investimentos", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/investing-and-trading/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=investimentos" } },
            { nome: "Contabilidade", urls: { udemy: "https://www.udemy.com/pt/courses/finance-and-accounting/accounting-bookkeeping/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=contabilidade" } }
        ]
    },
    {
        nome: "Produtividade no escritório", 
        urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/" },
        subcategorias: [
            { nome: "Excel e Planilhas", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/microsoft/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=excel" } },
            { nome: "Softwares Google", urls: { udemy: "https://www.udemy.com/pt/courses/office-productivity/google/" } }
        ]
    },
    {
        nome: "Desenvolvimento Pessoal", 
        urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=carreira-e-desenvolvimento-pessoal" },
        subcategorias: [
            { nome: "Transformação pessoal", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/personal-transformation/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=desenvolvimento-pessoal" } },
            { nome: "Carreira", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/career-development/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=carreira" } },
            { nome: "Coaching", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=coaching" } },
            { nome: "Religião e Espiritualidade", urls: { udemy: "https://www.udemy.com/pt/courses/personal-development/religion-and-spirituality/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=espiritualidade" } },
            { nome: "Astrologia", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=astrologia" } },
            { nome: "Psicologia", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=psicologia" } }
        ]
    },
    {
        nome: "Design", 
        urls: { udemy: "https://www.udemy.com/pt/courses/design/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=design-e-fotografia" },
        subcategorias: [
            { nome: "Design Gráfico", urls: { udemy: "https://www.udemy.com/pt/courses/design/graphic-design-and-illustration/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=design" } },
            { nome: "Arquitetura", urls: { udemy: "https://www.udemy.com/pt/courses/design/architectural-design/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=arquitetura" } },
            { nome: "Desenho", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=desenho" } }
        ]
    },
    {
        nome: "Marketing", 
        urls: { udemy: "https://www.udemy.com/pt/courses/marketing/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=marketing-e-vendas" },
        subcategorias: [
            { nome: "Marketing Digital", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/digital-marketing/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=marketing-digital" } },
            { nome: "SEO", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/search-engine-optimization/" } },
            { nome: "Tráfego Pago", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/advertising/" } }
        ]
    },
    {
        nome: "Estilo de vida", 
        urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/" },
        subcategorias: [
            { nome: "Beleza e Maquiagem", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/beauty-and-makeup/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=maquiagem" } },
            { nome: "Culinária e Gastronomia", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/food-and-beverage/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=culinaria-e-gastronomia" } },
            { nome: "Receitas", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=receitas" } },
            { nome: "Confeitaria", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=confeitaria" } },
            { nome: "Artesanato", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/arts-and-crafts/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=artesanato" } },
            { nome: "Pets", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/pet-care-and-training/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=pet" } },
            { nome: "Moda", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=moda" } },
            { nome: "Turismo", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/travel/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=turismo" } }
        ]
    },
    {
        nome: "Fotografia e vídeo", 
        urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=design-e-fotografia" },
        subcategorias: [
            { nome: "Fotografia", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/digital-photography/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=fotografia" } },
            { nome: "Design de vídeos", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/video-design/" } }
        ]
    },
    {
        nome: "Saúde e fitness", 
        urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=saude-e-esportes" },
        subcategorias: [
            { nome: "Saúde Geral", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/general-health/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=saude" } },
            { nome: "Emagrecimento", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=emagrecimento" } },
            { nome: "Esportes", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/sports/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=esporte" } },
            { nome: "Nutrição e dieta", urls: { udemy: "https://www.udemy.com/pt/courses/health-and-fitness/nutrition/" } }
        ]
    },
    {
        nome: "Música", 
        urls: { udemy: "https://www.udemy.com/pt/courses/music/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=musica-e-artes" },
        subcategorias: [
            { nome: "Instrumentos Musicais", urls: { udemy: "https://www.udemy.com/pt/courses/music/instruments/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=musica" } },
            { nome: "Produção musical", urls: { udemy: "https://www.udemy.com/pt/courses/music/production/" } }
        ]
    },
    {
        nome: "Ensino e estudo acadêmico", 
        urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=ensino-e-estudo-academico" },
        subcategorias: [
            { nome: "Concursos", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=concurso" } },
            { nome: "ENEM", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=enem" } },
            { nome: "Idiomas", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/language/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=idiomas" } },
            { nome: "Direito", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=direito" } },
            { nome: "Engenharia", urls: { udemy: "https://www.udemy.com/pt/courses/teaching-and-academics/engineering/" } }
        ]
    }
];

async function semearBanco() {
    console.log('🌱 Sincronizando Taxonomia Universal (Udemy + Hotmart) no banco...');

    for (const catPai of categoriasMapa) {
        console.log(`\n📁 Atualizando Categoria: ${catPai.nome}`);
        
        const { data: paiInserido, error: erroPai } = await supabase
            .from('categorias')
            .upsert([{ 
                nome: catPai.nome, 
                slug: gerarSlug(catPai.nome),
                url_udemy: catPai.urls.udemy || null, 
                url_hotmart: catPai.urls.hotmart || null, 
                categoria_pai_id: null 
            }], { onConflict: 'slug' }) 
            .select();

        if (erroPai) {
            console.error(`❌ Erro em ${catPai.nome}:`, erroPai.message);
            continue;
        }

        const idPai = paiInserido[0].id;

        for (const sub of catPai.subcategorias) {
            const { error: erroSub } = await supabase
                .from('categorias')
                .upsert([{ 
                    nome: sub.nome, 
                    slug: gerarSlug(sub.nome),
                    url_udemy: sub.urls?.udemy || null, 
                    url_hotmart: sub.urls?.hotmart || null, 
                    categoria_pai_id: idPai 
                }], { onConflict: 'slug' });
            
            if (erroSub) console.error(`  ↳ ❌ Falha: ${sub.nome}`);
            else console.log(`  ↳ ✅ Registrada: ${sub.nome}`);
        }
    }
    console.log('\n🎉 O banco está totalmente semeado e pronto para todos os robôs!');
}

semearBanco();