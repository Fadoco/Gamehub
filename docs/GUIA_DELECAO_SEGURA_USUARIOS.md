# 🗑️ Guia de Deleção Segura de Usuários

## ⚠️ Problema Identificado
Quando um usuário é deletado diretamente no Firestore Console, ele pode deixar "usuários fantasma" no site porque:
1. Listeners ativos podem ainda ter referências aos dados
2. Cache do browser/service worker pode ter dados obsoletos
3. Outros componentes podem referenciarem ao usuário deletado

## ✅ Solução Implementada

### 1. **Filtros de Validação no Ranking**
O ranking agora valida usuários e filtra:
- ❌ Usuários sem email
- ❌ Usuários sem username  
- ❌ Usuários marcados com `active: false`
- ❌ Administradores

### 2. **Método Recomendado: Soft Delete**
Ao invés de deletar, **marque o usuário como inativo**:

```javascript
// Em vez de deletar:
await db.collection('users').doc(uid).delete();

// Use:
await db.collection('users').doc(uid).update({
  active: false,
  deletedAt: new Date(),
  deletedReason: "Solicitação do usuário" // optional
});
```

### 3. **Deleção Completa Segura (Se Necessário)**
Se quiser deletar completamente:

```javascript
// Passo 1: Marque como deletado
await db.collection('users').doc(uid).update({
  active: false,
  email: `deleted_${uid}@deleted.local`,
  username: `[Deletado]`,
  deletedAt: new Date()
});

// Passo 2: Limpar dados sensíveis
await db.collection('users').doc(uid).update({
  balance: 0,
  library: [],
  upgrades: {},
  friends: [],
  // Mantém uid e metadata para referências
});

// Passo 3: Depois de 30 dias (opcional)
// Deleta completamente do banco
```

## 🔍 Como Verificar Usuários Fantasma

No console do navegador (F12):
```javascript
// Verifica se há usuários no ranking
window.rankingDebugData?.forEach(u => {
  if (!u.user.email || !u.user.username) {
    console.warn('USUÁRIO FANTASMA:', u.uid, u.user);
  }
});
```

## 📋 Campos Obrigatórios para um Usuário Válido

```javascript
{
  uid: string,              // ✅ OBRIGATÓRIO
  email: string,            // ✅ OBRIGATÓRIO (não vazio)
  username: string,         // ✅ OBRIGATÓRIO (não vazio)
  active: boolean,          // ✅ OBRIGATÓRIO (true/false)
  balance: number,          // ✅ OBRIGATÓRIO (>= 0)
  library: array,           // ✅ OBRIGATÓRIO (pode ser vazio)
  upgrades: object,         // ✅ OBRIGATÓRIO (pode ser vazio {})
  avatar: string,           // ⚠️ Opcional
  friends: array,           // ⚠️ Opcional
  deletedAt: timestamp,     // ⚠️ Opcional (se deletado)
}
```

## 🚀 Recomendações Futuras

1. **Adicionar campo `active` por padrão** em novos usuários
2. **Criar função de administração** para deletar usuários de forma segura via UI
3. **Implementar soft delete automático** ao fazer logout/cancelar conta
4. **Adicionar cleanup job** para deletar permanentemente após 30 dias
5. **Auditoria de deleções** com logs de quem/quando deletou

## 🔐 Firestore Rules
Recomendado adicionar:
```javascript
match /users/{userId} {
  allow delete: if isAdmin() || (isOwnUser(userId) && resource.data.active == true);
  allow update: if isOwnUser(userId) || isAdmin();
}
```
