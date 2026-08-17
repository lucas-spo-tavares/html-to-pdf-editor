# HTML to PDF Editor - Guia da POC

## Visao geral

Este projeto e uma POC de um editor visual single page para criar templates HTML exportaveis como PDF. A experiencia principal deve lembrar uma ferramenta de design como o Figma, mas com um escopo bem mais limitado e focado em documentos: paginas, objetos posicionaveis, propriedades visuais, variaveis de template e exportacao.

O editor tera tres modos principais:

- **Edicao**: canvas visual com interacao direta nos objetos.
- **Preview**: visualizacao do HTML final renderizado com o contexto JSON, sem controles de edicao.
- **Codigo**: visualizacao readonly do HTML template gerado.

O objetivo nao e criar um editor HTML generico. O objetivo e criar uma interface produtiva para montar templates reutilizaveis que aceitam dados dinamicos e podem ser renderizados com seguranca em PDF.

## Stack desejada

- React
- Tailwind CSS
- shadcn/ui como base de componentes
- Arquitetura com componentes atomicos
- Single page app
- Renderizacao PDF pelo frontend na POC

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

O modo edicao combina canvas visual e manipulacao direta. Ele deve permitir selecionar, mover, redimensionar e configurar objetos na pagina.

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

### Modo preview

O modo preview mostra o documento final renderizado pelo frontend a partir do HTML template e do contexto JSON atual. Ele serve para validar rapidamente o resultado visual sem precisar acionar exportacao PDF toda hora.

Comportamentos esperados:

- Renderizar variaveis `{{ }}` com os dados do contexto.
- Aplicar condicionais e repeticoes suportadas pela engine de template.
- Mostrar o documento sem controles de selecao, drag, resize ou painel de propriedades de objeto.
- Usar as mesmas dimensoes de pagina, fontes, imagens e estilos que serao usados no PDF.
- Atualizar quando o template, os objetos, assets ou o contexto valido mudarem.
- Exibir erro claro quando a renderizacao do template falhar.
- Permitir acionar exportacao PDF a partir dessa visualizacao.

Esse modo deve representar o HTML final que o navegador vai imprimir/salvar como PDF. Ele nao substitui o modo codigo, porque o modo codigo mostra o template com `{{ }}`, `{% if %}` e `{% for %}`, enquanto o preview mostra o resultado ja resolvido.

### Modo codigo

O modo codigo mostra o HTML template gerado em readonly. Ele serve para transparencia e debug, nao para edicao direta nesta POC.

Elementos esperados:

- HTML formatado.
- Formatar automaticamente o HTML gerado quando o modo codigo for aberto.
- Syntax highlight para HTML, CSS inline e expressoes de template.
- Estado readonly claro.
- Alternancia facil entre edicao, preview e codigo.

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
- Highlight visual para variaveis dentro do texto.
- Autocomplete de variaveis baseado no contexto conhecido.
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

### Edicao de texto com variaveis

Ao editar o conteudo de um objeto de texto, o usuario deve ter uma experiencia de escrita assistida para variaveis. O objetivo nao e expor um editor completo de sintaxe Django nesse campo, mas sim ajudar a escrever interpolacoes simples no formato `{{ variavel }}` e `{{ objeto.atributo }}`.

Comportamentos esperados:

- Realcar visualmente trechos como `{{ name }}` e `{{ user.name }}` dentro do texto.
- Detectar quando o usuario esta escrevendo dentro de `{{ }}`.
- Sugerir variaveis disponiveis a partir de um contexto conhecido.
- Sugerir atributos quando o usuario escrever um prefixo com ponto, como `user.`.
- Inserir a sugestao selecionada sem quebrar o restante do texto.
- Manter o texto normal editavel ao redor das variaveis.

Exemplo de contexto:

```json
{
  "user": {
    "name": "Lucas",
    "age": 32
  },
  "invoice": {
    "total": "R$ 120,00"
  }
}
```

Exemplos de autocomplete:

- Ao digitar `{{ u`, sugerir `user`.
- Ao digitar `{{ user.`, sugerir `name` e `age`.
- Ao digitar `{{ invoice.`, sugerir `total`.

