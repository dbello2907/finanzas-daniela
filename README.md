# Finanzas Daniela 💚

App personal de finanzas — React + Vite + Supabase

---

## Setup en 5 pasos

### 1. Crear proyecto en Supabase

1. Ir a https://supabase.com → New project
2. Nombre: `finanzas-daniela`
3. Guardar la contraseña de la DB
4. Esperar que inicie (~2 min)

---

### 2. Crear las tablas

1. En Supabase → **SQL Editor** → **New query**
2. Pegar TODO el contenido de `schema.sql`
3. Click **Run**
4. Verificar en **Table Editor** que aparecen las 7 tablas

---

### 3. Crear la cuenta de Daniela

1. En Supabase → **Authentication** → **Users** → **Add user**
2. Email: el de Daniela
3. Password: una contraseña segura
4. Click **Create user**

El trigger `on_auth_user_created` creará automáticamente el registro en `profiles`.

---

### 4. Configurar el proyecto local

```bash
# Clonar / descomprimir el proyecto
cd finanzas-daniela

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env.local
```

Editar `.env.local` con los datos de Supabase:
- **VITE_SUPABASE_URL**: Settings → API → Project URL
- **VITE_SUPABASE_ANON_KEY**: Settings → API → anon/public key

```bash
# Iniciar en desarrollo
npm run dev
```

Abrir http://localhost:5173/finanzas-daniela

---

### 5. Deploy en GitHub Pages

1. Crear repo en GitHub: `finanzas-daniela` (privado recomendado)
2. Subir el código:
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/TU_USUARIO/finanzas-daniela.git
git push -u origin main
```

3. Ir al repo → **Settings** → **Secrets and variables** → **Actions**
4. Agregar secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

6. En GitHub → Settings → Pages → Source: `gh-pages` branch
7. La app queda en: `https://TU_USUARIO.github.io/finanzas-daniela/`

---

## Primer uso (onboarding de Daniela)

Una vez que ingresa por primera vez:

1. **Config → Mayo** — ingresar sueldo y saldo arrastrado del mes anterior
2. **Config → Cuentas** — crear sus cuentas reales (BCI, Fintual, Visa, etc.)
3. **Config → Partidas** — crear categorías (Casa, Familia, etc.) con presupuesto mensual

---

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/
│   │   └── AppShell.jsx     # Bottom nav + FAB
│   └── ui/
│       └── EntryForm.jsx    # Formulario de asiento (modal)
├── hooks/
│   └── useAuth.jsx          # Contexto de autenticación
├── lib/
│   ├── supabase.js          # Cliente Supabase
│   └── format.js            # Helpers de formato
├── pages/
│   ├── Login.jsx            # Pantalla de login
│   ├── Dashboard.jsx        # Inicio / resumen
│   ├── Entries.jsx          # Lista de asientos
│   ├── Installments.jsx     # Cuotas TDC
│   ├── Savings.jsx          # Metas de ahorro
│   └── Config.jsx           # Configuración
├── styles/
│   └── global.css           # Paleta + componentes CSS
├── App.jsx                  # Router
└── main.jsx                 # Entry point
```

---

## Paleta de colores

| Variable | Hex       | Uso                         |
|----------|-----------|-----------------------------|
| `--gg`   | `#4A6644` | Matcha oscuro — primario    |
| `--gm`   | `#9FAA74` | Matcha medio — cuotas       |
| `--gl`   | `#D7DAB3` | Matcha claro — bordes       |
| `--ds`   | `#C66F80` | Strawberry — gastos/alertas |
| `--dm`   | `#F4C7D0` | Strawberry medio            |
| `--dl`   | `#FCEBF1` | Strawberry claro            |
| `--bg`   | `#ECE3D2` | Crema — fondo               |
