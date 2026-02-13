-- Seed initial help articles for ContentFlow365 Knowledge Base

-- =====================================================
-- GETTING STARTED
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('primeros-pasos', 'Primeros pasos con ContentFlow365', 'Guia rapida para empezar a producir videos automatizados', '# Primeros pasos con ContentFlow365

Bienvenido a ContentFlow365, tu plataforma de produccion automatizada de video.

## Que puedes hacer

ContentFlow365 automatiza todo el proceso de creacion de videos para YouTube y redes sociales:

- **Generar guiones** con inteligencia artificial (12+ modelos de IA)
- **Crear audio** profesional con voces sintetizadas (ElevenLabs)
- **Producir avatares** realistas que narran tu contenido (HeyGen)
- **Renderizar y publicar** el video final automaticamente en YouTube

## Como empezar

1. **Inicia sesion** en [app.contentflow365.com](https://app.contentflow365.com)
2. **Selecciona tu cuenta** en el menu lateral
3. **Ve a Research** para explorar ideas de contenido
4. **Crea tu primer video** seleccionando una idea y siguiendo el pipeline

## Navegacion rapida

- **Research**: Ideas de contenido basadas en tendencias
- **Script & Audio**: Edicion de guiones y gestion de audio
- **Videos**: Lista de todos tus videos con estado del pipeline
- **App Data**: Configuracion de avatares, voces y parametros', 'getting-started', ARRAY['inicio', 'tutorial', 'onboarding'], 1),

('entender-pipeline', 'Entender el pipeline de produccion', 'Los 4 pasos para crear un video automatizado', '# Entender el pipeline de produccion

ContentFlow365 usa un pipeline de 4 pasos secuenciales para crear cada video. Cada paso debe completarse antes de pasar al siguiente.

## Los 4 pasos

### 1. CREAR COPY (Guion)
- **Que hace**: Genera el guion completo del video usando 12+ modelos de IA
- **Tiempo**: 2-5 minutos
- **Resultado**: Guion dividido en escenas, titulos de YouTube, tags
- **Modelos usados**: GPT, Claude, Gemini, Grok y mas

### 2. CREAR AUDIO (Voz)
- **Que hace**: Genera la voz narrada con ElevenLabs para cada escena
- **Tiempo**: 3-10 minutos
- **Resultado**: Archivos de audio por escena + elementos visuales (slides, B-roll)
- **Requiere**: Copy completado + VoiceDNA configurado

### 3. CREAR VIDEO (Avatares)
- **Que hace**: Crea clips de video con avatares HeyGen para cada escena
- **Tiempo**: 5-15 minutos
- **Resultado**: Videos de avatar sincronizados con el audio
- **Requiere**: Audio completado

### 4. RENDER FINAL (Publicacion)
- **Que hace**: Ensambla todo (avatar + audio + slides + B-roll) y publica en YouTube
- **Tiempo**: 5-20 minutos
- **Resultado**: Video publicado en YouTube + clips cortos
- **Requiere**: Video completado

## Indicadores de estado

En la interfaz veras 4 circulos para cada video:
- **✓** (verde) = Paso completado
- **○** (gris) = Pendiente
- **⏳** (amarillo) = En proceso
- **✗** (rojo) = Error', 'getting-started', ARRAY['pipeline', 'pasos', 'proceso', 'flujo'], 2),

('navegar-app', 'Navegar la aplicacion', 'Guia de las principales secciones de la app', '# Navegar la aplicacion

## Menu lateral (Sidebar)

### Produccion YT
- **Research**: Explora ideas de contenido basadas en tendencias de YouTube
- **Ideas Inspiracion**: Ideas generadas y valoradas por IA
- **Script & Audio**: Editor de guiones y gestion de audio por escenas
- **Video Completo**: Vista completa del video con todos sus elementos
- **Miniatura & Publish**: Gestion de miniaturas y publicacion
- **Clips Opus**: Clips cortos generados automaticamente
- **Listado Todos**: Vista general de todos los videos

### App Data
Configuracion de tu cuenta de produccion:
- **Avatares**: Personajes de IA disponibles
- **Avatares Set**: Combinaciones de avatares para videos
- **Persona**: Personalidad y tono de la IA
- **VoiceDNA**: Configuracion de la voz y estilo narrativo
- **Guardrails**: Limites y reglas para la generacion de contenido
- **Default Settings**: Ajustes predeterminados

### Acceso rapido
- **Dashboard**: Vision general de estadisticas
- **Centro de Ayuda**: Articulos y soporte (estas aqui)
- **Settings**: Configuracion de la cuenta

## Selector de cuenta
Si tienes acceso a multiples cuentas, usa el selector en la parte superior para cambiar entre ellas. Cada cuenta tiene sus propios videos, configuracion y datos.', 'getting-started', ARRAY['navegacion', 'menu', 'secciones', 'interfaz'], 3);

-- =====================================================
-- COPY & SCRIPT
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('crear-copy', 'Como crear el copy de un video', 'Paso a paso para generar el guion con IA', '# Como crear el copy de un video

## Requisitos previos
- Tener una cuenta activa con ideas de contenido
- Tener configurados: Persona, VoiceDNA y Guardrails

## Paso a paso

### 1. Seleccionar una idea
Ve a **Research** o **Ideas Inspiracion** y elige una idea para convertir en video.

### 2. Crear el video
Haz clic en **"Crear Nuevo Video"** desde la idea seleccionada. Esto crea un registro de video nuevo.

### 3. Generar el copy
Pulsa el boton **"CREAR COPY"** en el pipeline del video. Esto dispara el proceso de generacion que:

- Analiza la idea y el contexto del canal
- Genera el guion usando 12+ modelos de IA
- Divide el guion en escenas con clasificacion
- Crea titulos de YouTube optimizados
- Genera tags y metadata automaticamente

### 4. Revisar el resultado
Una vez completado, encontraras en la pestana **Script & Copy**:
- **Titulos YouTube A/B/C**: Tres opciones de titulo
- **Post Content**: El guion completo
- **Feedback IA**: Evaluacion automatica de calidad
- **Escenas**: El guion dividido por secciones

## Tiempo estimado
2 a 5 minutos, dependiendo de la complejidad del tema.

## Errores comunes
- **Tarda mas de 10 minutos**: Puede haber un limite de API. Intenta reintentar el paso.
- **Copy incompleto**: Verifica que Persona y VoiceDNA estan configurados.', 'copy-script', ARRAY['copy', 'guion', 'script', 'crear'], 1),

('configurar-voicedna', 'Configurar VoiceDNA', 'Personaliza el estilo de escritura de la IA', '# Configurar VoiceDNA

VoiceDNA define como "suena" tu marca al escribir. Es la base para que la IA genere contenido con tu estilo.

## Que es VoiceDNA

Es un perfil de estilo que incluye:
- **Tono de voz**: Formal, casual, energetico, etc.
- **Vocabulario**: Palabras y expresiones tipicas de tu marca
- **Estructura narrativa**: Como cuentas historias
- **Fuentes de referencia**: Contenido que define tu estilo

## Como configurarlo

1. Ve a **App Data > VoiceDNA**
2. Revisa el perfil actual o crea uno nuevo
3. Proporciona **fuentes de inspiracion** (URLs de videos/articulos que representan tu estilo)
4. La IA analizara las fuentes y generara tu perfil de VoiceDNA

## Fuentes de inspiracion

En **App Data > VoiceDNA Sources** puedes gestionar las fuentes que alimentan tu VoiceDNA:
- URLs de videos de YouTube propios
- Articulos o blogs de referencia
- Transcripciones de contenido existente

## Consejo
Cuantas mas fuentes de calidad proporciones, mas preciso sera el estilo generado por la IA.', 'copy-script', ARRAY['voicedna', 'estilo', 'voz', 'configuracion'], 2),

('persona-guardrails', 'Persona y Guardrails', 'Define la personalidad y limites de tu IA', '# Persona y Guardrails

## Persona

La Persona define la identidad del presentador/narrador del video:

- **Nombre y rol**: Quien habla en el video
- **Expertise**: Areas de conocimiento
- **Estilo de comunicacion**: Como se expresa
- **Audiencia objetivo**: A quien se dirige

Para configurarlo, ve a **App Data > Persona**.

## Guardrails

Los Guardrails son reglas que la IA debe seguir al generar contenido:

- **Temas prohibidos**: Lo que NO debe mencionar
- **Limites de longitud**: Duracion maxima del guion
- **Estilo obligatorio**: Formato que debe seguir
- **Disclaimers**: Avisos legales necesarios

Para configurarlo, ve a **App Data > Guardrails**.

## Importancia
Configurar ambos es **requisito previo** para que la generacion de copy funcione correctamente. Sin Persona o Guardrails, el resultado puede no ser el esperado.', 'copy-script', ARRAY['persona', 'guardrails', 'configuracion', 'ia'], 3);

-- =====================================================
-- AUDIO
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('generar-audio', 'Generacion de audio con ElevenLabs', 'Como se genera la voz para cada escena', '# Generacion de audio con ElevenLabs

## Como funciona

Cuando pulsas **"CREAR AUDIO"**, el sistema:

1. Toma el guion de cada escena
2. Lo optimiza para lectura en voz alta (ElevenLabs Text)
3. Genera el audio con la voz seleccionada en ElevenLabs
4. Crea elementos visuales complementarios (slides, busqueda de B-roll)
5. Guarda los archivos de audio en la nube (S3)

## Donde ver el resultado

En la pestana **Audio** del video, veras cada escena con:
- **Estado del audio**: Generado / Pendiente / Error
- **Duracion**: Longitud del audio generado
- **Revision**: Si ha sido aprobado o necesita cambios

## Requisitos
- Copy completado (Paso 1 del pipeline)
- VoiceDNA configurado para tu cuenta
- Voz seleccionada en **App Data > Voices**

## Tiempo estimado
3 a 10 minutos, dependiendo del numero de escenas.', 'audio', ARRAY['audio', 'elevenlabs', 'voz', 'generar'], 1),

('errores-audio', 'Solucionar errores de audio', 'Problemas comunes con la generacion de audio', '# Solucionar errores de audio

## Error: Audio cortado o incompleto

**Causa**: El script de la escena es demasiado largo para ElevenLabs.

**Solucion**:
1. Ve a la escena afectada
2. Reduce la longitud del texto
3. Ejecuta "Modifica Audio Escena" para regenerar solo esa escena

## Error: Audio no se genera

**Causa probable**: Creditos de ElevenLabs agotados o API temporalmente no disponible.

**Solucion**:
1. Espera unos minutos y reintenta
2. Si persiste, verifica el estado de ElevenLabs
3. Contacta soporte si el problema continua

## Error: Voz suena diferente a lo esperado

**Causa**: La configuracion de VoiceDNA no coincide con la voz seleccionada.

**Solucion**:
1. Ve a **App Data > Voices** y verifica la voz activa
2. Revisa **App Data > VoiceDNA** para ajustar el estilo

## Audio demasiado rapido o lento

La velocidad se controla mediante la configuracion de voz en ElevenLabs. Contacta al equipo para ajustes avanzados de velocidad.', 'audio', ARRAY['audio', 'error', 'problema', 'solucion'], 2);

-- =====================================================
-- VIDEO & AVATARES
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('crear-avatares', 'Avatares HeyGen', 'Como se crean los avatares para tu video', '# Crear avatares con HeyGen

## Como funciona

Cuando pulsas **"CREAR VIDEO"**, el sistema:

1. Toma el audio generado de cada escena
2. Asigna el avatar configurado para tu cuenta
3. Envia cada escena a HeyGen para generar el video
4. Los avatares sincronizan labios con el audio
5. Guarda los clips en la nube (S3)

## Configurar avatares

En **App Data > Avatares** puedes ver los avatares disponibles para tu cuenta.

En **App Data > Avatares Set** puedes configurar combinaciones de avatares que se usaran en tus videos (por ejemplo, avatar principal + avatar secundario).

## Tipos de escenas

No todas las escenas usan avatar. Segun la clasificacion:
- **Intro/Outro**: Puede usar avatar o solo voz
- **Contenido principal**: Avatar hablando a camara
- **Transicion**: B-roll con voz en off
- **Call to Action**: Avatar con overlay

## Tiempo estimado
5 a 15 minutos por video, dependiendo del numero de escenas.

## Errores comunes
- **Avatar no se genera**: Creditos de HeyGen agotados. Verifica el balance de la cuenta.
- **Video de avatar muy corto**: El audio de la escena puede ser demasiado corto para generar un clip de avatar valido.', 'video', ARRAY['avatar', 'heygen', 'video', 'crear'], 1);

-- =====================================================
-- RENDER & PUBLICACION
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('render-final', 'Render final con Shotstack', 'Como se ensambla y renderiza el video final', '# Render final con Shotstack

## Como funciona

El paso **"RENDER FINAL"** es el ultimo del pipeline:

1. Toma todos los elementos: clips de avatar, audio, slides, B-roll, musica
2. Los ensambla en un timeline segun la estructura de escenas
3. Aplica transiciones, efectos y subtitulos
4. Renderiza el video final en alta calidad
5. Lo sube a YouTube automaticamente
6. Genera clips cortos (Opus Clips)

## Donde ver el resultado

Una vez completado:
- **url_youtube**: Link directo al video publicado
- **Remotion Preview**: Previsualizacion en la app antes de publicar
- **Clips Opus**: Clips cortos generados automaticamente

## Requisitos
- Los 3 pasos anteriores completados (Copy + Audio + Video)
- Configuracion de YouTube valida en la cuenta

## Tiempo estimado
5 a 20 minutos, dependiendo de la duracion del video.', 'render', ARRAY['render', 'shotstack', 'publicar', 'youtube'], 1),

('publicar-youtube', 'Publicacion automatica en YouTube', 'Como se publica el video en tu canal', '# Publicacion automatica en YouTube

## Como funciona

Tras el render, el sistema publica automaticamente en tu canal de YouTube:

- **Titulo**: Se usa el titulo optimizado generado en el paso de Copy
- **Descripcion**: Generada automaticamente con SEO
- **Tags**: Tags IA generados durante el Copy
- **Miniatura**: Se genera o se usa la configurada
- **Playlist**: Se asigna a la playlist configurada

## Configuracion necesaria

En **App Data > Default Settings** verifica que estan configurados:
- Canal de YouTube conectado
- Playlist por defecto
- Configuracion de visibilidad (publico, no listado, privado)

## Errores comunes

- **"YouTube quota exceeded"**: Has superado el limite diario de la API de YouTube. Espera 24 horas.
- **"Invalid credentials"**: Los tokens de YouTube han expirado. Contacta soporte para reconectar.
- **Video publicado como privado**: Verifica los ajustes de visibilidad por defecto.', 'render', ARRAY['youtube', 'publicar', 'canal', 'api'], 2);

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('pipeline-atascado', 'Pipeline atascado - que hacer', 'Guia para resolver un video que no avanza', '# Pipeline atascado - que hacer

## Diagnostico rapido

1. **Identifica el paso atascado**: Mira los indicadores del pipeline (✓ ○ ⏳ ✗)
2. **Verifica el tiempo**: Cada paso tiene un tiempo estimado (ver abajo)
3. **Reintenta si excede el tiempo**

## Tiempos normales

| Paso | Tiempo normal | Alerta si supera |
|------|--------------|-----------------|
| Copy | 2-5 min | 10 min |
| Audio | 3-10 min | 15 min |
| Video | 5-15 min | 25 min |
| Render | 5-20 min | 30 min |

## Pasos para resolver

### Si el Copy esta atascado:
1. Espera hasta 10 minutos
2. Si no avanza, usa el bot de soporte: "Reintenta el copy del video #X"
3. Verifica que Persona y VoiceDNA estan configurados

### Si el Audio esta atascado:
1. Verifica que el copy esta completado
2. Reintenta el paso de audio
3. Si persiste, revisa que el script no sea excesivamente largo

### Si el Video esta atascado:
1. HeyGen puede tardar mas en horas pico
2. Reintenta despues de 5 minutos
3. Verifica creditos de HeyGen disponibles

### Si el Render esta atascado:
1. Verifica que todos los pasos anteriores estan completados
2. Reintenta el render
3. Si falla repetidamente, puede haber un problema con los assets (URLs expiradas)

## Contactar soporte
Si tras reintentar el problema persiste, contacta al equipo tecnico indicando:
- Numero de video
- Paso que falla
- Hace cuanto tiempo esta atascado', 'troubleshooting', ARRAY['atascado', 'error', 'problema', 'reintentar'], 1),

('reintentar-pasos', 'Como reintentar un paso fallido', 'Reinicia un paso del pipeline que ha fallado', '# Como reintentar un paso fallido

## Usando el bot de soporte

La forma mas rapida es usar el chat de soporte (icono en la esquina inferior derecha):

1. Abre el chat
2. Escribe: **"Reintenta el [paso] del video #[numero]"**
   - Ejemplo: "Reintenta el audio del video #42"
3. El bot ejecutara el paso y te confirmara

## Pasos disponibles para reintentar

- **copy**: Regenera el guion completo
- **audio**: Regenera todo el audio
- **video**: Regenera los clips de avatar
- **render**: Re-renderiza y republica el video

## Importante

- Reintentar un paso **sobrescribe** el resultado anterior
- Asegurate de que el paso anterior esta completado antes de reintentar
- Si reintentas el copy, necesitaras regenerar audio, video y render tambien
- El render es seguro de reintentar sin afectar pasos anteriores

## Cuando NO reintentar

- Si el video esta actualmente en proceso (⏳) — espera a que termine o falle
- Si acabas de reintentar hace menos de 2 minutos — dale tiempo al proceso', 'troubleshooting', ARRAY['reintentar', 'retry', 'error', 'paso'], 2);

-- =====================================================
-- ACCOUNT
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('gestionar-cuenta', 'Gestionar tu cuenta', 'Informacion sobre tu cuenta y acceso', '# Gestionar tu cuenta

## Acceso

Accede a ContentFlow365 en [app.contentflow365.com](https://app.contentflow365.com) con tu email y contrasena.

## Multi-cuenta

Si tienes acceso a varias cuentas de produccion:
- Usa el **selector de cuenta** en la parte superior de la pagina
- Cada cuenta tiene sus propios videos, configuracion y datos
- No puedes ver videos de cuentas a las que no tienes acceso

## Si no ves tus videos

1. Verifica que estas en la **cuenta correcta** (selector superior)
2. Revisa los **filtros** activos en la pagina de videos
3. Si el problema persiste, contacta soporte

## Configuracion de cuenta

En **App Data** puedes gestionar toda la configuracion de produccion:
- Avatares y sets de avatares
- Voces y VoiceDNA
- Persona y Guardrails
- CTAs y B-roll personalizado
- Fuentes de inspiracion
- Configuracion por defecto', 'account', ARRAY['cuenta', 'acceso', 'configuracion', 'perfil'], 1);

-- =====================================================
-- REMOTION
-- =====================================================

INSERT INTO help_articles (slug, title, summary, content, category, tags, sort_order) VALUES
('remotion-preview', 'Preview de videos con Remotion', 'Previsualiza tus videos antes de publicar', '# Preview de videos con Remotion

## Que es Remotion Preview

Remotion es el editor de video integrado en ContentFlow365. Te permite:
- **Previsualizar** el video final antes de publicar
- Ver todas las **capas** del video (avatares, slides, B-roll, audio)
- Verificar la **sincronizacion** de audio y video
- Comprobar las **transiciones** y efectos

## Como acceder

1. Ve a **Remotion Preview** en el menu lateral
2. Selecciona un video de la lista
3. El player cargara con todas las capas del video

## Elementos del preview

El player muestra:
- **Track de avatares**: Los clips de video con avatar
- **Track de slides**: Presentaciones y graficos
- **Track de B-roll**: Videos de fondo y complementarios
- **Track de audio**: Voz narrada + musica de fondo
- **Efectos**: Transiciones, zoom, fade in/out

## CDN y rendimiento

Los videos se sirven a traves de **Cloudflare Stream** para una reproduccion fluida. Si el video tarda en cargar:
1. El sistema usa preview en 720p para rapidez
2. Los primeros clips se precargan automaticamente
3. Si la reproduccion es lenta, espera unos segundos para que el buffer se llene

## Nota
El preview es una aproximacion del resultado final. El render de Shotstack puede tener ligeras diferencias en transiciones.', 'remotion', ARRAY['remotion', 'preview', 'editor', 'video'], 1);
