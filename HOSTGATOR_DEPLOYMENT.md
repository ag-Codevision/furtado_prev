# Guia de Deploy - HostGator

Este guia descreve os passos para hospedar o projeto **Furtado Prev** na HostGator.

## 1. Localização dos Arquivos
O processo de build gerou uma pasta otimizada para produção chamada `dist`.
Todo o conteúdo necessário para o site funcionar está dentro dela.

**Caminho Local:** `f:\_CLIENTES\furtado\_furtado_Prev\dist\`

## 2. Preparação para Upload
Recomendamos criar um arquivo `.zip` com todo o conteúdo da pasta `dist` (não a pasta em si, mas os arquivos dentro dela) para facilitar o upload.

## 3. Upload na HostGator (cPanel)
1. Acesse o **cPanel** da sua hospedagem.
2. Abra o **Gerenciador de Arquivos**.
3. Navegue até a pasta pública onde o site deve aparecer (geralmente `public_html` ou uma subpasta específica).
4. Clique em **Carregar** e suba o arquivo `.zip` criado.
5. Após o envio, clique com o botão direito no arquivo `.zip` e escolha **Extrair**.
6. (Opcional) Exclua o arquivo `.zip` e a pasta `node_modules` se tiver subido por engano (a pasta dist não deve conter node_modules).

## 4. Configuração (.htaccess)
O sistema já gerou um arquivo `.htaccess` otimizado dentro da pasta `dist`. Ele garante que:
- O roteamento do aplicativo funcione corretamente.
- Configurações de cache e segurança básicas sejam aplicadas.
- O acesso direto à listagem de pastas seja bloqueado.

## 5. Verificação
Após extrair os arquivos, acesse o domínio do seu site (ex: `www.furtadoprev.com.br`) e verifique se:
- A página carrega corretamente.
- A navegação entre abas funciona.
- O tema "Black and Gold" está aplicado.

> **Nota:** Como o projeto utiliza `HashRouter` (URLs com `#`), ele é compatível com qualquer subpasta sem configurações complexas de servidor.
