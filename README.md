# Bingo Interactivo

App de bingo 100% client-side (HTML/CSS/JS vanilla, sin build ni backend).

## Estructura

```
bingo/
├── index.html        # Página principal
├── css/style.css      # Estilos
├── js/options.js      # Pool de opciones posibles — EDITAR ACÁ el contenido real
├── js/app.js           # Lógica: generación de cartón, marcado, localStorage
└── README.md
```

## Cómo funciona

- Al entrar, se genera un cartón 3x4 (12 casillas) con opciones aleatorias sin repetir,
  tomadas de `BINGO_OPTIONS` en `js/options.js`.
- Click/touch en una casilla la marca/desmarca.
- El cartón y las marcas se guardan en `localStorage` con timestamp de creación.
  Si pasan más de 48hs, se descarta y se genera uno nuevo automáticamente.
- Botón "Nuevo cartón" pide confirmación y genera un cartón nuevo (borra el guardado).
- Si `localStorage` no está disponible (modo privado, etc.), la app sigue funcionando
  pero muestra un aviso de que no va a persistir entre recargas.

## Editar las opciones

Abrí `js/options.js` y modificá el array `BINGO_OPTIONS`. Necesita al menos 12 items;
cuantos más tenga, más variedad entre cartones de distintos usuarios.

## Probar localmente

No hace falta build. Alcanza con levantar un servidor estático simple (abrir
`index.html` directo con doble-click también funciona, ya que no usa ES modules):

```bash
cd bingo
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Deploy a GitHub Pages

1. **Inicializar el repo y primer push:**

   ```bash
   cd bingo
   git init
   git add .
   git commit -m "Initial commit: bingo interactivo"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/<nombre-repo>.git
   git push -u origin main
   ```

2. **Activar GitHub Pages:**

   - Andá al repo en GitHub → **Settings → Pages**.
   - En **Source**, elegí rama `main` y carpeta `/root` (no `/docs`, ya que
     `index.html` está en la raíz del repo).
   - Guardá.

3. **URL final:**

   `https://<tu-usuario>.github.io/<nombre-repo>/`

   (Si el repo se llama `<tu-usuario>.github.io`, la URL es directamente
   `https://<tu-usuario>.github.io/`.)

4. **Futuras actualizaciones:**

   Simplemente hacé `git push` a `main`:

   ```bash
   git add .
   git commit -m "Actualizo opciones del bingo"
   git push
   ```

   GitHub Pages redeploya automático, tarda 1-2 minutos en reflejarse.

Todos los assets usan rutas relativas (`css/style.css`, `js/app.js`, etc.), así que
funciona igual sirviendo desde la raíz de un dominio o desde un subpath tipo
`usuario.github.io/nombre-repo/`.
