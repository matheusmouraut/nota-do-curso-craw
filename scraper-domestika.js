require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');

puppeteer.use(StealthPlugin());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const gerarSlug = (texto) => texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const pausaAleatoria = async (min, max) => {
    const tempo = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`⏳ Aguardando ${(tempo / 1000).toFixed(1)} segundos...`);
    return new Promise(resolve => setTimeout(resolve, tempo));
};

async function iniciarCrawlerDomestika() {
    console.log('🎨 Iniciando Crawler da DOMESTIKA...');

    const LIMITE_PAGINAS_POR_CATEGORIA = 3; 
    const LIMITE_CATEGORIAS_POR_LOTE = 5;

    console.log('🔍 Consultando o banco de dados por links da Domestika...');
    const { data: categorias, error } = await supabase
        .from('categorias')
        .select('*')
        .not('url_domestika', 'is', null)
        .order('ultima_varredura', { ascending: true, nullsFirst: true }) 
        .limit(LIMITE_CATEGORIAS_POR_LOTE);

    if (error) {
        console.error('❌ ERRO NO BANCO DE DADOS (Supabase):', error.message);
        return;
    }

    if (!categorias || categorias.length === 0) {
        console.log('⚠️ ALERTA: O banco retornou ZERO resultados. Ou não tem link da Domestika salvo, ou o nome da coluna no banco está diferente de "url_domestika".');
        return;
    }

    console.log(`📦 Encontradas ${categorias.length} categorias para processar.`);

    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        for (const categoria of categorias) {
            console.log(`\n🎯 CATEGORIA DOMESTIKA: ${categoria.nome} | Link: ${categoria.url_domestika}`);

            let paginaAtual = 1;
            let continuarPaginando = true;

            while (continuarPaginando && paginaAtual <= LIMITE_PAGINAS_POR_CATEGORIA) {
                const urlAlvo = paginaAtual === 1 ? categoria.url_domestika : `${categoria.url_domestika}?page=${paginaAtual}`;
                console.log(`🌐 Acessando página ${paginaAtual}: ${urlAlvo}`);
                
                try { await page.goto(urlAlvo, { waitUntil: 'networkidle2', timeout: 60000 }); } 
                catch (e) { 
                    console.log('⚠️ Erro ao carregar página. Pulando.');
                    break; 
                }

                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let t = 0; let d = 150;
                        let timer = setInterval(() => {
                            window.scrollBy(0, d); t += d;
                            if(t >= document.body.scrollHeight - window.innerHeight){ clearInterval(timer); resolve(); }
                        }, 100);
                    });
                });

                console.log('🔍 Extraindo dados do HTML...');
                const cursos = await page.evaluate(() => {
                    const lista = [];
                    document.querySelectorAll('li.group.relative').forEach(card => {
                        const tituloNode = card.querySelector('h2.line-clamp-2');
                        const titulo = tituloNode ? tituloNode.innerText.trim() : '';

                        const autorNode = card.querySelector('p.truncate');
                        let autor = autorNode ? autorNode.innerText.replace('Um curso de', '').trim() : '';

                        const btnComprar = card.querySelector('a[aria-label^="BUY"]');
                        let precoLimpo = '';
                        let link = '';
                        
                        if (btnComprar) {
                            link = btnComprar.href;
                            const precoNode = btnComprar.querySelector('span.ml-2');
                            const precoRaw = precoNode ? precoNode.innerText : '';
                            if (precoRaw.includes('R$')) {
                                const match = precoRaw.match(/R\$\s?[\d.,]+/);
                                if (match) precoLimpo = match[0];
                            }
                        }

                        const imgNode = card.querySelector('picture img');
                        const imagemUrl = imgNode ? imgNode.src : '';

                        const avaliacaoNode = card.querySelector('svg[aria-label="avaliações positivas"]');
                        let nota = '0';
                        if (avaliacaoNode && avaliacaoNode.parentElement) {
                            const textoAvaliacao = avaliacaoNode.parentElement.innerText; 
                            const matchNota = textoAvaliacao.match(/(\d+)%/); 
                            if (matchNota) nota = matchNota[1] + '%'; 
                        }

                        if (titulo && precoLimpo) {
                            lista.push({ titulo, autor, preco: precoLimpo, nota, imagemUrl, link });
                        }
                    });
                    return lista;
                });

                if (cursos.length === 0) {
                    console.log(`⚠️ Nenhum curso encontrado na página ${paginaAtual}. Encerrando esta categoria.`);
                    continuarPaginando = false;
                    break;
                }

                console.log(`✅ ${cursos.length} cursos lidos. Injetando no Supabase...`);

                for (const item of cursos) {
                    const { data: injetado, error: erroInsert } = await supabase.from('cursos')
                        .upsert([{ titulo: item.titulo, slug: gerarSlug(item.titulo), autor: item.autor, imagem_capa: item.imagemUrl, categoria_id: categoria.id }], { onConflict: 'slug' })
                        .select();
                    
                    if (erroInsert) {
                        console.error(`❌ Erro ao injetar curso ${item.titulo}:`, erroInsert.message);
                    } else if (injetado?.length > 0) {
                        let p = parseFloat(item.preco.replace(/[^0-9,.]/g, '').replace(',', '.'));
                        await supabase.from('ofertas').insert([{ curso_id: injetado[0].id, plataforma: 'Domestika', preco: p || 0, nota_plataforma: item.nota, link_afiliado: item.link }]);
                    }
                }

                paginaAtual++;
                if (continuarPaginando) await pausaAleatoria(2000, 4000);
            }

            await supabase.from('categorias').update({ ultima_varredura: new Date().toISOString() }).eq('id', categoria.id);
            console.log(`✅ Categoria concluída.`);
            await pausaAleatoria(4000, 8000);
        }
    } finally {
        await browser.close();
        console.log('🔌 Motor desligado.');
    }
}
iniciarCrawlerDomestika();