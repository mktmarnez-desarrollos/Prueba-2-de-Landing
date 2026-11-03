## Vista estática en GitHub Pages

Sube docs/ a la raíz de tu repositorio de pruebas si Pages usa /docs. Esta carpeta es una copia de public/ para revisión visual. Para actualizarla después de editar public/, copia sus archivos a docs/ y conserva .nojekyll. El administrador y las métricas funcionan en Cloudflare.

# Arennea · Reclutamiento | Edición para carga manual

## Cómo usar esta carpeta

Descomprime el ZIP. Para guardar el código en GitHub desde el navegador, crea un repositorio independiente sin conexión de despliegue automático y arrastra las cuatro carpetas y este README a «Add file → Upload files». La raíz del repositorio debe contener public/, admin-source/, cloudflare-publicado/ y tests/.

Abre public/index.html para revisar el diseño. El administrador, los guardados y las estadísticas requieren el Worker. La versión compilada de esta entrega está en cloudflare-publicado/worker.mjs. Para reconstruirla tras cambiar archivos fuente, ejecuta `node admin-source/build.mjs` desde la raíz en un entorno con Node, por ejemplo una terminal de desarrollo en el navegador. El comando solo genera archivos. Para las pruebas de integración usa `node tests/integration.mjs` con Node 24.

## Qué editar

- public/index.html, styles.css y script.js contienen la portada, las cinco secciones, la navegación y el selector de ganancias. Las fotos y logos están en public/assets/.
- admin-source/admin.html contiene el panel. Selecciona una de las cinco secciones, un bloque y el campo que quieres editar. En «Botones y enlaces» puedes cambiar por separado cada destino, incluidos menú, Calendly, Facebook, Arennea, mapa y sitio corporativo. El mapa insertado acepta una URL de Google Maps apta para iframe. Para modificar varios botones de cita, selecciona cada destino y guarda al finalizar. Las pestañas de imágenes y visitas conservan su funcionamiento.
- admin-source/text-fields.json relaciona los identificadores con sus valores originales. Si cambias un texto base en HTML, actualiza también su valor original en este archivo. Los tres importes del simulador proceden de las tres filas de la tabla.
- admin-source/ incluye las rutas del servidor y los esquemas originales. cloudflare-publicado/wrangler.jsonc mantiene la conexión D1 anterior. Las credenciales privadas y los registros de visitantes se conservan en el servicio original, fuera del ZIP. No se requiere migración para esta versión. Usar el panel con las conexiones de producción sí escribe datos reales al guardar.
- Las ediciones parciales conservan claves históricas y personalizaciones no enviadas. Los textos de bloques retirados permanecen en el catálogo con la marca archived. Los conteos históricos siguen disponibles y los recorridos nuevos se miden sobre las cinco secciones.

## Cambios y comprobaciones

Después de la portada aparecen ganancias, ruta del asesor y cuatro preguntas frecuentes. Siguen la comunidad Marnez, el producto Arennea y el cierre con oficinas, dirección, mapa y contacto. Se reutilizaron las fotos del material original. En la galería se conservan las descripciones del equipo sin atribuir cargos individuales que el material no identifica.

Se probaron con Chromium local el menú y sus anclas, la visibilidad del botón flotante, las cinco secciones y los importes al seleccionar 3, 4 y 5 lotes. Se revisaron anchos de 320, 390 y 1440 px. Se comprobó la edición y el envío de un destino desde el panel con respuestas locales simuladas. Se validaron las direcciones de los botones, que los de cita apuntan al Calendly previsto y que usan la misma pestaña. Los destinos de Facebook y Arennea se tomaron de los enlaces de marnez.mx.

Las pruebas de integración del Worker con SQLite en memoria verificaron el guardado de enlaces, rechazo de URL inseguras, conservación de personalizaciones históricas, control de revisiones, catálogo de imágenes, filtros de fechas, clics y recorridos. Las pruebas se hicieron localmente con datos de prueba. La disponibilidad de servicios externos como el mapa insertado y la reserva efectiva de una cita corresponden a la revisión manual con conexión.
