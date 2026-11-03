## Vista estática en GitHub Pages

Sube docs/ a la raíz de tu repositorio de pruebas si Pages usa /docs. Esta carpeta es una copia de public/ para revisión visual. Para actualizarla después de editar public/, copia sus archivos a docs/ y conserva .nojekyll. El administrador y las métricas funcionan en Cloudflare.

# Arennea · Reclutamiento | Edición para carga manual

## Cómo usar esta carpeta

Descomprime el ZIP. Para guardar el código en GitHub desde el navegador, crea un repositorio independiente sin conexión de despliegue automático y arrastra las cuatro carpetas y este README a «Add file → Upload files». La raíz del repositorio debe contener public/, admin-source/, cloudflare-publicado/ y tests/.

Abre public/index.html para revisar el diseño. El administrador, los guardados y las estadísticas requieren el Worker. La versión compilada de esta entrega está en cloudflare-publicado/worker.mjs. Para reconstruirla tras cambiar archivos fuente, ejecuta `node admin-source/build.mjs` desde la raíz en un entorno con Node, por ejemplo una terminal de desarrollo en el navegador. El comando solo genera archivos. Para las pruebas de integración usa `node tests/integration.mjs` con Node 24.

## Qué editar

- public/index.html, styles.css y script.js contienen la portada, las cinco secciones, la navegación y los ejemplos de ganancias. Las fotos y logos están en public/assets/.
- admin-source/admin.html contiene el panel. Selecciona una de las cinco secciones, un bloque y el campo que quieres editar. En «Botones y enlaces» puedes cambiar por separado cada destino, incluidos menú, Calendly, Facebook, Arennea, mapa y sitio corporativo. El mapa insertado acepta una URL de Google Maps apta para iframe. Para modificar varios botones de cita, selecciona cada destino y guarda al finalizar. Las pestañas de imágenes y visitas conservan su funcionamiento.
- admin-source/text-fields.json relaciona los identificadores con sus valores originales. Si cambias un texto base en HTML, actualiza también su valor original en este archivo. La tabla muestra tres ejemplos fijos de comisión.
- admin-source/ incluye las rutas del servidor y los esquemas originales. cloudflare-publicado/wrangler.jsonc mantiene la conexión D1 anterior. Las credenciales privadas y los registros de visitantes se conservan en el servicio original, fuera del ZIP. No se requiere migración para esta versión. Usar el panel con las conexiones de producción sí escribe datos reales al guardar.
- Las ediciones parciales conservan claves históricas y personalizaciones no enviadas. Los textos de bloques retirados permanecen en el catálogo con la marca archived. Los conteos históricos siguen disponibles y los recorridos nuevos se miden sobre las cinco secciones.

## Ajustes de esta versión

Ganancias muestra el título, la jornada y los ejemplos de 3, 4 y 5 lotes. La ruta conserva cinco pasos sin plazos. La comunidad dirige a Facebook y las preguntas frecuentes cierran la página antes del pie.

## Cambios de esta revisión

- «Venta consultiva» ahora dice «venta» en la portada.
- Ganancias: la jornada (días y horas) forma parte del título.
- Arennea: debajo de las fotos solo quedan cuatro cifras destacadas en una franja (editables en el panel, grupo ARENNEA). Se retiraron el párrafo, la nota de mensualidades y el botón «Conoce Arennea»; sus textos quedan archivados en el catálogo.
- Ubicación: sin botón de Google Maps. El bloque de ubicación (fotos, mapa, dirección y «Agenda tu reunión») va ahora debajo de las preguntas frecuentes.
- Se retiró el cuadro «Más que una oficina». Los botones «Vive la comunidad Marnez» (Facebook) y «Descubre el mundo Marnez» (sitio web) se conservan al final del bloque de ubicación.
- Colores de bloques: se alternan azul grisáceo claro, crema y azul marino para evitar saltos bruscos de blanco a azul.
- Si algún texto ya fue editado desde el panel, el valor guardado sigue mandando sobre el del HTML.