Na POC, esse contexto pode vir de dados mockados configurados no documento. No futuro, pode vir de uma amostra real de dados ou de um schema informado pelo usuario.

Essa experiencia de highlight e autocomplete se aplica principalmente a variaveis simples. Condicionais e repeticoes continuam sendo configuradas por propriedades do objeto/grupo no painel lateral, em vez de exigir que o usuario escreva blocos Django manualmente dentro do texto.

O autocomplete deve usar a ultima versao valida do contexto JSON do documento. Se o usuario estiver editando o contexto e deixar o JSON temporariamente invalido, as sugestoes podem continuar usando o ultimo contexto valido ate que a sintaxe seja corrigida.

### Fontes

O editor deve oferecer uma lista inicial de familias de fonte comuns, mas tambem permitir que o usuario adicione fontes novas ao documento.

Formas esperadas de adicionar fontes:

- Selecionar uma fonte do Google Fonts.
- Enviar um arquivo de fonte, como `.ttf`, `.otf`, `.woff` ou `.woff2`.

Quando uma fonte for adicionada ao documento, ela deve passar a aparecer no seletor de familia de fonte dos objetos de texto.

Fontes adicionadas pelo usuario devem ser tratadas como assets do template. Isso significa que:

- Devem ser incluidas no `.zip` exportado.
- Devem ser restauradas ao importar um `.zip` com `editor.json`.
- Devem estar disponiveis para o exportador PDF do frontend junto com o HTML e as imagens.
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

Para fontes do Google Fonts, a POC pode comecar salvando a URL de importacao ou stylesheet no estado do documento. Em uma evolucao mais robusta, o editor pode baixar e empacotar os arquivos da fonte para garantir que a renderizacao PDF seja reproduzivel sem depender de rede no momento da exportacao.

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
- Contexto JSON do template.

### Contexto JSON do template

O editor deve oferecer um campo para configurar o contexto de dados do template. Esse campo pode ficar no painel lateral quando nenhum objeto estiver selecionado, em uma aba de configuracoes do documento ou em um painel dedicado de dados.

O contexto deve ser editado como JSON e usado para:

- Sugerir variaveis no autocomplete dos objetos de texto.
- Renderizar preview com dados mockados.
- Enviar dados para o exportador PDF do frontend quando o usuario exportar um PDF.
- Testar condicionais e repeticoes configuradas nos objetos/grupos.

Comportamentos esperados do editor de contexto:

- Highlight de JSON.
- Validacao de sintaxe em tempo real.
- Mensagem clara quando o JSON estiver invalido.
- Indicacao visual do local aproximado do erro, se possivel.
- Suporte a indentacao.
- Tecla `Tab` deve inserir indentacao no campo, em vez de tirar o foco do editor.
- O contexto valido deve ser salvo no estado do documento.
- O contexto invalido nao deve sobrescrever a ultima versao valida usada pelo preview/autocomplete.

Exemplo:

```json
{
  "user": {
    "name": "Lucas",
    "age": 32
  },
  "items": [
    {
      "name": "Produto A",
      "price": 10
    }
  ]
}
```

## Hints de alinhamento

A experiencia deve incluir guias visuais durante drag/resize:

- Alinhar ao centro horizontal da pagina.
- Alinhar ao centro vertical da pagina.
- Alinhar bordas entre objetos.
- Indicar distancias relevantes.
- Snap simples, se couber na POC.

## Templates dinamicos

O diferencial do projeto e permitir templates com dados dinamicos. Para textos, a experiencia principal deve focar em interpolacoes simples no formato `{{ variavel }}` e `{{ objeto.atributo }}`. Para o HTML final, a sintaxe gerada pode usar recursos de template Django, especialmente em condicionais e repeticoes.

### Variaveis

Exemplos:

```django
{{ name }}
{{ user.name }}
{{ invoice.total }}
```

A UI deve permitir inserir variaveis em textos sem obrigar o usuario a escrever o template inteiro manualmente.
O campo de texto deve ter highlight e autocomplete para interpolacoes `{{ }}`, usando o contexto conhecido do documento para sugerir nomes e atributos.

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

