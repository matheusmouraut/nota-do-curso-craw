const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Configuração do Supabase (Substitua com suas chaves reais!)
const supabaseUrl = 'https://ibysmcevaqatjdnqghcg.supabase.co';
const supabaseKey = 'sb_publishable_aEsrcsskWbt9tzy_-FD50w__KkhnxYz';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para criar links amigáveis (slugs). Ex: "Curso de JS" -> "curso-de-js"
const gerarSlug = (texto) => {
    return texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Troca espaços e símbolos por traço
        .replace(/(^-|-$)+/g, ''); // Tira traços sobrando nas pontas
};

async function injetarDados() {
    console.log('🚀 Iniciando a injeção de dados no Supabase...');

    // 2. Lê o arquivo JSON que criamos mais cedo
    const rawData = fs.readFileSync('cursos_extraidos.json', 'utf-8');
    const cursosExtraidoss = JSON.parse(rawData);

    for (const item of cursosExtraidoss) {
        try {
            const slugGerado = gerarSlug(item.titulo);
            
            // 3. Insere na tabela CURSOS
            const { data: cursoInserido, error: erroCurso } = await supabase
                .from('cursos')
                .insert([{ 
                    titulo: item.titulo, 
                    slug: slugGerado,
                    autor: item.autor,
                    imagem_capa: item.imagemUrl
                }])
                .select(); // Retorna o dado inserido para pegarmos o ID

            // Se o curso já existir (slug duplicado), ele dá erro e pula pro próximo
            if (erroCurso) {
                console.log(`⚠️ Pulando "${item.titulo}": Provável duplicata ou erro. (${erroCurso.message})`);
                continue; 
            }

            const cursoId = cursoInserido[0].id;

            // 4. Formata o preço para número (tira o R$ e converte vírgula pra ponto)
            let precoNumero = parseFloat(item.preco.replace(/[^0-9,.]/g, '').replace(',', '.'));
            if (isNaN(precoNumero)) precoNumero = 0;

            // 5. Insere na tabela OFERTAS usando o ID do curso criado acima
            const { error: erroOferta } = await supabase
                .from('ofertas')
                .insert([{
                    curso_id: cursoId,
                    plataforma: 'Udemy',
                    preco: precoNumero,
                    nota_plataforma: item.nota,
                    link_afiliado: item.link
                }]);

            if (erroOferta) {
                console.error(`❌ Erro ao inserir oferta de "${item.titulo}":`, erroOferta.message);
            } else {
                console.log(`✅ Sucesso: "${item.titulo}" inserido!`);
            }

        } catch (err) {
            console.error('Erro crítico no loop:', err);
        }
    }
    
    console.log('🎉 Finalizado! Pode conferir o banco de dados no painel do Supabase.');
}

injetarDados();