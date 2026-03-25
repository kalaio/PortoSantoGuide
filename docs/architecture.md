# Arquitetura do Projeto

## Visão Geral

Este documento descreve a arquitetura de separação entre o painel de administração (`/admin`) e o frontend público (`/`).

## Estrutura de Diretórios

```
src/
├── app/
│   ├── (admin)/              # Grupo de rotas: Admin
│   │   ├── admin/           # Rotas /admin/*
│   │   ├── components/      # Componentes específicos do admin
│   │   └── lib/            # Lógica de negócio do admin
│   │
│   ├── (frontend)/          # Grupo de rotas: Frontend
│   │   ├── components/      # Componentes do frontend
│   │   ├── lib/            # Lógica do frontend
│   │   └── [rotas]/        # Páginas públicas
│   │
│   └── api/                 # API routes (partilhado)
│
├── components/              # Componentes base (UntitledUI)
│   ├── base/               # Componentes primitivos
│   ├── ui/                 # Wrappers simplificados
│   └── application/        # Componentes de aplicação
│
├── shared/                  # Código partilhado
│   ├── components/base/    # Cópia dos base components
│   └── lib/                # Utilitários partilhados
│
└── lib/                     # Lib partilhado (backward compat)
    ├── prisma.ts
    ├── cn.ts
    └── ...
```

## Princípios de Organização

### 1. Separação por Domínio

- **Admin**: Tudo relacionado ao painel administrativo está em `src/app/(admin)/`
- **Frontend**: Tudo relacionado ao site público está em `src/app/(frontend)/`
- **Shared**: Código utilizado por ambos está em `src/shared/` ou `src/lib/`

### 2. Componentes Base (UntitledUI)

Localizados em `src/components/base/`, são componentes "shelf" que:
- Não têm estilos hardcoded específicos
- Funcionam em qualquer contexto (admin ou frontend)
- Usam Tailwind classes genéricas
- São reutilizáveis entre projetos

### 3. Wrappers de UI

Localizados em `src/components/ui/`, fornecem:
- API simplificada para casos comuns
- Mapeamento de props para componentes base
- Consistência na interface

## Como Adicionar Novo Código

### Para o Admin

```typescript
// Novo componente
src/app/(admin)/components/NovoComponente.tsx

// Nova lógica
src/app/(admin)/lib/nova-funcionalidade.ts

// Nova página
src/app/(admin)/admin/(dashboard)/nova-pagina/page.tsx
```

### Para o Frontend

```typescript
// Novo componente
src/app/(frontend)/components/NovoComponente.tsx

// Nova lógica
src/app/(frontend)/lib/nova-funcionalidade.ts

// Nova página
src/app/(frontend)/nova-pagina/page.tsx
```

### Código Partilhado

```typescript
// Utilitário partilhado
src/shared/lib/utilitario.ts

// Ou manter em src/lib/ para backward compatibility
src/lib/utilitario.ts
```

## Import Conventions

### Admin
```typescript
// Componentes admin
import { MeuComponente } from "@/app/(admin)/components/MeuComponente";

// Lib admin
import { minhaFuncao } from "@/app/(admin)/lib/minha-funcionalidade";

// Componentes base (shared)
import { Button } from "@/components/base/buttons/button";

// Lib partilhada
import { prisma } from "@/lib/prisma";
```

### Frontend
```typescript
// Componentes frontend
import { MeuComponente } from "@/app/(frontend)/components/MeuComponente";

// Lib frontend
import { minhaFuncao } from "@/app/(frontend)/lib/minha-funcionalidade";

// Componentes base (shared)
import { Button } from "@/components/base/buttons/button";

// Lib partilhada
import { prisma } from "@/lib/prisma";
```

## Vantagens desta Arquitetura

1. **Clareza**: É óbvio onde cada tipo de código deve estar
2. **Reutilização**: Admin pode ser copiado para outros projetos
3. **Customização**: Frontend pode ter temas diferentes por site
4. **Manutenção**: Alterações num domínio não afetam o outro
5. **Escalabilidade**: Fácil adicionar novas funcionalidades sem conflitos

## Notas Importantes

- **Não** duplicar código entre admin e frontend
- Usar `src/shared/` para código genuinamente partilhado
- Manter `src/lib/` para backward compatibility
- Componentes em `src/components/base/` são a base de tudo
- Sempre executar `npm run typecheck` após mover ficheiros
