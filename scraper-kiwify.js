require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline'); // Biblioteca nativa do Node para ler o terminal

puppeteer.use(StealthPlugin());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const gerarSlug = (texto) => texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// Cria a interface para conversarmos com o robô pelo terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🥝 Iniciando o Motor Híbrido da Kiwify...\n');

// 1. Pergunta para qual "gaveta" do banco os cursos vão
rl.question('👉 Digite o "slug" exato da categoria no seu banco (ex: programacao, marketing-digital, financas): ', async (slugCategoria) => {
    
    // Verifica se a categoria existe no banco antes de começar
    const { data: categoria, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('slug', slugCategoria.trim())
        .single();

    if (error || !categoria) {
        console.log(`❌ Categoria com slug "${slugCategoria}" não encontrada no Supabase. Cancele e tente novamente.`);
        return rl.close();
    }

    console.log(`\n✅ Destino confirmado: Os cursos irão para a categoria [${categoria.nome}].`);
    
    // Inicia o navegador
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log('\n🌐 Abrindo a tela de Login da Kiwify...');
    await page.goto('https://dashboard.kiwify.com.br/login', { waitUntil: 'networkidle2' });

    console.log('\n=============================================================');
    console.log('🛑 CONTROLE MANUAL ATIVADO:');
    console.log('1. Faça o seu login na janela do Chrome que abriu.');
    console.log('2. Vá no menu lateral e clique em "Marketplace".');
    console.log('3. Clique em "Filters" e selecione a categoria desejada.');
    console.log('=============================================================\n');

    // 2. O Robô fica dormindo até você dar a ordem
    rl.question('✅ Quando os cursos estiverem na tela, APERTE ENTER AQUI NO TERMINAL para o robô começar a raspar: ', async () => {
        rl.close(); // Fecha o leitor do terminal
        console.log('\n🤖 Controle devolvido ao Robô. Iniciando varredura...');

        try {
            // Infinite Scroll Profissional: Rola a página até ela parar de crescer
            console.log('⏳ Rolando a página para carregar todos os cursos visíveis...');
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0; 
                    let distance = 400; // Desce 400px por vez
                    let tentativasSemCrescer = 0;
                    
                    let timer = setInterval(() => {
                        let scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        // Se a gente chegou no final da tela
                        if(totalHeight >= scrollHeight - window.innerHeight){
                            tentativasSemCrescer++;
                            // Se bater no fundo 4 vezes e não carregar nada novo, acabou a lista
                            if(tentativasSemCrescer >= 4) {
                                clearInterval(timer);
                                resolve();
                            }
                        } else {
                            tentativasSemCrescer = 0; // Reset
                        }
                    }, 800); // 800ms de intervalo para dar tempo da API da Kiwify responder
                });
            });

            console.log('🔍 Tela totalmente rolada. Extraindo os dados HTML...');

            // Lógica de extração baseada no HTML que você forneceu
            const cursos = await page.evaluate(() => {
                const lista = [];
                // Pega todos os cards brancos da vitrine
                const cards = document.querySelectorAll('li.bg-white.shadow-md');

                cards.forEach(card => {
                    const tituloNode = card.querySelector('.font-medium');
                    const titulo = tituloNode ? tituloNode.innerText.trim() : '';

                    const autorNode = card.querySelector('.text-sm span.text-gray-500');
                    let autor = autorNode ? autorNode.innerText.trim() : '';
                    if (autor.toLowerCase().startsWith('por ')) {
                        autor = autor.substring(4).trim(); // Remove a palavra "Por " do início
                    }

                    // A Kiwify tem a comissão e o preço. Nós queremos o preço máximo.
                    const divsCinzas = card.querySelectorAll('.text-sm.text-gray-500');
                    let precoLimpo = '';
                    divsCinzas.forEach(div => {
                        if(div.innerText.includes('Preço máximo do produto')) {
                            const match = div.innerText.match(/R\$\s?[\d.,]+/);
                            if(match) precoLimpo = match[0];
                        }
                    });

                    // Pega a URL do link (Precisa colocar o domínio base antes)
                    const linkNode = card.querySelector('a');
                    const link = linkNode ? 'https://dashboard.kiwify.com.br' + linkNode.getAttribute('href') : '';

                    // Pega a imagem real (Kiwify usa img absoluta)
                    const imgNode = card.querySelector('img.absolute');
                    const imagemUrl = imgNode ? imgNode.src : '';

                    // Kiwify não mostra nota no marketplace aberto
                    const nota = '0.0';

                    if (titulo && precoLimpo) {
                        lista.push({ titulo, autor, preco: precoLimpo, nota, imagemUrl, link });
                    }
                });
                return lista;
            });

            if (cursos.length === 0) {
                console.log(`⚠️ Nenhum curso capturado na tela atual.`);
            } else {
                console.log(`✅ Sucesso! Extraídos ${cursos.length} cursos da Kiwify. Injetando no banco...`);

                // Inserção no Supabase usando o ID da categoria que buscamos lá no início
                for (const item of cursos) {
                    const slugGerado = gerarSlug(item.titulo);
                    
                    const { data: cursoInjetado } = await supabase
                        .from('cursos')
                        .upsert([{ titulo: item.titulo, slug: slugGerado, autor: item.autor, imagem_capa: item.imagemUrl, categoria_id: categoria.id }], { onConflict: 'slug' })
                        .select();
                    
                    if (cursoInjetado && cursoInjetado.length > 0) {
                        const cursoId = cursoInjetado[0].id;
                        let precoNum = parseFloat(item.preco.replace(/[^0-9,.]/g, '').replace(',', '.'));
                        
                        await supabase.from('ofertas').insert([{ curso_id: cursoId, plataforma: 'Kiwify', preco: precoNum || 0, nota_plataforma: item.nota, link_afiliado: item.link }]);
                    }
                }
                console.log(`\n🎉 Finalizado! Todos os cursos vinculados à categoria ${categoria.nome}.`);
            }

        } catch (erro) {
            console.error('❌ Erro no motor de extração:', erro);
        } finally {
            await browser.close();
            console.log('🔌 Motor desligado.');
        }
    });
});