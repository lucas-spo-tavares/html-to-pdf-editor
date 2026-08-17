# HTML to PDF Editor - Guia da POC

## Visao geral

Este projeto e uma POC de um editor visual single page para criar templates HTML exportaveis como PDF. A experiencia principal deve lembrar uma ferramenta de design como o Figma, mas com um escopo bem mais limitado e focado em documentos: paginas, objetos posicionaveis, propriedades visuais, variaveis de template e exportacao.

O editor tera dois modos principais:

- **Edicao**: preview visual com interacao direta nos objetos.
- **Codigo**: visualizacao readonly do HTML gerado.

O objetivo nao e criar um editor HTML generico. O objetivo e criar uma interface produtiva para montar templates reutilizaveis que aceitam dados dinamicos e podem ser renderizados com seguranca em PDF.

## Stack desejada

- React
- Tailwind CSS
- shadcn/ui como base de componentes
- Arquitetura com componentes atomicos
- Single page app
- Docker para renderizacao PDF
- Chromium + Puppeteer no container de PDF

## Configuracao Git desejada

Quando o repositorio for inicializado, usar a configuracao:

```ini
[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
[remote "origin"]
	url = git@github.com-personal:lucas-spo-tavares/html-to-pdf-editor.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
```

## Produto

O produto e um editor de templates HTML para PDF. O usuario monta uma ou mais views/paginas visualmente, adiciona objetos, configura propriedades e exporta o resultado como ZIP ou PDF.

### Casos de uso principais

- Criar layouts de documentos sem escrever HTML manualmente.
- Montar templates com variaveis como `{{ name }}` e `{{ user.name }}`.
- Usar estruturas condicionais e repeticoes no estilo Django template:

```html
<ul>
{% for user in users %}
  <li>{{ user.name }}</li>
{% endfor %}
</ul>
```

- Exportar o template como `.zip` contendo `index.html` e imagens.
- Renderizar o template como PDF.

## Modos da interface

### Modo edicao

O modo edicao combina preview e manipulacao visual. Ele deve permitir selecionar, mover, redimensionar e configurar objetos na pagina.

Elementos esperados:

- Canvas central com a pagina.
- Medidas visiveis.
- Regua horizontal e vertical.
- Grade visual configuravel.
- Seletor de tamanho de papel.
- Tamanho customizado.
- Painel lateral com propriedades do objeto selecionado.
- Objetos arrastaveis.
- Hints de posicionamento e alinhamento.
- Drag and drop de imagens do computador para o browser.

### Modo codigo

O modo codigo mostra o HTML gerado em readonly. Ele serve para transparencia e debug, nao para edicao direta nesta POC.

Elementos esperados:

- HTML formatado.
- Estado readonly claro.
- Alternancia facil entre edicao e codigo.

## Canvas e paginas

A unidade de trabalho visual e uma view/pagina. Cada pagina representa uma superficie que pode virar uma pagina do PDF.

### Tamanhos de papel

O editor deve permitir escolher tamanhos conhecidos e tambem medidas customizadas.

Sugestoes iniciais:

- A4
- A5
- Letter
- Legal
- Custom

As unidades precisam ficar visiveis na UI. A POC pode comecar com `mm`, `px` e talvez `in`, mas a representacao interna precisa ser consistente para evitar erro na renderizacao.

### Medidas e escala

O canvas pode exibir a pagina em escala visual, mas deve preservar dimensoes reais para exportacao. A interface precisa deixar claro quando o usuario esta vendo uma representacao escalada.

### Regua e grade

O visualizador do editor deve oferecer regua horizontal e vertical ao redor do canvas. A regua ajuda o usuario a entender coordenadas, dimensoes reais e posicionamento dos objetos dentro da pagina.

A grade visual deve poder ser exibida sobre a pagina para facilitar alinhamento e distribuicao dos elementos. Na POC, a grade pode comecar simples, com espacamento fixo baseado na unidade atual do documento.

Controles esperados:

- Mostrar/ocultar grade.
- Mostrar/ocultar regua.
- Configurar espacamento da grade.
- Opcionalmente ativar snap na grade.

A regua e a grade devem respeitar a escala visual do canvas, mas representar as medidas reais do documento. Por exemplo, em uma pagina A4 com unidade `mm`, as marcacoes devem continuar representando milimetros mesmo quando o canvas estiver com zoom reduzido.

## Objetos

Objetos sao essencialmente `divs` configuraveis. Textos, imagens e containers devem ser modelados como variacoes de objetos baseados em `div`.

### Tipos iniciais

- Container
- Texto
- Imagem como background de uma div
- Lista ou bloco repetivel para suporte a `for`
- Bloco condicional para suporte a `if`

### Propriedades comuns

