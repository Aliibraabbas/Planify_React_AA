# Planify

## 🎯 Description

Planify est une application mobile permettant d’organiser des événements entre amis. Elle permet de :

- Créer un événement avec plusieurs dates proposées.
- Partager un lien vers l’événement.
- Permettre à d’autres de voter pour leurs dates préférées.
- Visualiser les résultats des votes en temps réel.

L'application est développée avec React Native + Expo et utilise Supabase pour la gestion des données.

## 🔧 Instructions de Développement

1. **Cloner le projet** :
```bash
   git clone 
   https://github.com/votre-repository/planify.git
   cd planify
   ```

2. **Installation des dépendances :**
 ```bash
   npm install
   ```
3. **Lancer l'application en mode iOS :**
 ```bash
   npm run ios
   ```

## 🎁 Fonctionnalités Principales

Planify est une application mobile permettant d’organiser des événements entre amis. Elle permet de :

- **Création d’un événement :** Ajouter un titre, une description, et proposer 2 à 5 dates.
- **Partage d’un événement** : Générer un lien pour partager l’événement (ex. `planify://event/abcd1234`).
- **Participation :** Permettre à un utilisateur de voter pour ses dates préférées.
- **Résultats :** Voir les résultats des votes en temps réel, avec la date gagnante mise en évidence.

## 🛠️ Configuration Supabase

Voici le schéma de base de données utilisé dans ce projet, à créer dans votre instance Supabase :

### 📄 `users`
```sql
create table users (
   id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
   name TEXT,
   email TEXT UNIQUE
);
```

### 🗓️ `events`
```sql
create table events (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   title TEXT,
   description TEXT,
   location TEXT,
   proposed_dates TEXT[],
   owner_id UUID REFERENCES users(id),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ✅ `votes`
```sql
create table votes (
  user_id uuid references users(id),
  event_id uuid references events(id),
  selected_dates text[],
  created_at timestamp default current_timestamp,
  primary key (user_id, event_id)
);
```

## Développé par :

- Ali ABBAS
- Adam AMMAR
