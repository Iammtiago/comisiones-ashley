# Ashley · Óptica Newton

Registro personal de ventas y comisiones fijas en dólares, con quincenas configurables.

## Requisitos

- Node.js 22.13+ (recomendado Node 24 LTS) y npm.
- Un servidor Node con disco persistente para SQLite. No desplegar la base SQLite en un sistema de archivos efímero (por ejemplo una función serverless).
- En Windows, usar Node LTS; si `better-sqlite3` necesita compilarse, instalar las herramientas C++ de Visual Studio y Python. npm conserva la verificación TLS e integridad.

## Instalar y ejecutar

Desde la raíz del proyecto:

```sh
npm ci
npm run setup
npm run dev
```

`setup` conserva `.env` existente, crea `data/`, genera Prisma Client y aplica las migraciones. Se puede repetir sin borrar ventas.

Para producción:

```sh
npm run build
npm start
```

El servidor escucha en todas las interfaces en el puerto 3000 (configurable con `PORT`).

## Acceso inicial

- Usuario: `ashley`
- Contraseña: `ashley`
- Contraseña para editar/eliminar: `1111`

En Ajustes puedes cambiar ambas contraseñas usando la contraseña actual de acceso. Cambiar la contraseña de acceso revoca otros dispositivos. La sesión del dispositivo actual continúa hasta cerrar sesión o ser revocada; solo se guarda su token aleatorio en localStorage. Los hashes de los tokens y contraseñas se guardan en SQLite; las contraseñas no se devuelven al navegador.

## Datos y funcionamiento

- Factura y comisión son obligatorias; cliente, descripción, importe total y pago son opcionales.
- Métodos de pago: Efectivo, Transferencia y Cachea.
- La fecha parte de hoy en la zona horaria seleccionada (Caracas por defecto).
- Ashley crea las fechas de cada quincena; no se permiten solapamientos. Una venta corresponde a la quincena que incluye su fecha. Editar su fecha cambia su asignación si corresponde.
- Puedes cerrar/reabrir quincenas sin borrar historial. Las fechas no pueden dejar fuera ventas ya registradas. Se permiten correcciones históricas verificando la clave.
- Ocultar el total reemplaza los agregados de quincena por `****` en Inicio, Ventas y Estadísticas. Las comisiones diarias y por venta siguen visibles.
- Exportar CSV desde Ventas descarga el filtro actual. Ajustes exporta el historial completo. Los valores que parecen fórmulas se neutralizan.
- No hay ventas precargadas, integración de cobros ni funcionamiento sin conexión.

## SQLite y copias

`DATABASE_URL` en `.env` usa `file:./data/app.db`, resuelto desde la raíz del proyecto por el adaptador oficial de Prisma. Esta entrega incluye en Git el `.env` con la ruta de SQLite y una base inicial vacía, por petición del propietario. Las dependencias y la compilación se regeneran con npm. Para una copia de seguridad completa, detener el servidor y copiar la base a un lugar seguro. CSV sirve para consultar/exportar ventas, no para restaurar quincenas y credenciales.

Prisma usa su compilador JavaScript y el adaptador oficial `@prisma/adapter-better-sqlite3`. La CLI emplea su motor WASM con el modo de adaptadores de Prisma 6.19; los paquetes se obtienen con integridad npm. Esto evita descargar motores nativos de Prisma en este entorno restringido. Las migraciones SQL están versionadas.

## Validación

```sh
npm test
npm run build
npm run test:api
```

La suite de API crea una base temporal y servidor en el puerto 3101; nunca cambia `data/app.db`. Verifica acceso, importes, fechas, quincenas, protección de cambios, duplicados, persistencia al reiniciar, cambios de claves y cierre de sesión.

La interfaz fue comprobada con Chromium/Playwright a 390 × 844 y 1440 × 1000: formularios, navegación, filtros, gráficos, edición/eliminación, ocultación y sesión recordada. No hay plugin Browser en este entorno; se usó Chromium instalado.

## Carpeta en Windows

Desde PowerShell, guarda tu copia en la carpeta `programacion` de tu usuario:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\programacion" | Out-Null
Set-Location "$env:USERPROFILE\programacion"
git clone https://github.com/Iammtiago/comisiones-ashley.git
Set-Location comisiones-ashley
npm ci
npm run setup
npm run dev
```

Si `programacion` está en otra ubicación, cambia la ruta. La nube no puede crear carpetas directamente en tu laptop. El código de esta entrega está subido a la rama `main` del repositorio.

## Ver desde el teléfono

El servidor debe tener una URL HTTPS pública con disco persistente. Un enlace de túnel, cuando la red lo permita, es temporal: depende de que esta máquina y el proceso sigan activos. Una URL local de esta máquina no se puede abrir desde el teléfono. Añadir a inicio desde Safari/Chrome permite abrir la app con apariencia independiente; no proporciona uso sin conexión.

## Vercel

El proyecto está preparado para Vercel con SQLite remoto en Turso. Consulta [la guía de despliegue](docs/vercel.md). Es necesario configurar `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` en Vercel; un archivo SQLite local no conserva escrituras entre ejecuciones de sus funciones. El despliegue real requiere acceso autenticado y una base remota configurada.
