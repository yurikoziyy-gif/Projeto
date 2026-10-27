const form = document.querySelector('#form-pokemon');
const feedback = document.querySelector('#feedback');
const listaCards = document.querySelector('#lista-cards');

const campoTreinador = document.querySelector('#treinador');
const campoNome = document.querySelector('#nome');
const campoTipo = document.querySelector('#tipo');
const campoCP = document.querySelector('#cp');

const btnReset = document.querySelector('#btn-reset');
const sugestoes = document.querySelector('#sugestoes');

const URL_POKEAPI = 'https://pokeapi.co/api/v2/pokemon';

let pokemonSelecionado = null;
let temporizadorBusca = null;
let numeroBusca = 0;

const pokemonsCadastrados = new Set();

// Busca os dados do Pokémon na PokeAPI.
async function buscarDadosPokemon(nome) {
    const nomeFormatado = nome.toLowerCase().trim();

    if (!nomeFormatado) {
        return null;
    }

    try {
        const resposta = await fetch(
            `${URL_POKEAPI}/${encodeURIComponent(nomeFormatado)}`
        );

        if (!resposta.ok) {
            return null;
        }

        return await resposta.json();
    } catch (error) {
        console.error('Erro ao buscar Pokémon:', error);
        return null;
    }
}

function extrairImagemPokemon(dadosPokemon) {
    if (!dadosPokemon) {
        return null;
    }

    return (
        dadosPokemon.sprites?.other?.['official-artwork']?.front_default ||
        dadosPokemon.sprites?.front_default ||
        null
    );
}

function extrairTipoPokemon(dadosPokemon) {
    if (!dadosPokemon?.types) {
        return 'desconhecido';
    }

    return dadosPokemon.types
        .map(item => item.type.name)
        .join(', ');
}

function preencherDadosPokemon(dadosPokemon) {
    pokemonSelecionado = dadosPokemon;

    campoNome.value = dadosPokemon.name;
    campoTipo.value = extrairTipoPokemon(dadosPokemon);

    sugestoes.replaceChildren();
    feedback.textContent = 'Pokémon encontrado!';
    feedback.style.color = 'lightgreen';
}

function mostrarSugestao(dadosPokemon) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'sugestao';

    const imagem = document.createElement('img');
    imagem.src = extrairImagemPokemon(dadosPokemon) || '';
    imagem.alt = '';

    const texto = document.createElement('span');
    texto.textContent = dadosPokemon.name;

    botao.append(imagem, texto);

    botao.addEventListener('click', () => {
        preencherDadosPokemon(dadosPokemon);
    });

    sugestoes.replaceChildren(botao);
}

campoNome.addEventListener('input', () => {
    clearTimeout(temporizadorBusca);

    pokemonSelecionado = null;
    campoTipo.value = '';
    sugestoes.replaceChildren();

    const nome = campoNome.value.trim();
    const buscaAtual = ++numeroBusca;

    if (nome.length < 3) {
        feedback.textContent = '';
        return;
    }

    feedback.textContent = 'Procurando Pokémon...';
    feedback.style.color = '#fec7c7';

    temporizadorBusca = setTimeout(async () => {
        const dadosPokemon = await buscarDadosPokemon(nome);

        if (buscaAtual !== numeroBusca) {
            return;
        }

        if (!dadosPokemon) {
            feedback.textContent = 'Pokémon não encontrado. Confira o nome em inglês.';
            feedback.style.color = '#ff7777';
            return;
        }

        mostrarSugestao(dadosPokemon);
        feedback.textContent = 'Selecione a sugestão ou continue para cadastrar.';
        feedback.style.color = '#fec7c7';
    }, 500);
});

