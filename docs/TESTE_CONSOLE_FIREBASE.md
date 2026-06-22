# 🧪 Script de Teste para Console do Navegador

Copie e cole este código **no console do navegador** (F12) para testar se Firebase está funcionando:

```javascript
// ===== TESTE 1: Verificar Firebase =====
console.log('=== TESTE 1: Firebase ===');
console.log('window.db disponível:', !!window.db);
console.log('window.auth disponível:', !!window.auth);
console.log('Usuário logado:', window.auth?.currentUser?.email);

// ===== TESTE 2: Carregar Usuários =====
console.log('\n=== TESTE 2: Carregando Usuários ===');
window.db.collection('users').get().then(snapshot => {
    console.log('Total de docs:', snapshot.size);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`${data.displayName || 'Anônimo'} - Email: ${data.email} - Balance: ${data.balance}`);
    });
});

// ===== TESTE 3: Testar Update em Usuário =====
console.log('\n=== TESTE 3: Testando Update ===');
// SUBSTITUA 'user_id_aqui' pelo ID do primeiro usuário!
const testUserId = 'user_id_aqui';
window.db.collection('users').doc(testUserId).update({
    balance: 9999
}).then(() => {
    console.log('✅ Update bem-sucedido! Balance agora é 9999');
}).catch(error => {
    console.error('❌ Erro no update:', error);
});

// ===== TESTE 4: Verificar allUsers =====
console.log('\n=== TESTE 4: Variable allUsers ===');
console.log('allUsers:', allUsers);
console.log('allUsers.length:', allUsers?.length);

// ===== TESTE 5: Verificar Filtro de Admin =====
console.log('\n=== TESTE 5: Filtro Admin ===');
const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
console.log('Usuários não-admin:', nonAdminUsers);
console.log('Quantidade:', nonAdminUsers.length);
```

---

## 📖 Como Usar

1. Abra **F12** na página da roleta
2. Vá para **Console**
3. Cole o código acima
4. Pressione **Enter**
5. Procure pelos logs de erro (linhas vermelhas)

---

## 🎯 O que Procurar

| Teste | OK | Erro |
|-------|----|----|
| Firebase | `true` | `false` |
| Auth | `true` | `false` ou undefined |
| Usuário logado | email visível | undefined |
| Total de docs | número > 0 | 0 |
| Balance | número visível | undefined ou erro |
| Update | ✅ sucesso | ❌ erro de permissão |

---

## 🔍 Teste Específico para o Botão

Se quiser testar apenas o botão "Iniciar Apresentação", rode:

```javascript
// Chamar a função direto
initializePresentation();
```

Depois veja os logs no console para ver o que acontece.

---

## 🆘 Se Encontrou um Erro

Copie a **mensagem de erro completa** e compartilhe comigo! Por exemplo:

```
❌ Erro ao resetar João: 
Error: Missing or insufficient permissions.
```

Isso ajudará a identificar exatamente o problema!
