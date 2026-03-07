<p align="center">
  <img src="assets/images/icon.png" width="120" height="120" alt="VidaSync Logo" style="border-radius: 24px;" />
</p>

<h1 align="center">VidaSync</h1>

<p align="center">
  <strong>Seu diário alimentar inteligente</strong>
  <br />
  Registre refeições, acompanhe sua nutrição e construa hábitos saudáveis — tudo em um app bonito e simples.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Kotlin-Spring_Boot-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database_&_Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Android-34A853?style=flat-square&logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/platform-iOS-000000?style=flat-square&logo=apple&logoColor=white" />
  <img src="https://img.shields.io/badge/platform-Web-4285F4?style=flat-square&logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## ✨ Funcionalidades

| Feature | Descrição |
|:---|:---|
| 🍽️ **Registro de refeições** | Adicione alimentos com cálculo nutricional automático (calorias, proteína, carboidratos, gordura) |
| 📊 **Resumo diário** | Dashboard com barras de progresso e total de macros por dia |
| 📅 **Histórico completo** | Navegue por qualquer data e veja exatamente o que comeu |
| ⭐ **Meus Pratos** | Salve pratos favoritos com foto e reutilize em novos registros |
| 🧠 **Cálculo nutricional inteligente** | Backend calcula nutrição com base em tabelas de referência brasileiras |
| 👤 **Perfil editável** | Troque username, senha e foto de perfil com avatar personalizado |
| 🔐 **Autenticação segura** | Login com JWT, auto-logout em sessão expirada |
| 🌙 **Tema claro/escuro** | Suporte nativo a dark mode |
| 📱 **UX nativa** | Bottom sheets, haptic feedback, animações fluidas — zero webview |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   📱 App (Expo)                     │
│  React Native · TypeScript · React Compiler         │
│  expo-router (file-based) · Ionicons                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────┐
│              🚀 BFF (Railway)                       │
│  Kotlin · Spring Boot 3.5 · REST API                │
│  Cálculo nutricional · Validação · Auth proxy       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│            🗄️ Supabase (Cloud)                      │
│  PostgreSQL · Auth (JWT) · Storage (imagens)        │
│  RLS Policies · Buckets: meal-images, favorites     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura do Projeto

```
vida-sync-app/
├── app/                          # Telas (file-based routing)
│   ├── _layout.tsx               # Root layout + AuthProvider
│   ├── login.tsx                 # Tela de login/signup
│   └── (tabs)/
│       ├── index.tsx             # 🏠 Início — resumo + registro
│       ├── explore.tsx           # ⭐ Meus Pratos — favoritos
│       └── history.tsx           # 📅 Histórico — navegação por data
│
├── components/                   # Componentes reutilizáveis
│   ├── app-button.tsx            # Botão padronizado
│   ├── app-card.tsx              # Card com sombra e borda
│   ├── app-input.tsx             # Input com label e ícone
│   ├── meal-card.tsx             # Card de refeição com macros
│   ├── day-summary.tsx           # Barras de progresso nutricionais
│   ├── calendar-picker-modal.tsx # Seletor de data customizado
│   ├── edit-profile-modal.tsx    # Modal de edição de perfil
│   ├── register-meal-modal.tsx   # Modal de registro de refeição
│   ├── quick-add-sheet.tsx       # Bottom sheet de adição rápida
│   ├── meal-action-sheet.tsx     # Ações em refeição (editar/excluir)
│   ├── nutrition-error-modal.tsx # Modal de erro de validação
│   └── vida-sync-logo.tsx        # Logo SVG animado
│
├── hooks/                        # Custom hooks
│   ├── use-auth.tsx              # Contexto de autenticação
│   ├── use-meals.ts              # CRUD de refeições
│   ├── use-favorites.ts          # CRUD de favoritos
│   └── use-async.ts              # Helper para loading/error
│
├── services/                     # Camada de API
│   ├── api.ts                    # Fetch wrapper com X-User-Id
│   ├── auth.ts                   # Login, signup, profile
│   ├── meals.ts                  # Endpoints de refeições
│   ├── favorites.ts              # Endpoints de favoritos
│   ├── nutrition.ts              # Cálculo nutricional
│   └── dish-images.ts            # Image picker + compressão
│
├── types/                        # TypeScript types
│   └── nutrition.ts              # Meal, Favorite, AuthUser, etc.
│
├── constants/                    # Constantes globais
│   ├── theme.ts                  # Design system (cores, fontes)
│   └── config.ts                 # URLs, app name
│
└── utils/
    └── helpers.ts                # Formatação, máscaras, utilitários
```

