# 📸 Avatars e Banners de Usuários

Esta pasta armazena todas as imagens de perfil (avatars) e banners dos usuários do GameHub.

## 📁 Estrutura

```
user-avatars/
├── uid-usuario-1/
│   ├── avatar.jpg
│   └── banner.jpg
├── uid-usuario-2/
│   ├── avatar.jpg
│   └── banner.jpg
└── ...
```

## 🔄 Como Funciona

1. Quando um usuário faz upload de uma imagem pelo site
2. O frontend converte a imagem para Base64
3. Envia para GitHub usando a API
4. GitHub cria uma pasta com o ID do usuário
5. Salva avatar.jpg e/ou banner.jpg
6. Sistema salva a URL pública no Firestore

## 🌐 Acessar as Imagens

As imagens são acessíveis via URL:
```
https://raw.githubusercontent.com/Fadoco/Gamehub/main/assets/user-avatars/{userId}/avatar.jpg
https://raw.githubusercontent.com/Fadoco/Gamehub/main/assets/user-avatars/{userId}/banner.jpg
```

## ⚙️ Configuração

Veja em: `java/github-upload-config.js`

---

**Gerenciado automaticamente pelo GameHub**
