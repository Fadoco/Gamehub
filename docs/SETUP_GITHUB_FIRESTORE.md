# 🚀 Setup - GitHub Upload com Firestore

## ✨ O Que Mudou?

Agora o token do GitHub é salvo **no Firestore** ao invés de localStorage. Isso significa:

✅ Funciona em **qualquer dispositivo**  
✅ Funciona em **qualquer navegador**  
✅ Qualquer **usuário** consegue fazer upload  
✅ Token salvo **centralmente** no Firestore  

---

## 🔐 Segurança

- ✅ Token **NÃO** fica no código (Git)
- ✅ Token **NÃO** fica no localStorage (dispositivo único)
- ✅ Token fica no **Firestore** (centralizado e seguro)
- ✅ Apenas **proprietário** pode configurar

---

## ⚙️ Setup (3 Passos)

### Passo 1: Gerar Token no GitHub

1. Acesse: **https://github.com/settings/tokens**
2. Clique: **"Generate new token (classic)"**
3. Preencha:
   - **Note:** "GameHub Images"
   - **Expiration:** "No expiration"
4. Selecione: **✓ repo**
5. Clique: **"Generate token"**
6. **Copie o token** (nunca mais aparecerá!)

**Exemplo:**
```
github_pat_11BX3PXIA0ZYOVbF9iiQB0_WGgath7...
```

---

### Passo 2: Fazer Login no Site

1. Abra seu site
2. Faça login com sua conta (proprietário)
3. Vá para qualquer página

---

### Passo 3: Configurar Token no Firestore

1. **Abra o Console** (F12)
2. **Execute:**
   ```javascript
   setupGitHubToken()
   ```
3. **Cole seu token** do GitHub
4. **Clique OK**
5. ✅ **Pronto!**

---

## 🎯 Verificar se Funcionou

No console (F12), você verá:
```
✓ Token do GitHub carregado do Firestore
✓ Sistema de upload pronto!
```

Ou no Firestore (Firebase):
- Coleção: `site-config`
- Documento: `github-token`
- Campo: `token` (seu token criptografado)

---

## 🧪 Testar Upload

1. **Faça login**
2. **Vá para seu perfil**
3. **Clique no ✏️** (lápis)
4. **Selecione uma foto**
5. **Clique "Salvar Alterações"**
6. 📤 Veja os toasts de upload
7. ✅ Imagem no GitHub!

---

## 📱 Testar em Outro Dispositivo

1. **Pegue seu celular/tablet/outro PC**
2. **Acesse o site**
3. **Faça login com qualquer conta**
4. **Vá para o perfil**
5. **Tente fazer upload**
6. ✅ Deve funcionar normalmente!

*O token é carregado automaticamente do Firestore*

---

## 🆘 Troubleshooting

### Erro: "Token do GitHub não está configurado"

**Solução:**
- Proprietário não configurou ainda
- Proprietário: execute `setupGitHubToken()` no console

### Erro: "Firestore não está inicializado"

**Solução:**
- Aguarde a página carregar completamente
- Verifique se Firebase está funcionando

### Erro: "401 - Unauthorized"

**Solução:**
- Token expirou
- Token foi revogado
- Gere um novo token em: https://github.com/settings/tokens
- Execute `setupGitHubToken()` novamente

### Erro: "422 - Validation Failed"

**Solução:**
- Nada quebrado, funcionamento normal
- Pasta será criada automaticamente

---

## 📚 Arquivos Modificados

- ✅ `java/github-upload-config.js` - Carrega token do Firestore
- ✅ `java/github-token-setup.js` - Salva token no Firestore
- ✅ `java/github-uploader.js` - Usa token do Firestore

---

## 🌐 Como Funciona (Resumo)

```
1. Proprietário executa: setupGitHubToken()
2. Token é salvo no Firestore (site-config/github-token)
3. Ao iniciar página, sistema carrega token do Firestore
4. Qualquer usuário pode fazer upload (usa o token carregado)
5. Funciona em qualquer dispositivo, navegador, conta
```

---

## ✨ Benefícios

| Antes (localStorage) | Depois (Firestore) |
|---|---|
| Funciona só no PC configurado | Funciona em qualquer lugar |
| Cada navegador diferente | Mesmo token em tudo |
| Difícil para múltiplos usuários | Fácil para todos |
| Perdia config ao limpar cache | Config centralizada |

---

## 📖 Próximos Passos

- [ ] Proprietário: configurar token
- [ ] Todos: testar upload
- [ ] Todos: testar em múltiplos dispositivos
- [ ] Opcional: criar interface para gerenciar token

---

**Pronto para começar! 🚀**
