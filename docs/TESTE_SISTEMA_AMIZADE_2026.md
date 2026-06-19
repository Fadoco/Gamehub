# 🧪 TESTE DO SISTEMA DE AMIZADE - Guia Completo

**Data:** 2026-06-19  
**Status:** ✅ Correções Implementadas

---

## 📋 MUDANÇAS APLICADAS

### 1. **Regras do Firestore** (firestore.rules)
- ✅ Alterado `friendships`: agora permite `create` e `delete`
- ✅ Antes: `allow write: if false;`
- ✅ Depois: `allow create: if request.auth != null;` e `allow delete: if request.auth != null;`

### 2. **Função acceptFriendRequest()** (auth.js)
- ✅ Adicionado força de sincronização com `setTimeout(() => window.renderFriends(), 500)`
- ✅ Melhorado tratamento de erro ao atualizar outro usuário

### 3. **Função removeFriend()** (auth.js)
- ✅ Melhorado tratamento de erro ao deletar de `friendships`
- ✅ Adicionada sincronização forçada com `setTimeout`

### 4. **Listener de Amizades**
- ✅ Removida chamada redundante a `setupFriendshipsCollectionListener`
- ✅ Agora usa apenas `setupFriendshipListener` que lê do campo `friends` do usuário

---

## 🧪 PASSO A PASSO DO TESTE

### **TESTE 1: Enviar Pedido de Amizade**
```
1. Abra o navegador em MODO INCÓGNITA (Ctrl + Shift + N)
2. Crie/Faça login com CONTA A (ex: user1@test.com)
3. Vá para Ranking ou Busca de Usuários
4. Procure por CONTA B (ex: user2@test.com - já existente)
5. Clique em "Adicionar Amigo"
   ✅ Deve aparecer: "Pedido de amizade enviado!"
   ✅ Botão deve mudar para "Pedido Enviado"
   ❌ NÃO deve haver erro 403 no Console
```

### **TESTE 2: Aceitar Pedido (Outro Browser/Incógnita)**
```
1. Abra OUTRA janela (ou novo navegador) em MODO INCÓGNITA
2. Faça login com CONTA B
3. Vá para Perfil → Solicitações de Amizade Pendentes
4. Você deve ver CONTA A com botão "Aceitar"
5. Clique em "Aceitar"
   ✅ Deve aparecer: "Pedido aceito!"
   ✅ Mensagem deve sumir da lista
   ❌ NÃO deve haver erro 403 no Console
```

### **TESTE 3: Verificar Amigos Aparecem em AMBOS**
```
1. Em CONTA A:
   - Volte para seu Perfil
   - Na seção "Amigos", CONTA B deve aparecer
   - Botão deve estar "Amigo" (verde, desabilitado)
   
2. Em CONTA B:
   - Vá para seu Perfil
   - Na seção "Amigos", CONTA A deve aparecer
   - Botão deve estar "Amigo" (verde, desabilitado)
   
   ✅ AMBAS devem ver um ao outro como amigos
```

### **TESTE 4: Adicionar SEGUNDO Amigo**
```
1. Em CONTA A, procure por CONTA C (novo usuário)
2. Clique em "Adicionar Amigo"
3. Vá para CONTA C e aceite o pedido
4. Volte para CONTA A
   ✅ CONTA C deve aparecer na lista de amigos
   ✅ Deve ser possível ver CONTA B E CONTA C juntos
   ❌ Não deve desaparecer o primeiro amigo (CONTA B)
```

### **TESTE 5: Remover Amigo**
```
1. Em CONTA A, vá para Perfil → Amigos
2. Encontre CONTA B na lista
3. Clique em remover/delete
4. Confirme a ação
   ✅ Deve aparecer: "Amigo removido com sucesso."
   ✅ CONTA B deve sumir da lista
   ✅ Não deve haver erro 403 no Console
   
5. Vá para CONTA B (outra janela)
   ✅ CONTA A também deve ter desaparecido da lista
```

---

## 🔍 VERIFICAR NO CONSOLE (F12)

Ao fazer cada ação, abra o Console (F12) e procure por:

### ✅ ESPERADO VER:
```
Pedido enviado de [UID-A] para [UID-B]
🔔 Notificações recebidas
Amigo removido com sucesso.
```

### ❌ NÃO DEVE VER:
```
403 Forbidden - Missing or insufficient permissions
permission-denied
PERMISSION_DENIED
```

---

## 🐛 TROUBLESHOOTING

| Problema | Solução |
|----------|---------|
| Amigos não aparecem | Recarregue a página (F5) |
| Erro 403 persiste | Verifique se publicou as regras do Firestore |
| Botão continua "Adicionar Amigo" | Limpe cache (Ctrl + Shift + Delete) e recarregue |
| Segundo amigo não aparece | Recarregue a página após aceitar |
| Remover falha com erro 403 | Verifique regras de `friendships` no Firebase |

---

## 🔧 SE AINDA TIVER PROBLEMAS

### 1. **Atualizar Regras no Firebase Console**
```
1. Vá para: https://console.firebase.google.com/
2. Projeto: gamehub-web-8c78c
3. Firestore → Rules
4. Cole o conteúdo atualizado de firestore.rules
5. Clique "Publish"
```

### 2. **Limpar Cache do Navegador**
```
Pressione: Ctrl + Shift + Delete
- Marque: Cookies e dados de site
- Marque: Arquivos em cache
- Clique: Limpar dados
- Recarregue a página
```

### 3. **Verificar Firestore**
```
1. Vá para Firestore Console
2. Procure coleção "friendships"
3. Verifique se documentos estão sendo criados
4. Procure coleção "friendRequests"
5. Verifique se status está mudando de "pending" para "accepted"
```

---

## 📊 RESULTADO ESPERADO

| Ação | Status | Observação |
|------|--------|-----------|
| Enviar pedido | ✅ Funciona | Sem erro 403 |
| Aceitar pedido | ✅ Funciona | Amigos aparecem em ambos |
| Ver múltiplos amigos | ✅ Funciona | Não perde amigos anteriores |
| Remover amigo | ✅ Funciona | Sem erro de permissão |
| Sincronização | ✅ Funciona | Ambos veem as mudanças |

---

## 📞 PRÓXIMOS PASSOS

- [ ] Executar testes acima
- [ ] Reportar qualquer erro 403
- [ ] Verificar se sistema fica "sync" entre contas
- [ ] Testar com 3+ amigos simultâneos
- [ ] Monitorar Firestore para padrões anormais