- Posicao
- Largura e altura
- Margem
- Padding
- Background
- Border
- Border radius
- Opacidade
- Alinhamento interno
- Ordem/camada

### Posicionamento e layout interno

Decisao inicial: objetos sao posicionados de forma absoluta dentro da pagina. A pagina funciona como um sistema de coordenadas com origem no canto superior esquerdo. Cada objeto possui um `frame` com `x`, `y`, `width` e `height`, e o HTML gerado deve refletir isso com `position: absolute` dentro de uma pagina com `position: relative`.

Exemplo conceitual:

```ts
type Frame = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

Essa abordagem combina com a experiencia visual do editor, onde o usuario arrasta e posiciona elementos livremente no canvas.

Containers e grupos podem ter filhos. Nesse caso, o container continua tendo um frame absoluto em relacao ao pai, mas pode controlar o layout interno dos filhos usando propriedades como:

- `display: block`
- `display: flex`
- Direcao do flex.
- Alinhamento horizontal e vertical.
- Gap.
- Padding.

Assim, o editor pode combinar dois modelos:

- Posicionamento absoluto para organizar objetos na pagina.
- Layout interno por container para organizar conteudo dentro de uma area.

Exemplo:

```css
.page {
  position: relative;
  width: 210mm;
  height: 297mm;
}

