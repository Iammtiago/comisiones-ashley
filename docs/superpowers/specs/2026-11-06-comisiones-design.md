# Ashley · Óptica Newton

## Objetivo

Aplicación web sencilla y adaptable al teléfono para registrar ventas y consultar comisiones por quincenas definidas por Ashley.

## Enfoque

Una aplicación Next.js con JavaScript, Tailwind, Prisma y SQLite, conforme al encargo. Una API separada añadiría despliegues y mantenimiento innecesarios; almacenar ventas en el navegador contradice el requisito de persistencia. SQLite requiere servidor con disco persistente; no se desplegará ni publicará sin instrucciones.

## Pantallas

- Acceso: usuario inicial ashley y contraseña ashley. Token aleatorio revocable persistido en localStorage; verificación en servidor. Contraseñas con hash. Salir revoca token y borra acceso recordado.
- Inicio: saludo, quincena actual, comisión acumulada con control para mostrar ****, agregar venta, cantidad de ventas de hoy, comisión de hoy siempre visible y tabla de ventas del día.
- Ventas: historial por quincena, filtros por fecha, búsqueda por factura/cliente, ver detalle, editar y eliminar. Exportar CSV.
- Estadísticas: comisión y número de ventas por día, totales por quincena, distribución de métodos de pago cuando existan datos. Sin datos inventados.
- Ajustes: cambiar contraseña de acceso y clave de edición (inicial 1111), moneda, zona horaria, ocultación del total, gestionar fechas y nombre de quincenas, cerrar sesión.

## Ventas

Factura y comisión fija obligatorias. Cliente, descripción, importe total y método de pago opcionales; métodos Efectivo, Transferencia y Cachea. Fecha preseleccionada al día local actual. Importes almacenados en unidades mínimas enteras para evitar errores de coma flotante. Validación en servidor y mensajes claros. Facturas duplicadas rechazadas para prevenir registros accidentales. Editar/eliminar exige verificar clave actual en servidor. Confirmación explícita antes de eliminar.

## Quincenas

Ashley crea y programa inicio y fin inclusivos; puede cerrar un período e iniciar el siguiente sin borrar historial. No se permitirán intervalos solapados. Una venta debe corresponder a una quincena que incluya su fecha. Primer uso guía a configurar las fechas. Quincenas históricas siguen consultables. El total oculto permanece oculto hasta que Ashley lo revele; no se revela automáticamente al cerrar.

## Persistencia y acceso

Ventas, quincenas, preferencias, credenciales y sesiones en SQLite con Prisma. LocalStorage únicamente para token recordado. Endpoints autenticados y validación de credenciales en servidor; límites de intentos de acceso/clave. Ninguna contraseña enviada de vuelta al cliente. Datos iniciales sin ventas de ejemplo. Validar lectura/escritura y persistencia tras reiniciar.

## Diseño

Referencia: /workspace/generated_images/exec-3a4c93f3-163c-4466-9e71-4cf8a86334f4.png.
Azul hielo, cristal blanco translúcido, texto azul marino, botones azul cielo, bordes sutiles y sombras suaves. Tipografía sans serif. Navegación inferior fija Inicio, Ventas, Estadísticas, Ajustes; espacio para zona segura móvil. Formularios con etiquetas y controles táctiles accesibles, errores anunciados, estados de carga y vacío. En escritorio contenido centrado con espacio generoso.
La imagen es conceptual: método de pago será opcional aunque muestre asterisco; gráficas finales solo mostrarán datos reales y estarán vacías inicialmente. Moneda confirmada por el usuario: dólares estadounidenses (USD). Apariencia aprobada.

## Límites

Sin integraciones de pagos, inventario, multiusuario ni sincronización sin conexión. Carpeta Windows requiere acceso local del usuario; entregar instrucciones PowerShell para clonar en programacion. No se puede escribir en laptop desde nube.

## Validación prevista

Build de Next.js, integración de autenticación y ventas con SQLite, permisos de edición/eliminación, validación monetaria y fechas, persistencia y cierre de sesión. Pruebas de navegador en móvil y escritorio para formularios, navegación, filtros y ocultación. Guardar instrucciones reproducibles de instalación/inicio.

## Precisiones tras revisión

Comisión escrita manualmente en cada venta. Quincenas de duración libre; no cambiar fechas dejando ventas fuera. Correcciones históricas permitidas con clave. Ocultar el agregado de quincena también en Ventas/Estadísticas manteniendo comisión diaria visible. Fechas comerciales sin hora según zona configurada. Moneda única para la cuenta: cambiarla no convierte importes históricos. Cambiar contraseñas requiere contraseña actual; cambio de acceso revoca otras sesiones y conserva la actual. Sesiones sin vencimiento corto, válidas hasta salir o revocación. Duplicados: advertencia con confirmación en lugar de rechazo absoluto; prevalece esta precisión sobre la regla inicial. Validar reasignación de quincena al cambiar fecha.
