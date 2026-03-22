require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const gerarSlug = (texto) => texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const categoriasMapa = [
    {
        nome: "Estude IA", 
        urls: { udemy: "https://www.udemy.com/pt/courses/artificial-intelligence/", domestika: "https://www.domestika.org/pt/courses/category/23-inteligencia-artificial" },
        subcategorias: []
    },
    {
        nome: "Desenvolvimento", 
        urls: { udemy: "https://www.udemy.com/pt/courses/development/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=tecnologia-e-desenvolvimento-de-software" },
        subcategorias: [
            { nome: "Desenvolvimento Web", urls: { udemy: "https://www.udemy.com/pt/courses/development/web-development/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=site", domestika: "https://www.domestika.org/pt/courses/category/9-web-e-app-design" } },
            { nome: "Programação", urls: { udemy: "https://www.udemy.com/pt/courses/development/programming-languages/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=programacao" } },
            { nome: "Desenvolvimento de games", urls: { udemy: "https://www.udemy.com/pt/courses/development/game-development/" } }
        ]
    },
    {
        nome: "Negócios", 
        urls: { udemy: "https://www.udemy.com/pt/courses/business/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=financas-e-negocios", domestika: "https://www.domestika.org/pt/courses/category/17-marketing-e-negocios" },
        subcategorias: [
            { nome: "Empreendedorismo", urls: { udemy: "https://www.udemy.com/pt/courses/business/entrepreneurship/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=empreendedorismo" } },
            { nome: "Administração", urls: { udemy: "https://www.udemy.com/pt/courses/business/management/" } }
        ]
    },
    {
        nome: "Design", 
        urls: { udemy: "https://www.udemy.com/pt/courses/design/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=design-e-fotografia", domestika: "https://www.domestika.org/pt/courses/category/3-design" },
        subcategorias: [
            { nome: "Design Gráfico", urls: { udemy: "https://www.udemy.com/pt/courses/design/graphic-design-and-illustration/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=design" } },
            { nome: "Arquitetura", urls: { udemy: "https://www.udemy.com/pt/courses/design/architectural-design/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=arquitetura", domestika: "https://www.domestika.org/pt/courses/category/15-arquitetura-e-espacos" } },
            { nome: "Desenho", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=desenho", domestika: "https://www.domestika.org/pt/courses/category/11-ilustracao" } },
            { nome: "3D e Animação", urls: { udemy: "https://www.udemy.com/pt/courses/design/3d-and-animation/", domestika: "https://www.domestika.org/pt/courses/category/13-3d-e-animacao" } },
            { nome: "Caligrafia e Tipografia", urls: { domestika: "https://www.domestika.org/pt/courses/category/16-caligrafia-e-tipografia" } }
        ]
    },
    {
        nome: "Marketing", 
        urls: { udemy: "https://www.udemy.com/pt/courses/marketing/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=marketing-e-vendas", domestika: "https://www.domestika.org/pt/courses/category/17-marketing-e-negocios" },
        subcategorias: [
            { nome: "Marketing Digital", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/digital-marketing/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=marketing-digital" } },
            { nome: "SEO", urls: { udemy: "https://www.udemy.com/pt/courses/marketing/search-engine-optimization/" } }
        ]
    },
    {
        nome: "Estilo de vida", 
        urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/" },
        subcategorias: [
            { nome: "Culinária e Gastronomia", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/food-and-beverage/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=culinaria-e-gastronomia", domestika: "https://www.domestika.org/pt/courses/category/21-cozinha" } },
            { nome: "Artesanato", urls: { udemy: "https://www.udemy.com/pt/courses/lifestyle/arts-and-crafts/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=artesanato", domestika: "https://www.domestika.org/pt/courses/category/12-craft" } },
            { nome: "Moda", urls: { hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=moda", domestika: "https://www.domestika.org/pt/courses/category/20-moda" } },
            { nome: "Bem-estar", urls: { domestika: "https://www.domestika.org/pt/courses/category/24-bem-estar" } }
        ]
    },
    {
        nome: "Fotografia e vídeo", 
        urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=design-e-fotografia", domestika: "https://www.domestika.org/pt/courses/category/8-fotografia-e-video" },
        subcategorias: [
            { nome: "Fotografia", urls: { udemy: "https://www.udemy.com/pt/courses/photography-and-video/digital-photography/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=fotografia" } }
        ]
    },
    {
        nome: "Música", 
        urls: { udemy: "https://www.udemy.com/pt/courses/music/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?topifications=musica-e-artes", domestika: "https://www.domestika.org/pt/courses/category/19-musica-e-audio" },
        subcategorias: [
            { nome: "Instrumentos Musicais", urls: { udemy: "https://www.udemy.com/pt/courses/music/instruments/", hotmart: "https://hotmart.com/pt-br/marketplace/produtos?category=musica" } }
        ]
    },
    {
        nome: "Escrita e Comunicação", 
        urls: { domestika: "https://www.domestika.org/pt/courses/category/18-escrita" },
        subcategorias: []
    }
];

async function semearBanco() {
    console.log('🌱 Iniciando injeção de categorias...');

    for (const catPai of categoriasMapa) {
        const payloadPai = { 
            nome: catPai.nome, 
            slug: gerarSlug(catPai.nome),
            url_udemy: catPai.urls?.udemy || null, 
            url_hotmart: catPai.urls?.hotmart || null, 
            url_domestika: catPai.urls?.domestika || null, 
            categoria_pai_id: null 
        };

        const { data: paiInserido, error: erroPai } = await supabase
            .from('categorias')
            .upsert([payloadPai], { onConflict: 'slug' }) 
            .select();

        if (erroPai) {
            console.error(`❌ ERRO FATAL AO SALVAR "${catPai.nome}":`, erroPai.message);
            continue; 
        }
        
        console.log(`✅ Categoria Pai OK: ${catPai.nome}`);
        const idPai = paiInserido[0].id;

        for (const sub of catPai.subcategorias) {
            const payloadSub = { 
                nome: sub.nome, 
                slug: gerarSlug(sub.nome),
                url_udemy: sub.urls?.udemy || null, 
                url_hotmart: sub.urls?.hotmart || null, 
                url_domestika: sub.urls?.domestika || null, 
                categoria_pai_id: idPai 
            };

            const { error: erroSub } = await supabase
                .from('categorias')
                .upsert([payloadSub], { onConflict: 'slug' });
            
            if (erroSub) {
                console.error(`  ↳ ❌ ERRO SUB "${sub.nome}":`, erroSub.message);
            } else {
                console.log(`  ↳ ✔️ Subcategoria OK: ${sub.nome}`);
            }
        }
    }
    console.log('\n🎉 Semeador finalizado! Verifique o banco.');
}

semearBanco();