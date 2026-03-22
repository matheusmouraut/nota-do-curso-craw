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

async function iniciarCrawlerUdemy() {
    console.log('🤖 Iniciando Crawler da UDEMY...');

    // Limites ajustáveis para você controlar o quanto ele trabalha por vez
    const LIMITE_PAGINAS_POR_CATEGORIA = 3; 
    const LIMITE_CATEGORIAS_POR_LOTE = 5;   

    const { data: categorias, error } = await supabase
        .from('categorias')
        .select('*')
        .not('url_udemy', 'is', null) // Pega apenas quem tem link da Udemy
        .order('ultima_varredura', { ascending: true, nullsFirst: true }) 
        .limit(LIMITE_CATEGORIAS_POR_LOTE);

    if (error || !categorias || categorias.length === 0) return console.log('🏁 Todas as categorias da Udemy estão atualizadas.');

    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        for (const categoria of categorias) {
            console.log(`\n🎯 CATEGORIA UDEMY: ${categoria.nome}`);

            let paginaAtual = 1;
            let continuarPaginando = true;

            while (continuarPaginando && paginaAtual <= LIMITE_PAGINAS_POR_CATEGORIA) {
                const urlAlvo = paginaAtual === 1 ? categoria.url_udemy : `${categoria.url_udemy}?p=${paginaAtual}`;
                console.log(`🌐 Acessando página ${paginaAtual}...`);
                
                try { await page.goto(urlAlvo, { waitUntil: 'networkidle2', timeout: 60000 }); } 
                catch (e) { break; }

                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let tHeight = 0; let dist = 100;
                        let timer = setInterval(() => {
                            window.scrollBy(0, dist); tHeight += dist;
                            if(tHeight >= document.body.scrollHeight - window.innerHeight){ clearInterval(timer); resolve(); }
                        }, 100);
                    });
                });

                const cursos = await page.evaluate(() => {
                    const lista = [];
                    document.querySelectorAll('div[data-purpose="container"]').forEach(card => {
                        const titulo = card.querySelector('h3[data-purpose="course-title-url"]')?.innerText || '';
                        const autor = card.querySelector('div[data-purpose="safely-set-inner-html:course-card:visible-instructors"]')?.innerText || '';
                        const precoRaw = card.querySelector('div[data-purpose="course-price-text"]')?.innerText || '';
                        const nota = card.querySelector('span[data-purpose="rating-number"]')?.innerText || '';
                        const img = card.querySelector('img')?.src || '';
                        const link = card.querySelector('a')?.getAttribute('href') || '';
                        
                        let precoLimpo = precoRaw.includes('R$') ? (precoRaw.match(/R\$\s?[\d.,]+/) || [''])[0] : '';
                        if (titulo && precoLimpo) lista.push({ titulo: titulo.split('\n')[0].trim(), autor: autor.trim(), preco: precoLimpo, nota: nota.trim(), imagemUrl: img, link: `https://www.udemy.com${link}` });
                    });
                    return lista;
                });

                if (cursos.length === 0) break;
                console.log(`✅ ${cursos.length} cursos encontrados.`);

                for (const item of cursos) {
                    const { data: cursoInjetado } = await supabase.from('cursos').upsert([{ titulo: item.titulo, slug: gerarSlug(item.titulo), autor: item.autor, imagem_capa: item.imagemUrl, categoria_id: categoria.id }], { onConflict: 'slug' }).select();
                    if (cursoInjetado?.length > 0) {
                        let p = parseFloat(item.preco.replace(/[^0-9,.]/g, '').replace(',', '.'));
                        await supabase.from('ofertas').insert([{ curso_id: cursoInjetado[0].id, plataforma: 'Udemy', preco: p || 0, nota_plataforma: item.nota, link_afiliado: item.link }]);
                    }
                }

                paginaAtual++;
                if (paginaAtual <= LIMITE_PAGINAS_POR_CATEGORIA) await pausaAleatoria(2000, 4000);
            }

            await supabase.from('categorias').update({ ultima_varredura: new Date().toISOString() }).eq('id', categoria.id);
            console.log(`✅ Categoria concluída.`);
            await pausaAleatoria(4000, 8000);
        }
    } finally {
        await browser.close();
    }
}
iniciarCrawlerUdemy();