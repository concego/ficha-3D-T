# Ficha acessível 3D&T Alpha

Ficha de fã para 3D&T Alpha, publicada como página estática no GitHub Pages.

## Baixar e usar

Acesse a [release v1.0.3](https://github.com/concego/ficha-3D-T/releases/tag/v1.0.3) e baixe **Source code (zip)**. Extraia o arquivo e abra `index.html` em um navegador atualizado. Não é necessário instalar servidor nem dependências para usar a ficha localmente.

A versão online está no [GitHub Pages](https://concego.github.io/ficha-3D-T/).

## Instalar como aplicativo e usar offline

A versão hospedada por HTTPS é um PWA instalável. Na primeira visita, conecte-se à internet para que o navegador carregue a ficha e armazene os arquivos do aplicativo. Depois, a opção de instalação pode aparecer no menu do navegador como **Instalar app** ou **Adicionar à tela inicial**. Os nomes e a disponibilidade variam entre navegadores e dispositivos; a ficha não abre uma solicitação de instalação automática.

O service worker guarda em cache a página, o CSS, o JavaScript, o manifesto e os ícones. Depois do primeiro carregamento e da instalação do cache, a ficha pode ser aberta sem conexão. As fichas dos personagens continuam salvas localmente no navegador e não são sincronizadas entre aparelhos.

Abrir `index.html` diretamente do ZIP permite usar a ficha, mas não instala o service worker nem habilita a instalação PWA. Para isso, use a versão hospedada por HTTPS.

## Recursos

- Vários personagens com salvamento local no navegador.
- PV e PM calculados a partir dos atributos efetivos, incluindo vantagens permanentes e bônus diretos permanentes de PV/PM.
- Rolagens de ataque corpo a corpo, ataque à distância, defesa, iniciativa, testes de característica e dados livres.
- Bônus numéricos separados em permanentes e temporários: os permanentes ficam sempre ativos e não gastam PM; os temporários marcados são usados uma única vez na próxima rolagem compatível.
- O custo em PM do bônus temporário só é cobrado quando ele se aplica. Efeitos temporários incompatíveis com a rolagem permanecem ativos; efeitos usados são desativados após a rolagem compatível.
- Acertos críticos, falhas críticas e sucessos automáticos nos testes conforme a implementação da ficha anexada.
- Vantagens, desvantagens e vantagem única com efeitos narrativos, permanentes ou temporários, alvos configuráveis e custo de PM.
- Perícias, magias e técnicas com custo em pontos/PM e ação de uso.
- Inventário, dinheiro, história, modo de leitura da biografia, notas rápidas e diário de sessões.
- Histórico das últimas rolagens, resumo copiável, backup e restauração por JSON.
- Interface responsiva, operação por teclado, rótulos de campos, avisos acessíveis e foco visível.

## Dados e importação

As fichas são salvas localmente no navegador. A partir da versão 1.0.2, a ficha usa uma nova chave de armazenamento local; fichas salvas por versões anteriores não são carregadas automaticamente. Isso evita misturar os dados antigos com o formato atual. Para trazer uma ficha anterior, use um backup JSON e importe-o pela opção de importação da ficha. A importação JSON ainda normaliza modos antigos de efeito quando necessário.

Faça backups JSON periódicos se quiser guardar ou transferir suas fichas. Limpar os dados do site no navegador apaga as fichas guardadas naquele navegador.

## Regras

Os cálculos automatizam as opções registradas na ficha; custos e interpretações podem variar por mesa. PV e PM, efeitos e testes devem ser conferidos com o material de referência utilizado na campanha.

Esta é uma ferramenta de fã, sem vínculo oficial com os titulares de 3D&T.