### Renderizacao de template no frontend

Como a POC sera frontend-only, o frontend precisa conseguir renderizar o template com o contexto JSON do documento.

Decisao inicial: usar uma engine JavaScript compativel com sintaxe Django-like, como Nunjucks, para renderizar preview e PDF no proprio browser.

Essa engine deve cobrir pelo menos:

- Variaveis: `{{ user.name }}`.
- Condicionais: `{% if user.is_active %}`.
- Repeticoes: `{% for user in users %}`.

O frontend deve tratar essa renderizacao como a base da POC:

- Preview visual com dados do contexto.
- Modo codigo mostrando o template gerado.
- Modo preview mostrando o HTML final renderizado.
- Exportacao PDF a partir do HTML final renderizado no browser.

Ponto importante: a sintaxe escolhida deve ser Django-like, mas o produto nao precisa prometer compatibilidade total com Django. A POC deve suportar um subconjunto bem definido: variaveis, `if` simples e `for` simples.

Exemplo conceitual:

```ts
type RenderTemplateContext = Record<string, unknown>;
```

Exemplo de payload:

```json
{
  "html": "<p>Ola, {{ user.name }}</p>",
  "context": {
    "user": {
      "name": "Lucas"
    }
  }
}
```

Resultado intermediario depois de renderizar o template no frontend:

```html
<p>Ola, Lucas</p>
```

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

Decisao da POC: gerar o PDF diretamente pelo frontend. O editor ja tem o template, os assets e o contexto; portanto, a abordagem deve ser renderizar o template no browser, montar o HTML final e disparar a exportacao PDF no proprio cliente.

Fluxo esperado:

- Frontend gera o HTML template.
- Frontend renderiza o template com o contexto JSON do documento.
- Frontend monta uma view final/isolada do documento renderizado, reaproveitando a mesma base do modo preview.
- Frontend gera o PDF a partir dessa view.
- PDF e baixado pelo usuario.

Essa abordagem reduz a complexidade porque mantem a POC como uma aplicacao single page.

Opcoes possiveis para gerar PDF no frontend:

- Usar `window.print()` com CSS de print e permitir que o usuario salve como PDF pelo navegador.
- Usar uma iframe/janela isolada para montar o HTML final e chamar print/exportacao.

Decisao inicial: usar o motor de renderizacao do proprio navegador para gerar o PDF, sem bibliotecas client-side de PDF. A exportacao deve se apoiar em HTML, CSS de print e no fluxo nativo de impressao/salvar como PDF do browser.

Limitacoes esperadas:

- Fidelidade de CSS pode variar entre navegadores.
- Controle de paginacao pode ser mais limitado.
- Fontes, imagens grandes e layouts complexos podem exigir ajustes.

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
- Modo preview do HTML renderizado.
- Modo codigo readonly com syntax highlight.
- Exportacao ZIP.
- Renderizacao de template no frontend usando contexto JSON.
- Exportacao PDF pelo frontend.

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
- Como estruturar CSS de print para preservar tamanho real, margens e quebras de pagina?
- O suporte a template Django-like deve ficar limitado a variaveis, `if` e `for` simples?
- A POC precisa suportar multiplas paginas desde o inicio ou pode comecar com uma pagina?

## Primeira base tecnica proposta

Quando for hora de implementar, criar:

- Base React com Vite.
- Tailwind CSS.
- Componentes inspirados em shadcn/ui.
- Estado local do editor inicialmente em React state ou Zustand.
- Gerador de HTML separado do canvas.
- Renderer de template no frontend, provavelmente usando Nunjucks ou engine equivalente.
- Exportacao PDF usando o motor de renderizacao do navegador e CSS de print.
- Scripts de desenvolvimento para o frontend.

## Criterio de sucesso da POC

A POC sera considerada boa se permitir criar visualmente um template simples com texto, imagem, variaveis, um bloco condicional e um bloco repetivel, visualizar o HTML readonly, renderizar o template com contexto JSON no frontend e exportar um PDF pelo browser com aparencia aceitavel.
