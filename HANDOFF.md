# PTE Tracker — Hand-off

Última actualización: 2026-07-10

Este documento resume el estado del proyecto para retomarlo sin perder contexto. Léelo antes de seguir trabajando.

## Qué es esto

App web para registrar y analizar el progreso de práctica del examen **PTE Academic**, enfocada en el objetivo de visa 482 (sponsor Australia). Vite + React 19 + TypeScript + Tailwind v4. Gráficos con Recharts, íconos con lucide-react.

- **Repo**: https://github.com/danielvidalt/PTE-tracker (rama `main`)
- **Deploy**: https://pte-tracker-nu.vercel.app (Vercel, auto-deploy en cada push a `main`)
- **Base de datos**: Supabase (proyecto `PTE-tracker`, org `KetoBio`). URL: `https://rkzvghoytharmddmwvcd.supabase.co`

## Arquitectura actual

- `src/App.tsx` — gate de autenticación. Verifica sesión de Supabase (`supabase.auth.getSession()` + `onAuthStateChange`) y renderiza `<Auth />` o `<MainApp session={session} />`.
- `src/components/Auth.tsx` — pantalla de login/signup con email + contraseña (Supabase Auth).
- `src/MainApp.tsx` — el shell de la app real (header, tabs, contenido). Carga todos los datos del usuario desde Supabase al montar, y cada acción (agregar/editar/borrar) escribe a Supabase y luego actualiza el estado local de React (patrón: escribir a la nube primero, actualizar UI después — no hay actualización optimista con rollback).
- `src/lib/supabaseClient.ts` — cliente de Supabase, lee `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` de env vars.
- `src/lib/supabaseData.ts` — capa de datos: funciones tipadas que traducen entre los tipos de la app (camelCase, `src/types.ts`) y las filas de las tablas (snake_case).
- `supabase/migration.sql` — schema SQL (4 tablas + RLS). Ya se corrió una vez en el proyecto real vía el SQL Editor de Supabase.
- Componentes de features: `Dashboard.tsx`, `Registro.tsx` (Registro de Puntaje), `DetallePreguntas.tsx` (Análisis de Preguntas), `DetalleBandas.tsx` (Fortalezas y Enfoque), `Configuracion.tsx` (Metas/Ajustes).

### Modelo de datos (Supabase)

4 tablas, todas con `user_id` + Row Level Security (`auth.uid() = user_id`):

- `skill_targets` — una fila por usuario (metas de puntaje, fechas de examen/inicio, tipo de meta).
- `question_types` — catálogo de los 15 tipos de pregunta PTE, por usuario (permite metas % custom por ítem).
- `entries` — registros de puntaje (`PTEEntry`): Full Test / Section Test / Question Test.
- `question_details` — desglose por ítem (`QuestionDetail`): contribución %, correctness %, vinculado opcionalmente a un `entry_id` que lo generó automáticamente.

### Flujo de autenticación

- Email + contraseña. **La confirmación por email está desactivada** en Supabase (Authentication → Providers → Email → "Confirm email" OFF) porque el servicio de email gratuito de Supabase tiene un rate limit muy bajo (se agotó durante las pruebas) y para una app de un solo usuario no aporta mucho. Si en el futuro se activa, hay que revisar que el flujo de `Auth.tsx` (que ya maneja el estado "revisa tu correo") siga funcionando.
- No hay recuperación de contraseña implementada todavía (no se pidió).

### Migración de localStorage → Supabase

Antes de conectar Supabase, todo vivía en `localStorage` del navegador (`pte-tracker-data-v1`). Se agregó un banner de importación única en `MainApp.tsx`: si detecta esa key en localStorage y la cuenta de Supabase está vacía (0 entries, 0 question_details), ofrece un botón "Importar datos" que sube todo de una vez. Se usó exitosamente para migrar los datos reales del usuario. Después de usarse, guarda `pte-tracker-migration-dismissed=true` en localStorage para no volver a ofrecerlo.

## Cronología de lo hecho en esta sesión (commits, más reciente arriba)

1. **Conexión inicial a GitHub** — se inicializó git en `pte-progress-tracker/` y se conectó a `github.com/danielvidalt/PTE-tracker`.
2. **Deploy a Vercel** — proyecto conectado vía import de GitHub, preset Vite, sin env vars al inicio (no las necesitaba, era solo localStorage).
3. Serie de fixes y features de producto (ver `git log` para detalle exacto de cada commit):
   - Botón "borrar todos los registros" (antes no existía forma de vaciar datos, solo "restaurar semilla de ejemplo" que traía de vuelta datos demo).
   - Se quitó el botón de "restaurar semilla de ejemplo", reemplazado por borrado real.
   - Título de página y metadata social cambiados de "My Google AI Studio App" a "PTE Tracker".
   - Se quitó el badge "Almacenamiento Local (Offline)" del header (quedó obsoleto en cuanto se agregó Supabase, pero se quitó antes por pedido estético).
   - **Auto-generación de ítems en Análisis de Preguntas**: al registrar un Full Test o Section Test en Registro de Puntaje, se generan automáticamente placeholders ("pendientes") de cada ítem de la(s) sección(es) correspondiente(s), en vez de tener que cargarlos uno por uno a mano. El usuario solo completa Contribución % y Correctness %.
   - Toast flotante recordando completar el análisis después de guardar un registro (usa un React Portal a `document.body` porque un ancestro con animación `transform` rompía el `position: fixed`).
   - Traducciones: "Score Analysis" → "Análisis de Preguntas", "Registro de Scores" → "Registro de Puntaje".
   - Columna de Meta y Estado automático (Bueno/Malo) en los ítems pendientes de Análisis de Preguntas (antes solo estaba en el historial ya completado).
   - Botones de edición inline (lápiz) en Registro de Puntaje y en Historial de Desglose — permiten corregir un registro sin borrar y recrear.
   - Dashboard: tarjeta "Último Simulacro Completo" mostrando fecha + los 5 puntajes del Full Test más reciente (antes solo había una tabla con "último puntaje por skill" que podía mezclar datos de tests distintos).
   - **Fix de agrupación en Historial de Desglose**: antes ordenaba solo por fecha, así que un test nuevo con ~15 ítems enterraba visualmente los registros viejos del mismo ítem. Se cambió a ordenar por ítem (orden del catálogo) y luego por fecha dentro de cada ítem, para poder comparar el progreso de un mismo ítem en el tiempo.
   - **Fix de timezone**: el campo "Fecha" por defecto usaba `new Date().toISOString()` (fecha UTC), lo que hacía que en timezones detrás de UTC (Chile, Perú, etc.) de noche ya marcara "mañana". Se corrigió con un helper `getLocalDateString()` que usa los componentes de fecha locales. Confirmado con un test que simuló las 11:30pm en `America/Santiago`.
   - Limpieza manual por el usuario de 6 registros fantasma con fecha "8 de julio" que se habían creado por el bug de timezone antes del fix (usando el botón de editar/borrar).