---

## 🎨 Design System

O VidaSync segue uma identidade visual que transmite **saúde, leveza e tecnologia amigável**.

| Token | Cor | Uso |
|:---|:---:|:---|
| `green` | ![#7BC47F](https://img.shields.io/badge/-%237BC47F?style=flat-square&color=7BC47F) `#7BC47F` | Primária, destaque, progresso |
| `greenDark` | ![#4CAF50](https://img.shields.io/badge/-%234CAF50?style=flat-square&color=4CAF50) `#4CAF50` | Botões, ações principais |
| `orange` | ![#F4A261](https://img.shields.io/badge/-%23F4A261?style=flat-square&color=F4A261) `#F4A261` | Acentos, alertas leves |
| `bg` | ![#F9FAF7](https://img.shields.io/badge/-%23F9FAF7?style=flat-square&color=F9FAF7) `#F9FAF7` | Fundo principal |
| `danger` | ![#E05656](https://img.shields.io/badge/-%23E05656?style=flat-square&color=E05656) `#E05656` | Erros, ações destrutivas |

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** ≥ 18
- **npm** ou **yarn**
- **Expo Go** no celular (para Android/iOS) — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Boddenberg/vidasync-app.git
cd vidasync-app

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento (Android/iOS via Expo Go)
npx expo start --tunnel

# Ou rode diretamente no navegador
npx expo start --web
```

Para **mobile**: escaneie o QR code com o **Expo Go** e pronto! 🎉  
Para **web**: acesse `http://localhost:8081` no navegador.

---

## 📦 Build & Deploy

```bash
# APK de teste (distribuição interna)
npx eas build --platform android --profile preview

# App Bundle para Google Play
npx eas build --platform android --profile production

# Submeter para Google Play
npx eas submit --platform android --profile production
```

| Profile | Formato | Uso |
|:---|:---|:---|
| `development` | APK | Dev com hot reload |
| `preview` | APK | Testes internos |
| `production` | AAB | Google Play Store |

---

## 🛠️ Tech Stack

### Frontend

| Tecnologia | Versão | Papel |
|:---|:---|:---|
| React Native | 0.81.5 | Framework mobile cross-platform |
| Expo SDK | 54 | Build system, OTA updates, dev tools |
| TypeScript | 5.9 | Type safety em todo o projeto |
| React Compiler | ✅ | Otimização automática de re-renders |
| expo-router | 6.x | File-based routing (como Next.js) |
| expo-image | 3.x | Carregamento otimizado de imagens |
| Reanimated | 4.x | Animações nativas de 60fps |
| Ionicons | — | Iconografia consistente |

### Backend (BFF)

| Tecnologia | Papel |
|:---|:---|
| Kotlin + Spring Boot 3.5 | API REST, lógica de negócio |
| Supabase Auth | Autenticação JWT |
| Supabase PostgreSQL | Banco de dados relacional |
| Supabase Storage | Armazenamento de imagens |
| Railway | Deploy + CI/CD |

---

## 🔐 Autenticação

```
Login → JWT accessToken (1h) → salvo no AsyncStorage
                                    │
Refeições/Favoritos ← usa X-User-Id (não expira)
                                    │
Alterar perfil ← usa X-User-Id + X-Access-Token
                                    │
Token expirado? → auto-logout → tela de login
```

- O token JWT é necessário **apenas** para alterar username e senha
- Uso diário (refeições, favoritos, histórico) **não é afetado** pela expiração
- Sessão expirada = logout automático com redirect suave para login

---

## 📱 Telas

### 🏠 Início
- Resumo nutricional do dia com barras de progresso
- Cards de refeições por tipo (Café da Manhã, Almoço, Lanche, Janta, Ceia)
- Input rápido com placeholder dinâmico (40+ alimentos brasileiros)
- Acesso ao perfil pelo avatar

### ⭐ Meus Pratos
- Pratos salvos com foto, nome e macros
- Busca por nome
- Toque para adicionar como nova refeição
- Suporte a imagens em alta qualidade

### 📅 Histórico
- Calendário customizado para navegação por data
- Lista completa de refeições de qualquer dia
- Mesmos cards e ações da tela inicial

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  <strong>Feito com 💚 por <a href="https://github.com/Boddenberg">Boddenberg</a></strong>
  <br />
  <sub>Cuide da sua alimentação. Cuide da sua vida.</sub>
</p>