function criarCardPokemon(nome, imagem, tipo, combatPower, treinador) {
    const card = document.createElement('article');
    card.className = 'card-pokemon';
    const tipoPrincipal = tipo.split(',')[0].trim().toLowerCase();
    const cor = obterCorPorTipo(tipoPrincipal);

    card.style.setProperty('--cor-pokemon', cor);

    const img = document.createElement('img');
    img.className = 'card-pokemon-img';
    img.src = imagem || 'https://placehold.co/200x200?text=Pokemon';
    img.alt = `Imagem de ${nome}`;
    img.loading = 'lazy';

    const nomeCard = document.createElement('h3');
    nomeCard.className = 'card-pokemon-nome';
    nomeCard.textContent = nome;

    const nomeTreinador = document.createElement('p');
    nomeTreinador.className = 'card-pokemon-info';
    nomeTreinador.textContent = `Treinador: ${treinador}`;

    const tipoCard = document.createElement('p');
    tipoCard.className = 'card-pokemon-info';
    tipoCard.textContent = 'Tipo:';

    const tipos = document.createElement('span');
    tipos.className = 'card-pokemon-tipo';
    tipos.textContent = tipo;

    tipoCard.append(tipos);

    const cp = document.createElement('p');
    cp.className = 'card-pokemon-info';
    cp.textContent = `CP: ${combatPower}`;

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'btn-remover';
    btnRemover.textContent = 'Remover';

    btnRemover.addEventListener('click', () => {
        card.remove();

        pokemonsCadastrados.delete(nome.toLowerCase());
    });

    card.append(
        img,
        nomeCard,
        nomeTreinador,
        tipoCard,
        cp,
        btnRemover
    );

    listaCards.appendChild(card);
}

form.addEventListener('submit', async event => {
    event.preventDefault();

    const treinador = campoTreinador.value.trim();
    const nome = campoNome.value.trim();
    const cp = Number(campoCP.value);

    if (!treinador) {
        feedback.textContent = 'Informe o nome do treinador.';
        feedback.style.color = '#ff7777';
        campoTreinador.focus();
        return;
    }

    if (nome.length < 3) {
        feedback.textContent = 'Digite um nome válido para o Pokémon.';
        feedback.style.color = '#ff7777';
        campoNome.focus();
        return;
    }

    if (!Number.isFinite(cp) || cp < 100) {
        feedback.textContent = 'O CP deve ser maior ou igual a 100.';
        feedback.style.color = '#ff7777';
        campoCP.focus();
        return;
    }

    if (pokemonsCadastrados.has(nome.toLowerCase())) {
        feedback.textContent = 'Este Pokémon já está cadastrado!';
        feedback.style.color = '#ff7777';
        campoNome.focus();
        return;
    }

    feedback.textContent = 'Carregando Pokémon...';
    feedback.style.color = '#fec7c7';

    let dadosPokemon = pokemonSelecionado;

    if (!dadosPokemon || dadosPokemon.name !== nome.toLowerCase()) {
        dadosPokemon = await buscarDadosPokemon(nome);
    }

    if (!dadosPokemon) {
        feedback.textContent =
            'Não foi possível encontrar esse Pokémon na PokeAPI.';
        feedback.style.color = '#ff7777';
        return;
    }

    if (pokemonsCadastrados.has(dadosPokemon.name)) {
        feedback.textContent = 'Este Pokémon já está cadastrado!';
        feedback.style.color = '#ff7777';
        return;
    }

    pokemonsCadastrados.add(dadosPokemon.name);

    criarCardPokemon(
        dadosPokemon.name,
        extrairImagemPokemon(dadosPokemon),
        extrairTipoPokemon(dadosPokemon),
        cp,
        treinador
    );

    feedback.textContent = 'Pokémon cadastrado com sucesso!';
    feedback.style.color = 'lightgreen';

    form.reset();
    sugestoes.replaceChildren();
    pokemonSelecionado = null;
    numeroBusca++;
    clearTimeout(temporizadorBusca);
});


btnReset.addEventListener('click', () => {
    form.reset();
    sugestoes.replaceChildren();
    feedback.textContent = '';
    pokemonSelecionado = null;
    numeroBusca++;
    clearTimeout(temporizadorBusca);
});


function obterCorPorTipo(tipo) {
    const cores = {
        fire: '#e25838',
        water: '#368ce7',
        electric: '#e5b923',
        grass: '#4aab62',
        ice: '#69caca',
        fighting: '#c44b55',
        poison: '#a45ac4',
        ground: '#c49a55',
        flying: '#8b9ee8',
        psychic: '#e85d91',
        bug: '#91a832',
        rock: '#a99a62',
        ghost: '#7055a8',
        dragon: '#6650df',
        dark: '#62566a',
        steel: '#8999a8',
        fairy: '#df8ebd'
    };

    return cores[tipo.toLowerCase()] || '#523636';
}