4. **Conexión a Supabase** (commit `6a42344`, el más grande):
   - Se creó el schema (`supabase/migration.sql`), corrido manualmente por el usuario en el SQL Editor de Supabase.
   - Se agregó auth (`Auth.tsx`), la capa de datos (`supabaseData.ts`), y se reescribió `App.tsx`/`MainApp.tsx` para leer/escribir todo desde Supabase en vez de localStorage.
   - Se agregaron env vars `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel (Production + Preview) y se hizo redeploy manual.
   - Se resolvió el rate limit de emails de confirmación desactivando "Confirm email" en Supabase.
   - Login, signup, y la importación de datos locales a la nube se probaron exitosamente en producción (el usuario lo confirmó).

## 🔴 Problema abierto (sin resolver, sin diagnosticar aún)

**Después de migrar a Supabase, en Análisis de Preguntas → Historial de Desglose desaparecen las fechas antiguas** (las del 6 y 7 de julio ya no se ven, solo quedan las más recientes).

- **Confirmado por el usuario**: el problema es *solo* en Análisis de Preguntas → Historial de Desglose. En Registro de Puntaje, los registros del 6 y 7 de julio **sí** siguen apareciendo bien. Esto acota el problema a la tabla `question_details` / su fetch / su render — no es una pérdida de datos general.
- **Se le pidió al usuario una captura de pantalla del Historial de Desglose para diagnosticar** — la conversación se cortó ahí, **la captura nunca llegó**. Este es el primer paso al retomar: pedir/revisar esa captura.
- **Hipótesis a investigar (ninguna confirmada todavía)**:
  1. Que el `insertQuestionDetails` durante la migración haya fallado parcialmente (p. ej. por un conflicto de `id` primary key si hubo un doble intento de importar, ya que el botón de importar podría haberse gatillado más de una vez) — revisar si hay algún error silencioso o si realmente todas las filas llegaron a la tabla `question_details` en Supabase (se puede chequear directo en el Table Editor de Supabase, filtrando por `user_id` y ordenando por `fecha`).
  2. Que el `.order('fecha', { ascending: false })` en `fetchAllData` (`src/lib/supabaseData.ts`) interactúe mal con el sort por ítem que se hace client-side en `DetallePreguntas.tsx` (`filteredDetails`), aunque en teoría el sort client-side debería ser independiente del orden de fetch.
  3. Que el campo `fecha` (tipo `date` en Postgres) vuelva en un formato de string distinto al esperado por `new Date(d.fecha)` en el sort/agrupación, rompiendo la comparación de fechas o el `Map` de `itemOrder`.
  4. Que sea un problema de límite de filas de PostgREST (poco probable con este volumen de datos, pero vale la pena descartar).
- **Primer paso recomendado al retomar**: pedir la captura de pantalla pendiente, y en paralelo revisar directamente en el Supabase Table Editor (`question_details`, filtrado por el `user_id` del usuario) cuántas filas hay y qué fechas tienen, para saber si el dato está en la base (bug de fetch/render) o si nunca llegó (bug de migración/insert).

## Otras cosas a tener en cuenta

- `.env.local` tiene las credenciales reales de Supabase (URL + anon/publishable key) y **no está en git** (`.gitignore` ya cubre `.env*` excepto `.env.example`). Si se abre el proyecto en otra máquina, hay que recrear ese archivo con los mismos valores (están en este documento arriba, la anon key también quedó pegada en la conversación con el usuario).
- La `service_role` key de Supabase **nunca se compartió ni se usó** — correcto, no debe usarse del lado del cliente.
- No hay recuperación de contraseña ni cambio de email implementados.
- No hay tests automatizados (unit/integration) — la verificación de cada feature se hizo manualmente con Playwright contra un dev server local (`localhost:3000`) en cada iteración, nunca contra el Supabase de producción del usuario salvo cuando él mismo lo probó.
- El bundle de producción pesa ~940KB (warning de Vite sobre chunk size) — no se ha hecho code-splitting, no es urgente pero podría optimizarse a futuro.
- Backup/exportar datos a archivo: existe un vestigio de esa idea (`handleImportBackup` existía en el `App.tsx` viejo antes de la reescritura, pero nunca estuvo conectado a ningún botón real) — **no está implementado**, se mencionó como posibilidad pero no se construyó.
