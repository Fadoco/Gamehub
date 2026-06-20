# 🚀 Guia - Upload de Imagens para GitHub

## 📋 O que foi implementado?

Seu site agora faz upload de imagens de perfil (avatar e banner) **diretamente no GitHub**! 

### Fluxo:
1. ✏️ Usuário clica no ícone de lápis no perfil
2. 📸 Seleciona avatar/banner do computador
3. 🔄 Frontend converte para Base64
4. 📤 Envia para GitHub usando API
5. 🗂️ GitHub organiza em pastas: `user-avatars/{userId}/`
6. 🌐 Retorna URL pública da imagem
7. 💾 Salva URL no Firestore (não Base64!)

---

## ⚙️ Como Configurar (3 passos)

### Passo 1: Criar Token de Acesso no GitHub

1. Acesse: **https://github.com/settings/tokens**
2. Clique em **"Generate new token (classic)"**
3. Preencha:
   - **Note:** "Mega Site Images" (ou qualquer nome)
   - **Expiration:** "No expiration" (ou seu critério)
4. Selecione **✓ repo** (Full control of private repositories)
5. Clique em **"Generate token"**
6. **Copie o token** (⚠️ Você não verá novamente!)

**Exemplo de token:**
```
ghp_ab1Cd2EfGhIjKlMnOpQrStUvWxYzAbCdEfGh
```

---

### Passo 2: Criar Repositório no GitHub

1. Acesse: **https://github.com/new**
2. Preencha:
   - **Repository name:** `meu-site-images` (ou outro nome)
   - **Description:** "Imagens do Mega Site" (opcional)
   - **Privacy:** Private (recomendado) ou Public
3. Clique em **"Create repository"**
4. **Copie a URL** (você não vai usar, mas deixa anotada)

---

### Passo 3: Configurar no Projeto

1. Abra o arquivo: `java/github-upload-config.js`
2. Preencha os dados:

```javascript
const GITHUB_TOKEN = 'ghp_seu_token_aqui'; // O token que copiou
const GITHUB_USER = 'seu-username'; // Seu usuário GitHub
const GITHUB_REPO = 'meu-site-images'; // Nome do repo criado
const GITHUB_BRANCH = 'main'; // Normalmente "main"
```

**Exemplo preenchido:**
```javascript
const GITHUB_TOKEN = 'ghp_ab1Cd2EfGhIjKlMnOpQrStUvWxYzAbCdEfGh';
const GITHUB_USER = 'joaosilva'; // Seu usuário
const GITHUB_REPO = 'meu-site-images';
const GITHUB_BRANCH = 'main';
```

---

## 🧪 Testando o Sistema

1. Faça login no site
2. Vá para seu perfil
3. Clique no ✏️ (canto superior esquerdo)
4. Selecione uma foto de avatar ou banner
5. Clique em "Salvar Alterações"
6. Aguarde os toasts ("Enviando para GitHub...")
7. ✅ Pronto!

### Verificar se funcionou:

**No GitHub:**
- Acesse seu repositório
- Você verá uma pasta: `user-avatars/`
- Dentro: `{seu-uid}/avatar.jpg` e `{seu-uid}/banner.jpg`

**No Site:**
- Sua imagem deve carregar normalmente no perfil

---

## 🗂️ Estrutura de Pastas (Automática)

```
meu-site-images/ (seu repositório)
├── user-avatars/
│   ├── 123456-usuario-1/
│   │   ├── avatar.jpg
│   │   └── banner.jpg
│   ├── 789012-usuario-2/
│   │   ├── avatar.jpg
│   │   └── banner.jpg
│   └── ...
```

Cada usuário tem sua pasta com seu ID do Firebase!

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NÃO COMMIT** este arquivo com token real:
   ```bash
   git add -A
   git commit -m "feat: github upload" --all-except java/github-upload-config.js
   ```

2. **Em produção**, use **Variáveis de Ambiente**:
   ```javascript
   const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
   const GITHUB_USER = process.env.GITHUB_USER;
   const GITHUB_REPO = process.env.GITHUB_REPO;
   ```

3. **Token é pessoal** - Qualquer pessoa com ele pode fazer commits no seu repo

---

## 🐛 Troubleshooting

### "GitHub não está configurado"
- Verifique se você preencheu `java/github-upload-config.js`
- Reload a página após salvar

### "Erro 401 - Unauthorized"
- Token expirou ou está incorreto
- Gere um novo token em: https://github.com/settings/tokens

### "Erro 404 - Not Found"
- Repositório não existe ou nome está errado
- Verifique o nome em: https://github.com/seu-usuario

### "Erro 422 - Validation Failed"
- Pasta de usuário não existe no repo
- Deixa a pasta `user-avatars/` vazia, o sistema cria tudo automaticamente

### A imagem não aparece no perfil
- Verifique em: `https://raw.githubusercontent.com/seu-usuario/repo/main/user-avatars/uid/avatar.jpg`
- Se a URL funciona, o GitHub criou a imagem corretamente

---

## 📝 Arquivos Modificados

- ✅ `html/perfil.html` - Adicionado scripts do GitHub
- ✅ `java/perfil.js` - Modificado handleSubmit para usar GitHub
- ✅ `java/github-upload-config.js` - **NOVO** - Configurações
- ✅ `java/github-uploader.js` - **NOVO** - Lógica de upload

---

## 🎯 Próximos Passos (Opcional)

- [ ] Adicionar suporte a múltiplos formatos (.png, .gif)
- [ ] Criar interface para gerenciar imagens no GitHub
- [ ] Implementar cache de imagens do GitHub
- [ ] Adicionar limite de armazenamento

---

## 💡 Dicas

1. **URLs Raw do GitHub são rápidas** - GitHub tem CDN global
2. **Versionamento automático** - GitHub mantém histórico
3. **Sem custo** - GitHub oferece armazenamento ilimitado
4. **Imagens públicas** - Mesmo em repo privado, pode deixar público
5. **Suporte a GIF animado** - Funciona perfeitamente!

---

## 📞 Suporte

Alguma dúvida? Verifique:
1. Console do navegador (F12) para erros
2. Logs no GitHub Actions (se configurar)
3. Documentação do GitHub API: https://docs.github.com/en/rest

**Pronto para começar! 🎉**
