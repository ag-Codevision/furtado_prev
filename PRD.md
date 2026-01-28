# PRD - Furtado Prev: CRM Jurídico Previdenciário

## 1. Visão Geral
O **Furtado Prev** é um sistema de CRM (Customer Relationship Management) especializado para escritórios de advocacia com foco em Direito Previdenciário. O objetivo principal é centralizar a gestão de clientes, processos, cálculos e fluxos de atendimento, otimizando a rotina do advogado previdenciarista.

## 2. Público-Alvo
*   Advogados e escritórios de advocacia previdenciária.
*   Parceiros e colaboradores administrativos de escritórios jurídicos.

## 3. Módulos e Funcionalidades Principais

### A. Gestão de Clientes
*   **Cadastro Completo:** Armazenamento de dados pessoais e específicos (NIT, PIS, PASEP, NB).
*   **Vínculos Previdenciários (CNIS):** Gestão de períodos trabalhados, entradas e saídas.
*   **Gestão Documental:** Checklist de documentos obrigatórios e pendentes.
*   **Controle Financeiro por Cliente:** Gestão de honorários (mensais, iniciais e de êxito).

### B. Gestão de Processos e Casos
*   **Kanban de Casos:** Visualização por colunas de status (Trello-style).
*   **Prazos e Prioridades:** Controle de prazos fatais e urgências.
*   **Responsáveis:** Atribuição de membros da equipe a casos específicos.

### C. Financeiro
*   **Dashboard Financeiro:** Visão de entradas, saídas e saldo.
*   **Gestão de Transações:** Registro de receitas e despesas com categorização.
*   **Fluxo de Caixa:** Monitoramento de pagamentos confirmados e pendentes.

### D. Agenda e Tarefas
*   **Calendário Integrado:** Visualização de audiências, reuniões e prazos.
*   **Sistema de Tarefas:** Gestão de atividades internas com diálogo/comentários entre a equipe.

### E. Inteligência Artificial (PrevIA)
*   **Análise de Casos:** Módulo dedicado para suporte à decisão e análise documental via IA.
*   **Automação de Dados:** Extração de informações de documentos previdenciários (Roadmap).

## 4. Stack Técnica
*   **Frontend:** React com TypeScript.
*   **Estilização:** Tailwind CSS.
*   **Backend/Banco de Dados:** Supabase (PostgreSQL, Auth e Storage).
*   **Bundler:** Vite.
*   **Testes:** TestSprite.

## 5. Roadmap e Futuras Melhorias
*   **Integração com "Meu INSS":** Automação de consultas diretamente no portal oficial.
*   **Leitor de CNIS via IA:** Upload de PDF com extração automática de vínculos para o banco de dados.
*   **Calculadora RMI Avançada:** Implementação completa de cálculos de Renda Mensal Inicial.
*   **Aba de Decisões:** Repositório de jurisprudência e decisões favoráveis integrada aos casos.
*   **Integração WhatsApp:** Envio de lembretes e solicitações de documentos automatizadas.

## 6. Governança e Segurança
*   Controle de acesso via autenticação Supabase.
*   Gestão de dados sensíveis (Senha do INSS) com foco em privacidade.
