require('dotenv').config(); // Puxa as variáveis de segurança do arquivo .env
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');

// Ativa o plugin de camuflagem para o site achar que sou um humano no Chrome
puppeteer.use(StealthPlugin());

// Conecta ao banco de dados Supabase de forma segura (sem expor as chaves no código)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para padronizar os links (slugs). Transforma "Curso de IA" em "curso-de-ia"
const gerarSlug = (texto) => texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// Função de Humanização: Cria uma pausa aleatória para confundir os sistemas de defesa
const pausaAleatoria = async (min, max) => {
    const tempo = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`⏳ Pausa simulando humano: Aguardando ${(tempo / 1000).toFixed(1)} segundos...`);
    return new Promise(resolve => setTimeout(resolve, tempo));
};

async function iniciarCrawler() {
    console.log('🤖 Iniciando o Crawler (Motor de Extração)...');

    // =========================================================================
    // ⚙️ CONFIGURAÇÕES DA RODADA (Fácil de alterar depois)
    // =========================================================================
    const LIMITE_PAGINAS_POR_CATEGORIA = 3; // Mudar para 10, 20 ou 50 no futuro
    const LIMITE_CATEGORIAS_POR_LOTE = 5;   // Quantas categorias ele faz antes de desligar
    // =========================================================================

    // Busca no banco um lote de categorias que nunca foram lidas ou são as mais antigas
    const { data: categorias, error: erroBusca } = await supabase
        .from('categorias')
        .select('*')
        .order('ultima_varredura', { ascending: true, nullsFirst: true }) 
        .limit(LIMITE_CATEGORIAS_POR_LOTE);

    if (erroBusca || !categorias || categorias.length === 0) {
        console.log('🏁 Todas as categorias estão atualizadas. Nada a fazer agora.');
        return;
    }

    console.log(`📦 Trabalhando em um lote de ${categorias.length} categorias...`);

    // Inicia o navegador
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        // Loop Externo: Navega por cada categoria do nosso lote
        for (const categoria of categorias) {
            console.log(`\n==================================================`);
            console.log(`🎯 INICIANDO CATEGORIA: ${categoria.nome}`);
            console.log(`==================================================`);

            let paginaAtual = 1;
            let continuarPaginando = true;

            // Loop Interno: Navega nas páginas 1, 2, 3... da categoria atual
            while (continuarPaginando && paginaAtual <= LIMITE_PAGINAS_POR_CATEGORIA) {
                // Se for a primeira página, usa a URL normal. Depois, adiciona "?p=2", "?p=3"
                const urlAlvo = paginaAtual === 1 ? categoria.url_udemy : `${categoria.url_udemy}?p=${paginaAtual}`;
                
                console.log(`\n🌐 Acessando página ${paginaAtual} de ${LIMITE_PAGINAS_POR_CATEGORIA}...`);
                
                try {
                    await page.goto(urlAlvo, { waitUntil: 'networkidle2', timeout: 60000 });
                } catch (e) {
                    console.log(`⚠️ Demorou muito para carregar. Pulando página...`);
                    break; 
                }

                // Rola a página para baixo simulando a leitura e forçando o carregamento das imagens
                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let totalHeight = 0; let distance = 100;
                        let timer = setInterval(() => {
                            let scrollHeight = document.body.scrollHeight;
                            window.scrollBy(0, distance);
                            totalHeight += distance;
                            if(totalHeight >= scrollHeight - window.innerHeight){ clearInterval(timer); resolve(); }
                        }, 100);
                    });
                });

                // Lê o HTML e extrai as variáveis do curso
                const cursos = await page.evaluate(() => {
                    const lista = [];
                    // O seletor 'data-purpose="container"' é a blindagem contra mudanças de classe da Udemy
                    document.querySelectorAll('div[data-purpose="container"]').forEach(card => {
                        const titulo = card.querySelector('h3[data-purpose="course-title-url"]')?.innerText || '';
                        const autor = card.querySelector('div[data-purpose="safely-set-inner-html:course-card:visible-instructors"]')?.innerText || '';
                        const precoRaw = card.querySelector('div[data-purpose="course-price-text"]')?.innerText || '';
                        const nota = card.querySelector('span[data-purpose="rating-number"]')?.innerText || '';
                        const imagemUrl = card.querySelector('img')?.src || '';
                        const linkRelativo = card.querySelector('a')?.getAttribute('href') || '';
                        
                        // Limpa o lixo de SEO do preço, deixando só o valor numérico
                        let precoLimpo = '';
                        if (precoRaw.includes('R$')) {
                            const match = precoRaw.match(/R\$\s?[\d.,]+/);
                            precoLimpo = match ? match[0] : '';
                        }

                        // Filtro anti-propaganda: Só empacota se for um curso real
                        if (titulo && precoLimpo) {
                            lista.push({
                                titulo: titulo.split('\n')[0].trim(),
                                autor: autor.trim(), preco: precoLimpo, nota: nota.trim(),
                                imagemUrl, link: `https://www.udemy.com${linkRelativo}`
                            });
                        }
                    });
                    return lista;
                });

                // Sistema de parada: Se o robô não achou cursos, a categoria acabou antes do nosso limite
                if (cursos.length === 0) {
                    console.log(`⚠️ Nenhum curso encontrado na página ${paginaAtual}. Fim desta categoria!`);
                    continuarPaginando = false;
                    break;
                }

                console.log(`✅ Extraídos ${cursos.length} cursos. Injetando no banco...`);

                // Inserção à prova de redundância no Supabase
                for (const item of cursos) {
                    const slugGerado = gerarSlug(item.titulo);
                    
                    // UPSERT: Se o curso já existir, ele não duplica, ele apenas confirma/atualiza.
                    const { data: cursoInjetado } = await supabase
                        .from('cursos')
                        .upsert([{ titulo: item.titulo, slug: slugGerado, autor: item.autor, imagem_capa: item.imagemUrl, categoria_id: categoria.id }], { onConflict: 'slug' })
                        .select();
                    
                    // Com o ID do curso em mãos, insere o preço volátil na tabela de Ofertas
                    if (cursoInjetado && cursoInjetado.length > 0) {
                        const cursoId = cursoInjetado[0].id;
                        let precoNum = parseFloat(item.preco.replace(/[^0-9,.]/g, '').replace(',', '.'));
                        
                        await supabase.from('ofertas').insert([{ curso_id: cursoId, plataforma: 'Udemy', preco: precoNum || 0, nota_plataforma: item.nota, link_afiliado: item.link }]);
                    }
                }

                paginaAtual++;
                
                // Aplica a pausa humana antes de virar a página (entre 2 e 4 segundos)
                if (continuarPaginando && paginaAtual <= LIMITE_PAGINAS_POR_CATEGORIA) {
                    await pausaAleatoria(2000, 4000);
                }
            }

            // Concluiu a categoria. Marca a hora no banco para o robô não repeti-la tão cedo
            console.log(`\n✅ Categoria '${categoria.nome}' varrida até o limite. Marcando ponto no banco...`);
            await supabase
                .from('categorias')
                .update({ ultima_varredura: new Date().toISOString() })
                .eq('id', categoria.id);
            
            // Descanso humano antes de pular para a próxima categoria inteira (entre 4 e 8 segundos)
            console.log(`\n🧃 Trocando de categoria em instantes...`);
            await pausaAleatoria(4000, 8000);
        }

    } catch (erro) {
        console.error('❌ Erro no motor principal:', erro);
    } finally {
        await browser.close();
        console.log('\n🏁 Lote de categorias finalizado com sucesso. Navegador fechado.');
    }
}

// Start
iniciarCrawler();