.object {
  position: absolute;
  left: 20mm;
  top: 30mm;
  width: 100mm;
  height: 40mm;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 4mm;
  padding: 6mm;
}
```

Essa separacao deve deixar o modelo mais organizado: o `frame` responde pela posicao do objeto no canvas, enquanto as propriedades de layout do container respondem pela organizacao dos filhos.

### Texto

Objetos de texto devem permitir:

- Conteudo textual
- Variaveis como `{{ name }}`
- Bold
- Italico
- Rasurado
- Sublinhado, se fizer sentido
- Tamanho da fonte
- Familia da fonte
- Adicionar fontes novas ao documento
- Cor
- Alinhamento
- Altura de linha

### Fontes

O editor deve oferecer uma lista inicial de familias de fonte comuns, mas tambem permitir que o usuario adicione fontes novas ao documento.

Formas esperadas de adicionar fontes:

- Selecionar uma fonte do Google Fonts.
- Enviar um arquivo de fonte, como `.ttf`, `.otf`, `.woff` ou `.woff2`.

Quando uma fonte for adicionada ao documento, ela deve passar a aparecer no seletor de familia de fonte dos objetos de texto.

Fontes adicionadas pelo usuario devem ser tratadas como assets do template. Isso significa que:

- Devem ser incluidas no `.zip` exportado.
- Devem ser restauradas ao importar um `.zip` com `editor.json`.
- Devem ser enviadas para o renderer PDF junto com o HTML e as imagens.
- Devem ser declaradas no HTML/CSS gerado usando `@font-face`, quando forem arquivos locais.

Exemplo conceitual:

```css
@font-face {
  font-family: 'Minha Fonte';
  src: url('./assets/fonts/minha-fonte.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}
```

Para fontes do Google Fonts, a POC pode comecar salvando a URL de importacao ou stylesheet no estado do documento. Em uma evolucao mais robusta, o editor pode baixar e empacotar os arquivos da fonte para garantir que a renderizacao PDF seja reproduzivel mesmo sem depender de rede no container.

### Imagens

Imagens serao backgrounds de `divs`.

Fluxo esperado:

- Usuario arrasta uma imagem do computador para o browser.
- A imagem e adicionada aos assets do template.
- Um objeto de imagem e criado na view atual.
- O objeto usa `background-image`.
- O usuario pode configurar `cover`, `contain`, posicao e repeticao.

## Painel lateral

O painel lateral mostra as propriedades do objeto selecionado. Quando nada estiver selecionado, ele pode mostrar propriedades da pagina ou do documento.

### Estado com objeto selecionado

- Identificacao do objeto
- Tipo
- Posicao e tamanho
- Margem e padding
- Estilos visuais
- Estilos de texto quando aplicavel
- Configuracoes de template quando aplicavel

### Estado sem selecao

- Tamanho da pagina
- Unidade de medida
- Cor de fundo
- Configuracoes globais do documento

## Hints de alinhamento

A experiencia deve incluir guias visuais durante drag/resize:

- Alinhar ao centro horizontal da pagina.
- Alinhar ao centro vertical da pagina.
- Alinhar bordas entre objetos.
- Indicar distancias relevantes.
- Snap simples, se couber na POC.

## Templates dinamicos

O diferencial do projeto e permitir templates com dados dinamicos. A sintaxe preferida e parecida com Django templates.

### Variaveis

Exemplos:

```django
{{ name }}
{{ user.name }}
{{ invoice.total }}
```

A UI deve permitir inserir variaveis em textos sem obrigar o usuario a escrever o template inteiro manualmente.

### Condicionais

Exemplo:

```django
{% if user.is_active %}
  <p>Ativo</p>
{% endif %}
```

Ideia de UI para POC:

- Um objeto ou grupo pode ter uma condicao de visibilidade.
- O painel lateral exibe um campo "Renderizar se".
- O HTML gerado envolve o objeto com `{% if ... %}` e `{% endif %}`.

### Repeticoes

Exemplo:

```django
{% for user in users %}
  <div>{{ user.name }}</div>
{% endfor %}
```

Ideia de UI para POC:

- Um grupo pode ser marcado como repetivel.
- O painel lateral exibe campos:
  - Colecao: `users`
  - Item: `user`
- O HTML gerado envolve o grupo com `{% for user in users %}` e `{% endfor %}`.

### Desafio de produto

A parte mais importante da POC sera encontrar uma UI simples para `if` e `for`. A abordagem inicial deve evitar tentar representar toda a complexidade de Django templates. Em vez disso, a UI pode suportar apenas:

- Condicao de visibilidade em objeto/grupo.
- Grupo repetivel baseado em uma colecao.
- Variaveis dentro de textos.

## Exportacao

### Exportar ZIP

O ZIP deve conter:

- `index.html`
- Imagens/assets usados pelo template
- Possivelmente um arquivo de metadados do editor, se necessario para reabrir o projeto depois

### Importar ZIP

Tambem deve ser possivel importar um `.zip` gerado pelo proprio editor. Esse fluxo permite reabrir um template exportado anteriormente, continuar a edicao visual e exportar uma nova versao depois.

Fluxo esperado:

- Usuario seleciona ou arrasta um arquivo `.zip` para o editor.
- App valida se o pacote contem pelo menos um `index.html`.
- App carrega as imagens/assets referenciados pelo template.
- App procura um arquivo de metadados do editor, se existir.
- Quando houver metadados, o estado editavel do documento deve ser restaurado.
- Quando nao houver metadados, o app pode abrir o HTML em modo codigo/preview readonly ou oferecer uma importacao limitada.

Conteudo recomendado para ZIPs criados pelo editor:

- `index.html`: HTML renderizavel/exportavel.
- `assets/`: imagens e outros arquivos usados pelo template.
- `editor.json`: estado editavel do documento, incluindo paginas, objetos, estilos, assets e configuracoes globais.

Decisao inicial: a reabertura visual completa depende do `editor.json`. O `index.html` sozinho e suficiente para renderizar ou inspecionar o template, mas nao deve ser tratado como fonte confiavel para reconstruir perfeitamente o estado visual do editor.

### Exportar PDF

O PDF deve ser gerado por um servico Docker com Chromium e Puppeteer.

Fluxo esperado:

- Frontend envia HTML e assets para o servico de renderizacao.
- Servico monta a pagina em ambiente isolado.
- Puppeteer abre o HTML com Chromium.
- Puppeteer gera o PDF no tamanho correto.
- PDF e devolvido para download.

### Servico de renderizacao PDF

O renderizador de PDF deve ser tratado como um backend separado do editor visual. A responsabilidade dele e receber um pacote de renderizacao, preparar um ambiente temporario e usar Chromium via Puppeteer para produzir o PDF final.

Entrada esperada do servico:

- HTML final que sera renderizado.
- Imagens/assets usados pelo HTML.
- Propriedades de renderizacao, como tamanho da pagina, margens, orientacao e escala.
- Opcionalmente metadados do documento, como nome do arquivo sugerido.

Comportamento esperado:

- Criar um diretorio temporario por requisicao.
- Salvar o HTML recebido como arquivo local.
- Salvar os assets enviados em caminhos previsiveis.
- Abrir o HTML no Chromium usando Puppeteer.
- Esperar fontes, imagens e estilos carregarem antes de gerar o PDF.
- Renderizar o PDF usando as dimensoes reais configuradas no editor.
- Retornar o PDF como resposta binaria.
- Remover arquivos temporarios ao final da requisicao.

O servico nao deve ser responsavel por editar templates, interpretar a UI ou manter estado do documento. Ele deve ser uma camada pequena e deterministica: recebe HTML, assets e props; devolve PDF.

### Contrato inicial do renderer

Formato conceitual da requisicao:

```ts
type RenderPdfRequest = {
  html: string;
  assets: RenderAsset[];
  pdf: RenderPdfOptions;
};

type RenderAsset = {
  path: string;
  contentType: string;
  dataBase64: string;
};

type RenderPdfOptions = {
  width?: string;
  height?: string;
  format?: 'A4' | 'A5' | 'Letter' | 'Legal';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  scale?: number;
};
```

Exemplos de dimensoes aceitas:

- `210mm` x `297mm` para A4.
- `148mm` x `210mm` para A5.
- `8.5in` x `11in` para Letter.
- Medidas customizadas vindas do editor.

Decisao inicial: o frontend continua sendo o dono do HTML gerado e dos assets. O renderer apenas materializa esse pacote dentro do container e chama o Chromium.

### Container Docker do renderer

O container de PDF deve incluir:

- Node.js.
- Chromium ou Chrome compativel com Puppeteer.
- Dependencias de sistema exigidas pelo Chromium.
- Fontes basicas para renderizacao consistente.
- Um servidor HTTP simples para receber requisicoes de renderizacao.

Pontos importantes:

- O Chromium deve rodar em modo headless.
- O container deve expor apenas a API de renderizacao.
- O processo deve ter timeout por requisicao para evitar renderizacoes travadas.
- O tamanho maximo do payload deve ser limitado.
- Assets devem ser escritos apenas dentro do diretorio temporario da requisicao.
- Caminhos de assets precisam ser normalizados para evitar acesso fora do workspace temporario.
- A API deve retornar erros claros quando o HTML, os assets ou as opcoes forem invalidos.

Na POC, seguranca pode ser simples, mas o desenho deve considerar isolamento desde o inicio porque HTML arbitrario sera executado dentro do Chromium.

## Arquitetura inicial sugerida

### Frontend

Organizacao atomica sugerida:

```text
src/
  app/
  components/
    atoms/
    molecules/
    organisms/
    templates/
  editor/
    canvas/
    document/
    export/
    inspector/
    template-language/
    toolbar/
  lib/
  styles/
```

### Modelo de dados conceitual

```ts
type Document = {
  pages: Page[];
  assets: Asset[];
  unit: 'px' | 'mm' | 'in';
};

type Page = {
  id: string;
  name: string;
  size: PageSize;
  objects: EditorObject[];
};

type EditorObject = {
  id: string;
  type: 'container' | 'text' | 'image' | 'group';
  frame: Frame;
  style: ObjectStyle;
  template?: TemplateBehavior;
  children?: EditorObject[];
};

type TemplateBehavior = {
  if?: string;
  forEach?: {
    item: string;
    collection: string;
  };
};
```

Esse modelo ainda e apenas guia. A implementacao pode ajustar nomes e estruturas conforme a base do app evoluir.

## Escopo da POC

### Deve ter

- App React single page.
- Canvas com pagina.
- Selecao e movimentacao de objetos.
- Criacao de objetos basicos.
- Painel lateral de propriedades.
- Tamanhos de papel e tamanho customizado.
- Unidades visiveis.
- Texto com estilos basicos.
- Imagem via drag and drop.
- Variaveis em texto.
- Condicao simples em objeto/grupo.
- Repeticao simples em grupo.
- Modo codigo readonly.
- Exportacao ZIP.
- Renderizacao PDF via Docker + Puppeteer.

### Pode ficar simples

- Snap e hints de alinhamento.
- Redimensionamento.
- Layers/camadas.
- Reabertura de arquivos exportados.
- Validacao profunda da sintaxe de template.
- Suporte completo a Django template language.

### Fora do escopo inicial

- Colaboracao em tempo real.
- Login/contas.
- Biblioteca completa de componentes.
- Editor de codigo editavel.
- Sistema completo de design tokens.
- Compatibilidade perfeita com todos os recursos de CSS para print.

## Decisoes em aberto

- Unidade interna principal: `px`, `mm` ou modelo hibrido?
- Como salvar/reabrir o estado editavel do template?
- O HTML exportado deve conter CSS inline ou stylesheet separado?
- O renderizador deve aceitar dados mockados para preview de templates?
- O suporte a Django templates sera apenas geracao de sintaxe ou tambem renderizacao com dados no preview?
- A POC precisa suportar multiplas paginas desde o inicio ou pode comecar com uma pagina?

## Primeira base tecnica proposta

Quando for hora de implementar, criar:

- Base React com Vite.
- Tailwind CSS.
- Componentes inspirados em shadcn/ui.
- Estado local do editor inicialmente em React state ou Zustand.
- Gerador de HTML separado do canvas.
- Servico `pdf-renderer` em Docker usando Puppeteer.
- Scripts de desenvolvimento para frontend e renderer.

## Criterio de sucesso da POC

A POC sera considerada boa se permitir criar visualmente um template simples com texto, imagem, variaveis, um bloco condicional e um bloco repetivel, visualizar o HTML readonly e exportar um PDF gerado por Chromium com aparencia consistente.
