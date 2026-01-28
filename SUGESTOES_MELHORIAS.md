# Roadmap de Melhorias: CRM Jurídico Previdenciário

Este documento detalha as sugestões de melhorias para o sistema, divididas por módulos. O foco inicial é a **Gestão de Clientes**, preparando a base para a futura integração com geração de documentos via IA.

---

## 1. Gestão de Clientes (Módulo Atual)

### A. Refinamento de Dados Cadastrais (Foco Previdenciário)
Para um escritório previdenciário, os dados básicos não são suficientes. Sugerimos a inclusão dos seguintes campos críticos:

*   **NIT/PIS/PASEP:** Essencial para consultas no Cadastro Nacional de Informações Sociais (CNIS).
*   **Número do Benefício (NB):** Para clientes que já possuem benefícios ativos ou pendentes.
*   **Nome da Mãe:** Requisito obrigatório para quase todos os requerimentos no INSS.
*   **Senha do "Meu INSS":** Campo com opção de visualização segura (oculto por padrão).
*   **Dependentes:** Listagem de filhos/cônjuge (crítico para cálculos de Pensão por Morte).

### B. Gestão Documental Integrada
Atualmente, a aba de documentos é um placeholder. Sugerimos implementar:

*   **Checklist Inteligente:** Baseado no "Assunto" (ex: Aposentadoria Idade), o sistema sugere automaticamente quais documentos faltam (RG, Comprovante Residência, CNIS, etc).
*   **Status de Documentação:** Marcadores Visuais (Pendente, Validado, Digitalizado, Original com o Cliente).
*   **Visualizador Interno:** Visualizar PDFs/Imagens sem sair da ficha do cliente.

### C. Integração com IA (O Grande Diferencial)
Preparando o terreno para a geração de documentos, a IA pode atuar na **entrada de dados**:

*   **Leitor de CNIS Automático:** O usuário faz o upload do PDF do CNIS e a IA extrai automaticamente todos os vínculos, salários e períodos pendentes, populando a ficha do cliente.
*   **Resumo de Caso via IA:** Um campo "Análise do Advogado" que pode ser gerado automaticamente pela IA a partir dos documentos anexados, destacando pontos de atenção (ex: "Falta data de saída no vínculo X").
*   **OCR de CTPS:** IA para ler fotos de Carteiras de Trabalho e converter em dados estruturados.

### D. Experiência do Usuário (UI/UX)
*   **Linha do Tempo de Contribuição:** Uma visualização gráfica (Gantt ou Timeline) dos períodos trabalhados, destacando lacunas (gaps) ou vínculos concomitantes.
*   **Integração com WhatsApp:** Botão de "Enviar Documentação Pendente" que gera uma mensagem automática no WhatsApp do cliente com o link para upload.

---

## Próximos Passos Sugeridos
1.  **Atualizar a Interface de Detalhes:** Modificar o arquivo `Clients.tsx` para refletir esses novos campos e seções.
2.  **Implementar a Aba CNIS:** Criar uma visualização estruturada dos vínculos previdenciários.
3.  **Desenvolver o Módulo de Upload de Documentos:** Com suporte a categorias e status.

---
*Documento gerado como base para evolução do projeto Furtado Prev.*
