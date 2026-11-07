# Desplegar en Vercel

La aplicación usa SQLite remoto mediante Turso en Vercel y archivo SQLite local al desarrollar. Las ventas nunca se escriben en localStorage.

## Requisitos

1. Cuenta Vercel con acceso a `Iammtiago/comisiones-ashley` en GitHub.
2. Una base Turso vacía (motor compatible con SQLite) y su token.
3. Configurar en Vercel las variables `TURSO_DATABASE_URL` (URL libsql:// de la base) y `TURSO_AUTH_TOKEN`. Introducir valores en el panel seguro, nunca en Git ni en el chat. `.env` del repositorio solo contiene una ruta local, sin credenciales.

## Conectar

En Vercel, importar `Iammtiago/comisiones-ashley`, rama main, framework Next.js. Mantener la configuración de `vercel.json`. Añadir ambas variables en los entornos que se vayan a utilizar antes de desplegar.

`npm run vercel-build` genera Prisma, aplica las migraciones a Turso y compila Next.js. Las migraciones se aplican una sola vez, dentro de transacciones y con checksum; no borran ventas al desplegar de nuevo. Vercel falla con un mensaje claro si falta la base remota para impedir un despliegue que dependa de disco efímero.

Para separar las pruebas de las ventas reales, usar una base Turso diferente en Preview y en Production. Conservar las URLs y tokens fuera de Git. Un despliegue de preview comparte datos con producción si se configura la misma base.

Una vez desplegada, entrar con ashley/ashley y crear la primera quincena. La clave inicial para editar/eliminar es 1111. Cambiar contraseñas en Ajustes se guarda en la base remota.

## Comprobaciones

- Abrir la URL asignada por Vercel en móvil.
- Crear quincena y venta, recargar y confirmar persistencia.
- Desplegar de nuevo y comprobar que la venta sigue presente.
- Verificar acceso recordado, edición con clave y cierre de sesión.

El código listo para Vercel no demuestra un despliegue: se requiere una cuenta autenticada y base remota configurada. La preparación local se valida con npm run build y npm run test:api. La prueba real en Turso/Vercel queda pendiente hasta disponer de acceso.
