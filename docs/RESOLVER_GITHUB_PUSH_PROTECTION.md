# 🔐 Como Resolver o Erro do GitHub (Push Protection)

## ❌ Problema

O GitHub bloqueou seu push porque detectou um **segredo (token)** no código. Isso é uma proteção de segurança.

```
remote: error: GH013: Repository rule violations found
- GITHUB PUSH PROTECTION
  - Push cannot contain secrets
```

---

## ✅ Solução (Implementada)

Removi o token do código e agora ele é salvo **no localStorage do navegador** (local, não no Git).

---

## 🚀 Como Usar Agora

### Passo 1: Fazer Push (Remover Commit com Token)

Na pasta do projeto, execute:

```bash
# Desfazer o último commit (mas manter os arquivos modificados)
git reset --soft HEAD~1

# Adicionar os arquivos novamente (sem o arquivo com token)
git add .

# Fazer novo commit (sem o arquivo com token)
git commit -m "feat: github upload system (sem token no código)"

# Fazer push
git push origin main
```

Ou se preferir mais rápido:

```bash
# Remover o último commit completamente
git reset --hard HEAD~1

# Fazer push da versão anterior
git push origin main -f
```

---

### Passo 2: Configurar Token no Navegador

Quando você abrir o site pela primeira vez:

1. **Abra o Console** (F12 no navegador)
2. **Execute:**
   ```javascript
   setupGitHubToken()
   ```
3. **Cole seu token** (pode ser o mesmo anterior)
4. **Pronto!** O token fica salvo no seu navegador

---

## 🔒 Por Que Funciona Assim?

- ✅ Token **não fica no Git** (seguro)
- ✅ Token fica **local no seu navegador** (localStorage)
- ✅ Cada usuário configura seu próprio token
- ✅ Nenhuma exposição de segredo no código

---

## 📝 Próximos Passos

### Opção 1: Setup Manual (Simples)

1. Usuário abre o site
2. Console → `setupGitHubToken()`
3. Cola o token
4. Pronto!

### Opção 2: Setup Automático (Futuro)

Você pode criar um formulário dentro do site para:
- Pedir o token na primeira vez
- Salvar no localStorage
- Usar para upload

---

## ✨ Arquivos Novos

- `java/github-token-setup.js` - Função para configurar token
- `java/github-upload-config.js` - Modificado (token removido)
- `java/github-uploader.js` - Modificado (usa localStorage)

---

## 🧪 Testar Após Configurar

1. Faça login no site
2. Vá para seu perfil
3. Clique no ✏️
4. Selecione uma foto
5. Clique "Salvar"
6. Deve fazer upload normalmente!

---

## 🆘 Se der erro ainda

**Erro:** "Token não está configurado"
- Solução: Abra console (F12) e execute: `setupGitHubToken()`

**Erro:** "Erro 401 - Unauthorized"
- Solução: Token expirou ou está incorreto
- Gere um novo em: https://github.com/settings/tokens

**Erro:** "Erro 422"
- Solução: Nada quebrado, pasta `assets/user-avatars/` será criada automaticamente

---

## 📖 Documentação Completa

Veja: `docs/GUIA_SETUP_GITHUB_UPLOAD.md`

---

**Segurança em Primeiro Lugar! 🔐**
