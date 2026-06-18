# 🔧 CORREÇÃO DO SISTEMA DE AMIZADE - Guia Completo

## ❌ PROBLEMA IDENTIFICADO

**Erro:** `403 Forbidden - Missing or insufficient permissions`

**Causa Raiz:** O código original tentava atualizar documentos de **outros usuários** (`friendRequestsReceived` e `friendRequestsSent` nos documentos de outro usuário), mas as regras de segurança do Firestore permitem que um usuário escreva apenas em seu próprio documento.

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. **Refatoração do Sistema (Código JavaScript)**

Três mudanças principais em `auth.js`:

#### A) `sendFriendRequest()` 
- **Antes:** Tentava atualizar documento do usuário alvo ❌
- **Depois:** Cria documento em coleção centralizada `friendRequests` ✅

```javascript
// ✅ NOVO - Usa coleção centralizada
await db.collection('friendRequests').doc(requestId).set({
    from: myUid,
    to: targetUid,
    status: 'pending',
    createdAt: firebase.firestore.Timestamp.now()
});
```

#### B) `acceptFriendRequest()`
- **Antes:** Tentava atualizar documento do solicitante ❌
- **Depois:** Atualiza apenas próprio documento + coleção friendRequests ✅

```javascript
// ✅ NOVO - Apenas atualiza próprio documento
await db.collection('users').doc(myUid).update({
    friends: firebase.firestore.FieldValue.arrayUnion(requesterUid)
});
```

#### C) `removeFriend()`
- **Antes:** Falhava ao tentar atualizar amigo ❌
- **Depois:** Trata erro graciosamente com try-catch ✅

### 2. **Regras de Segurança do Firestore (firestore.rules)**

As regras agora permitem:

```javascript
// ✅ Cada usuário escreve apenas em seu próprio doc
allow write: if request.auth.uid == userId;

// ✅ Coleção friendRequests com permissões específicas:
// - Sender cria o documento
// - Receiver atualiza (aceita/rejeita)
// - Ambos podem ler e deletar
allow read: if request.auth.uid == resource.data.from || 
               request.auth.uid == resource.data.to;
```

## 📋 COMO APLICAR AS REGRAS NO FIREBASE

### Opção 1: **Via Firebase Console (Recomendado)**

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto: `gamehub-web-8c78c`
3. Vá para **Firestore Database** → **Rules**
4. Copie todo o conteúdo de `firestore.rules`
5. Cole nas regras do Firebase Console
6. Clique **Publish**

### Opção 2: **Via Firebase CLI (Terminal)**

```bash
# Se tiver Firebase CLI instalado
firebase deploy --only firestore:rules
```

## 🧪 TESTE APÓS IMPLEMENTAR

1. **Enviar Pedido de Amizade:**
   - Acesse página de Ranking
   - Clique em botão de adicionar amigo
   - ✅ Deve exibir "Pedido de amizade enviado!" sem erro 403

2. **Aceitar Pedido:**
   - Mude para outra conta
   - Vá para seção de pedidos de amizade
   - Clique em aceitar
   - ✅ Deve funcionar sem erro 403

3. **Verificar Console:**
   - Abra DevTools (F12)
   - Vá para aba **Console**
   - ✅ Não deve haver mais erros `POST https://firestore.googleapis.com/...403`

## 📊 ESTRUTURA DE DADOS NOVA

### Coleção `friendRequests`
```javascript
friendRequests/{from_to}
├── from: "5wzCJrNCrSU7t0EYDqMf4GehQNH3"
├── to: "Yz4qdt3QoXUY9hLyUlTOEK0VBsF3"
├── status: "pending" | "accepted" | "rejected"
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### Coleção `users` (Modificada)
```javascript
users/{userId}
├── ...outros campos...
├── friends: [uid1, uid2, uid3]
└── ❌ Removido: friendRequestsSent, friendRequestsReceived
```

## 🔍 TROUBLESHOOTING

| Erro | Causa | Solução |
|------|-------|--------|
| `403 Forbidden` | Regras não atualizadas | Publique as regras no Firebase Console |
| `permission-denied` | Usuário não autenticado | Verifique se `auth.currentUser` existe |
| `undefined reference` | Campo não existe | Verifique estrutura de `window.allUsersData` |

## ⚠️ NOTAS IMPORTANTES

1. **Compatibilidade com dados antigos:** Se usuários têm `friendRequestsSent` no doc, podem ser ignorados
2. **Migração de dados:** Considere script para migrar dados antigos se tiver usuários existentes
3. **Requisição bidirecional:** Quando A adiciona B, apenas A escreve (B lê depois)

## 📞 PRÓXIMOS PASSOS

- [ ] Atualizar regras no Firebase Console
- [ ] Testar fluxo completo de amizade
- [ ] Verificar Console do navegador (sem erros 403)
- [ ] Testar com múltiplas contas
- [ ] Monitorar Firestore para criação de documentos em `friendRequests`
