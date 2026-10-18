# Ficha acessível 3D&T Alpha

Ficha de fã para 3D&T Alpha, publicada como página estática no GitHub Pages.

## Baixar e usar

Acesse a [release v1.0.0](https://github.com/concego/ficha-3D-T/releases/tag/v1.0.0) e baixe **Source code (zip)**. Extraia o arquivo e abra `index.html` em um navegador atualizado. Não é necessário instalar servidor nem dependências.

A versão online está no [GitHub Pages](https://concego.github.io/ficha-3D-T/).

## Recursos

- Vários personagens com salvamento local no navegador.
- PV e PM calculados a partir dos atributos efetivos, incluindo vantagens passivas e bônus diretos de PV/PM.
- Rolagens de ataque corpo a corpo, ataque à distância, defesa, iniciativa, testes de característica e dados livres.
- Acertos críticos, falhas críticas e sucessos automáticos nos testes conforme a implementação da ficha anexada.
- Vantagens, desvantagens e vantagem única com efeitos passivos ou ativáveis, alvos configuráveis e custo de PM.
- Perícias, magias e técnicas com custo em pontos/PM e ação de uso.
- Inventário, dinheiro, história, modo de leitura da biografia, notas rápidas e diário de sessões.
- Histórico das últimas rolagens, resumo copiável, backup e restauração por JSON.
- Interface responsiva, operação por teclado, rótulos de campos, avisos acessíveis e foco visível.

## Dados e migração

As fichas ficam no armazenamento local do navegador. Ao iniciar, a página migra os dados da versão anterior do repositório (`ficha-3dt-alpha-v1`) para o formato desta versão. Também aceita importar backups JSON das duas versões. Efeitos genéricos antigos são migrados como modificadores temporários de ataque/defesa e se desativam após uma rolagem; confira o alvo e os custos depois da migração. Faça um backup JSON antes de limpar os dados do navegador.

## Regras

Os cálculos automatizam as opções registradas na ficha; custos e interpretações podem variar por mesa. PV e PM, efeitos e testes devem ser conferidos com o material de referência utilizado na campanha.

Esta é uma ferramenta de fã, sem vínculo oficial com os titulares de 3D&T.
