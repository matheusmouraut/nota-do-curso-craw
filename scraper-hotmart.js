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

async function iniciarCrawlerHotmart() {
    console.log('🔥 Iniciando Crawler da HOTMART...');

    // Limites de controle da Hotmart
    const LIMITE_CLIQUES_MOSTRAR_MAIS = 3; 
    const LIMITE_CATEGORIAS_POR_LOTE = 5;

    const { data: categorias, error } = await supabase
        .from('categorias')
        .select('*')
        .not('url_hotmart', 'is', null) // Pega apenas quem tem link da Hotmart
        .order('ultima_varredura', { ascending: true, nullsFirst: true }) 
        .limit(LIMITE_CATEGORIAS_POR_LOTE);

    if (error || !categorias || categorias.length === 0) return console.log('🏁 Todas as categorias da Hotmart estão atualizadas.');

    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        for (const categoria of categorias) {
            console.log(`\n🎯 CATEGORIA HOTMART: ${categoria.nome}`);

            try { await page.goto(categoria.url_hotmart, { waitUntil: 'networkidle2', timeout: 60000 }); } 
            catch (e) { continue; }

            let cliques = 0;
            let continuarClicando = true;

            while (continuarClicando && cliques <= LIMITE_CLIQUES_MOSTRAR_MAIS) {
                // Rola para carregar as imagens de verdade (tira o GIF em branco)
                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let t = 0; let d = 200;
                        let timer = setInterval(() => {
                            window.scrollBy(0, d); t += d;
                            if(t >= document.body.scrollHeight - window.innerHeight){ clearInterval(timer); resolve(); }
                        }, 150);
                    });
                });

                // Clica no botão de mostrar mais
                const hasBtn = await page.evaluate(() => {
                    const btn = document.querySelector('button.show-all-button');
                    if (btn && btn.offsetParent !== null) { btn.click(); return true; }
                    return false;
                });

                if (hasBtn) {
                    cliques++;
                    console.log(`👇 Clicou em "Mostrar mais" (${cliques}/${LIMITE_CLIQUES_MOSTRAR_MAIS})...`);
                    await pausaAleatoria(2000, 4000);
                } else {
                    continuarClicando = false;
                }
            }

            console.log('🔍 Lendo a tela...');
            const cursos = await page.evaluate(() => {
                const lista = [];
                document.querySelectorAll('.product-card-alt').forEach(card => {
                    const titulo = card.querySelector('.product-card-alt__title')?.innerText || '';
                    const autor = card.querySelector('.product-card-alt__author')?.innerText || '';
                    const precoRaw = card.querySelector('.product-card-alt__price .price')?.innerText || '';
                    const nota = card.querySelector('.product-card-alt__rating span')?.innerText || '0';
                    const link = card.querySelector('a.product-link')?.href || '';
                    
                    const imgNode = card.querySelector('img.product-card-alt__image');
                    let imgUrl = imgNode ? (imgNode.srcset ? imgNode.srcset.split(',').pop().trim().split(' ')[0] : imgNode.src) : '';
                    if (imgUrl.includes('data:image/gif')) imgUrl = ''; // Ignora falhas de lazy load

                    let precoLimpo = precoRaw.includes('R$') ? (precoRaw.match(/R\$\s?[\d.,]+/) || [''])[0] : '';
                    if (titulo && precoLimpo) lista.push({ titulo: titulo.trim(), autor: autor.trim(), preco: precoLimpo, nota: nota.trim(), imagemUrl: imgUrl, link });
                });
                return lista;
            });

            if (cursos.length > 0) {
                console.log(`✅ ${cursos.length} cursos encontrados.`);
                for (const item of cursos) {
                    const { data: injetado } = await supabase.from('cursos').upsert([{ titulo: item.titulo, slug: gerarSlug(item.titulo), autor: item.autor, imagem_capa: item.imagemUrl, categoria_id: categoria.id }], { onConflict: 'slug' }).select();
                    if (injetado?.length > 0) {
                        let p = parseFloat(item.preco.replace(/[^0-9,.]/g, '').replace(',', '.'));
                        await supabase.from('ofertas').insert([{ curso_id: injetado[0].id, plataforma: 'Hotmart', preco: p || 0, nota_plataforma: item.nota, link_afiliado: item.link }]);
                    }
                }
            }

            await supabase.from('categorias').update({ ultima_varredura: new Date().toISOString() }).eq('id', categoria.id);
            console.log(`✅ Categoria concluída.`);
            await pausaAleatoria(3000, 6000);
        }
    } finally {
        await browser.close();
    }
}
iniciarCrawlerHotmart();