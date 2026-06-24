# 🗑️ Guia de Deleção Segura de Usuários

## ⚠️ Problema Identificado
Quando um usuário é deletado diretamente no Firestore Console, ele pode deixar "usuários fantasma" no site porque:
1. Listeners ativos podem ainda ter referências aos dados
2. Cache do browser/service worker pode ter dados obsoletos
3. Outros componentes podem referenciarem ao usuário deletado

## ✅ Solução Implementada

### 0. **Detecção Automática em Tempo Real**
O `user-cleanup.js` é carregado automaticamente em **todas as páginas** via `firebase-config.js` e escuta a coleção `users` no Firestore.

Quando um documento é **removido** do Firestore Console (ou desativado com `active: false`), o site automaticamente:
- Remove o UID das listas de amigos de outros usuários
- Apaga pedidos de amizade (`friendRequests`)
- Apaga documentos de amizade (`friendships`)
- Limpa cache local (`localStorage`)
- Atualiza ranking, perfil e notificações em tempo real

> **Importante:** A limpeza automática ocorre enquanto **alguém** tiver o site aberto. Para limpeza 24/7 sem depender do browser, seria necessário uma Cloud Function no Firebase.

### 1. **Filtros de Validação no Ranking**
O ranking agora valida usuários e filtra:
- ❌ Usuários sem email
- ❌ Usuários marcados com `active: false`
- ❌ Usuários com `displayName: '[Deletado]'`
- ❌ Emails no formato `deleted_{uid}@deleted.local`
- ❌ Administradores

### 2. **Método Recomendado: Soft Delete**
Ao invés de deletar o documento, **marque o usuário como inativo**:

```javascript
await window.UserCleanup.softDeleteUser(uid, 'Motivo da deleção');
```

Ou manualmente no Firestore:

```javascript
await db.collection('users').doc(uid).update({
  active: false,
  displayName: '[Deletado]',
  email: `deleted_${uid}@deleted.local`,
  deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
  deletedReason: "Solicitação do usuário"
});
```

### 3. **Painel Admin**
Em `admin-user-detail.html`, admins podem usar o botão **Desativar Conta**, que executa o soft delete e limpa referências automaticamente via `UserCleanup`.

### 4. **Deleção Completa no Firestore (Opcional)**
Após o soft delete e limpeza de referências, você pode apagar o documento manualmente no Firebase Console se desejar remoção total.

## 🔍 Como Verificar Usuários Fantasma

No console do navegador (F12):
```javascript
// Verifica usuários inválidos na coleção
window.db.collection('users').get().then(snap => {
  snap.docs.forEach(doc => {
    const valid = window.UserCleanup?.isValidUserData(doc.data());
    if (!valid) console.warn('USUÁRIO INVÁLIDO/DELETADO:', doc.id, doc.data());
  });
});
```

## 📋 Campos Obrigatórios para um Usuário Válido

```javascript
{
  uid: string,              // ✅ OBRIGATÓRIO (ID do documento)
  email: string,            // ✅ OBRIGATÓRIO (não vazio)
  displayName: string,      // ⚠️ Recomendado (fallback: prefixo do email)
  active: boolean,          // ✅ OBRIGATÓRIO (true para ativos)
  balance: number,          // ✅ OBRIGATÓRIO (>= 0)
  library: array,           // ✅ OBRIGATÓRIO (pode ser vazio)
  upgrades: object,         // ✅ OBRIGATÓRIO (pode ser vazio {})
  avatar: string,           // ⚠️ Opcional
  friends: array,           // ⚠️ Opcional
  deletedAt: timestamp,     // ⚠️ Opcional (se deletado)
}
```

> **Nota:** O site usa `displayName` no Firestore, não `username`.

## 🚀 Recomendações Futuras

1. ~~Adicionar campo `active` por padrão em novos usuários~~ ✅ Implementado
2. ~~Criar função de administração para deletar usuários via UI~~ ✅ Implementado
3. **Implementar soft delete automático** ao cancelar conta pelo próprio usuário
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
