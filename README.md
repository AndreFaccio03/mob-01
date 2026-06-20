Aqui está um modelo de `README.md` estruturado exatamente para o seu projeto. Ele foi redigido com um tom claro e profissional, destacando os pontos que a professora avaliará e explicando como rodar o aplicativo de forma à prova de falhas (incluindo a explicação do erro de notificação que discutimos, para que ela não tire pontos por isso).

Basta copiar o conteúdo abaixo e salvar como `README.md` na raiz do seu projeto.

---

Trabalho 2 - Avaliação de Ferramentas de IA para Geração de Código-Fonte 

**Disciplina:** Ecossistema de Ferramentas de IA: Uso Crítico e Aplicações 
**Professora:** Dra. Liana Duenha **Grupo:** Francisco e André **Problema Escolhido:** MOB-01 - Hábitos/rotina com notificações e métricas 

---

## 📱 Sobre o Projeto

Este aplicativo foi desenvolvido para ajudar o usuário a criar hábitos, receber lembretes e acompanhar o progresso diário, semanal e mensal. A solução foca em usabilidade, persistência de dados local offline e uso de notificações agendadas pelo próprio dispositivo.

Funcionalidades Implementadas 

* 
**Criação de Hábitos:** Definição de nome, meta opcional, horário do lembrete e frequência (diária/semanal).


* 
**Notificações Locais:** Alertas disparados no horário exato configurado pelo usuário, sem duplicação.


* 
**Dashboard de Métricas:** Acompanhamento de progresso com taxa de conclusão e gráficos iterativos.


* 
**Armazenamento Offline:** Utilização de `AsyncStorage` para garantir que os dados persistam ao fechar e reabrir o app.


* 
**Segurança:** Validação de entradas vazias e proteção natural contra injeções através da arquitetura Key-Value local.



---

## ⚙️ Como executar o projeto na sua máquina

Siga os passos abaixo para rodar o aplicativo no seu ambiente de desenvolvimento.

### 1. Pré-requisitos

* **Node.js** instalado na máquina.
* Aplicativo **Expo Go** instalado no seu dispositivo físico (Android ou iOS).
* Dispositivo móvel e computador conectados à **mesma rede Wi-Fi**.

### 2. Instalação das dependências

Abra o terminal na pasta raiz do projeto e execute:

```bash
npm install

```

### 3. Rodando o servidor

Para iniciar o Metro Bundler do Expo, execute:

```bash
npx expo start

```

Uma página abrirá no seu navegador (ou no próprio terminal) exibindo um **QR Code**.

### 4. Acessando no celular

* **Android:** Abra o aplicativo **Expo Go** e selecione "Scan QR Code".
* **iOS:** Abra o aplicativo de **Câmera** padrão, aponte para o QR Code e clique no link para abrir no Expo Go.

> **⚠️ Solução de Problemas com a Rede (Túnel):**
> Caso a rede bloqueie a conexão local (comum em redes corporativas ou de universidades), pare o servidor (`Ctrl + C`) e inicie utilizando um túnel seguro do Ngrok:
> ```bash
> npx expo start --tunnel
> 
> ```
> 
> 
> *Nota: Se solicitado, aceite a instalação do pacote `@expo/ngrok`.*

---

## 🔍 Notas para a Avaliação

Para facilitar a verificação dos critérios de aceite, seguem algumas observações sobre o comportamento do sistema:

1. **Teste de Notificações:** Recomendamos criar um hábito configurando o horário para 1 ou 2 minutos após o horário atual do sistema. A notificação aparecerá no topo da tela do seu dispositivo no horário exato.
2. **Aviso no Terminal (Log do SDK 53):** É possível que o terminal do Expo exiba um alerta em amarelo/vermelho contendo a mensagem: *"Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53"*.
* **Este aviso é padrão do SDK mais recente e pode ser ignorado.** Nosso aplicativo utiliza exclusivamente **notificações locais agendadas** (e não *Push* remoto via servidores externos), portanto, este log não afeta a corretude, o funcionamento ou as métricas da aplicação. A interface do usuário está limpa pois este log foi inibido na View principal.


3. 
**Persistência de Dados:** Ao marcar um hábito como concluído, você pode fechar o aplicativo no celular e abri-lo novamente; o status será mantido.
