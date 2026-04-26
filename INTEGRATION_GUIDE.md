# Guide d'Intégration Frontend-Backend

## 📋 Vue d'ensemble

Ce guide couvre l'intégration complète entre le frontend React/Next.js et le backend Laravel avec Sanctum pour l'authentification.

---

## 🔧 Configuration Backend (Laravel)

### 1. **Environnement**

Le fichier `.env` doit contenir :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=belden
DB_USERNAME=root
DB_PASSWORD=0804
```

### 2. **CORS Configuration**

Le fichier `config/cors.php` autorise les requêtes du frontend :

```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
],
```

### 3. **Routes API**

Toutes les routes sont préfixées par `/api` et utilisent le middleware d'authentification Sanctum.

**Structure des routes** (`routes/api.php`) :
- `POST /auth/login` - Connexion
- `GET /auth/user` - Récupérer l'utilisateur courant
- `POST /auth/logout` - Déconnexion
- `POST /auth/refresh` - Rafraîchir le token

**Routes de ressources** (avec middlewares) :
- `GET|POST /clients` - Clients (lecture: vendeur, création: admin)
- `GET|POST /produits` - Produits
- `GET|POST /commandes` - Commandes
- Et plus...

---

## 🎨 Configuration Frontend (Next.js)

### 1. **Variables d'Environnement**

Créer un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. **Structure des Services API**

Les services sont organisés dans `lib/api-services/` :

- **`api-client.ts`** - Client HTTP générique
  - Gère les requêtes (GET, POST, PUT, DELETE)
  - Gère l'authentification avec tokens
  - Gère les erreurs et timeouts

- **`auth.ts`** - Authentification
  - `login()` - Connexion utilisateur
  - `getUser()` - Récupérer l'utilisateur
  - `logout()` - Déconnexion
  - `refreshToken()` - Rafraîchir le token

- **`products.ts`** - Produits, Catégories, Unités
  - `productService.getAll()`
  - `productService.getById()`
  - `productService.create()`
  - `productService.update()`
  - `productService.delete()`

- **`orders.ts`** - Clients et Commandes
  - `clientService.*`
  - `orderService.*`

---

## 🪝 Hooks Personnalisés

Les hooks dans `hooks/` simplifient l'utilisation des services :

### **useAuth()**
```jsx
const { user, login, logout, isAdmin, isVendeur } = useAuth();
```

### **useProducts(options)**
```jsx
const { products, isLoading, error, pagination, refetch } = useProducts({
  page: 1,
  perPage: 15,
  search: 'produit',
  categorieId: 5,
});
```

### **useClients(options)**
```jsx
const { clients, isLoading, error, pagination, refetch } = useClients({
  search: 'nom',
  page: 1,
});
```

### **useOrders(options)**
```jsx
const { orders, isLoading, error, pagination, refetch } = useOrders({
  clientId: 1,
  status: 'confirmée',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
});
```

---

## 🔐 Flux d'Authentification

### **1. Connexion**

```jsx
const { login } = useAuth();

const handleLogin = async (post_nom, password) => {
  const result = await login(post_nom, password);
  
  if (result.success) {
    // L'utilisateur est redirigé automatiquement
  }
};
```

### **2. Stockage du Token**

- Le token est stocké dans `localStorage` après la connexion
- Le token est automatiquement envoyé dans les headers `Authorization: Bearer {token}`
- En cas d'erreur 401, l'utilisateur est redirigé vers `/login`

### **3. Vérification de Session**

Au lancement, le contexte auth vérifie s'il existe un token valide :

```jsx
useEffect(() => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    // Vérifier la validité du token
    authService.getUser();
  }
}, []);
```

---

## 💾 Modèles de Données

### **Product**
```typescript
{
  id: number;
  nom: string;
  description: string;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  stock_min: number;
  categorie_id: number;
  unite_id: number;
  categorie: Category;
  unite: Unit;
  est_en_rupture: boolean;
  marge_brute: number;
}
```

### **Client**
```typescript
{
  id: number;
  nom: string;
  numero_tel?: string;
  adress?: string;
  email?: string;
  points_fidelite: number;
  total_achete: number;
  nombre_commandes: number;
}
```

### **Commande**
```typescript
{
  id: number;
  date_commande: string;
  client_id: number;
  admin_id: number;
  statut: 'en attente' | 'confirmée' | 'livrée' | 'annulée';
  total: number;
  remise: number;
  taxe: number;
  sous_total: number;
  montant_final: number;
  detailcommandes: DetailCommande[];
}
```

---

## 📡 Exemples d'Utilisation

### **Récupérer les Produits**

```jsx
import { useProducts } from '@/hooks/use-products';

export function ProductsList() {
  const { products, isLoading, error } = useProducts({ perPage: 20 });
  
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.nom} - {p.prix_vente}€</li>
      ))}
    </ul>
  );
}
```

### **Créer une Commande**

```jsx
import { orderService } from '@/lib/api-services/orders';

async function createOrder(clientId, items) {
  const response = await orderService.create({
    date_commande: new Date().toISOString(),
    client_id: clientId,
    items: items.map(item => ({
      produit_id: item.id,
      quantite: item.quantity,
      prix_vente: item.prix_vente,
    })),
    remise: 0,
    taxe: 0,
  });
  
  if (response.success) {
    console.log('Commande créée:', response.data);
  }
}
```

### **Mettre à Jour un Produit**

```jsx
import { productService } from '@/lib/api-services/products';

async function updateProduct(id, data) {
  const response = await productService.update(id, {
    nom: 'Nouveau nom',
    stock: 50,
    prix_vente: 99.99,
  });
  
  if (response.success) {
    console.log('Produit mis à jour');
  }
}
```

---

## 🚀 Lancer les Applications

### **Backend Laravel**

```bash
cd gestionstock

# Configurer la base de données
php artisan migrate

# Créer un utilisateur test
php artisan tinker
>>> App\Models\User::create([
...   'nom' => 'Admin',
...   'post_nom' => 'admin',
...   'role' => 'admin',
...   'password' => 'password',
... ])

# Lancer le serveur
php artisan serve --host=127.0.0.1 --port=8000
```

### **Frontend React/Next.js**

```bash
cd b_KPPLEaZIMPB

# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev
```

L'application sera accessible à `http://localhost:3000`

---

## ⚠️ Gestion des Erreurs

### **Erreurs Réseau**

```jsx
try {
  const response = await productService.getAll();
  if (!response.success) {
    console.error('Erreur:', response.error);
  }
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

### **Authentification Expired**

Le client API détecte automatiquement les erreurs 401 et redirige vers `/login`.

### **Validation**

Les erreurs de validation du backend sont retournées dans la réponse :

```json
{
  "success": false,
  "error": "Validation error",
  "messages": {
    "nom": ["Le nom est requis"],
    "prix_vente": ["Le prix doit être numérique"]
  }
}
```

---

## 📝 Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] CORS configuré correctement
- [ ] Sanctum installé et configuré
- [ ] Tokens générés et stockés correctement
- [ ] Routes API testées avec Postman
- [ ] Frontend communique avec le backend
- [ ] Authentification fonctionnelle
- [ ] Gestion des erreurs implémentée

---

## 🔗 Ressources Utiles

- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [React Hooks](https://react.dev/reference/react/hooks)
