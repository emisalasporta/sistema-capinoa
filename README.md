# CAPINOA · Sistema de gestión

Sistema propio del centro de implante capilar del Dr. Ricardo Molina.
Pacientes, historia clínica tricológica, fotos y marcado sobre la foto.

---

## Cómo se usa (para Ricardo)

**No se instala nada.** El sistema vive en internet y se entra desde el
navegador, como a cualquier página, desde la computadora, la tablet o el celular:

> **https://sistema.capinoa.com.ar**
>
> (mientras se termina de configurar esa dirección, funciona la provisoria:
> https://capinoa.emilianosalasporta.cloud)

1. Abrí esa dirección. Fijate que tenga **el candado** al lado: significa que
   todo lo que viaja entre tu computadora y el sistema va cifrado.
2. Escribí tu usuario (tu correo) y tu contraseña.
3. La primera vez vas a entrar con una **contraseña provisoria** que te pasa
   Emiliano. El sistema te pide ahí mismo que la cambies por una tuya, de 10
   caracteres o más. Esa ya la sabés solo vos.

Cada persona tiene **su propio usuario**: nadie comparte contraseña. Si te
olvidás la tuya, avisale a Emiliano y te da una provisoria nueva.

Para salir: el botón de la flechita, abajo a la izquierda, al lado de tu nombre.

### Qué ve cada uno

- **Ricardo (administrador):** todo — historia clínica, evaluaciones, fotos,
  marcado, finanzas y los usuarios del equipo.
- **Recepción:** datos de contacto de los pacientes y **la agenda completa** (puede
  dar, mover y cancelar turnos). **No ve** historias clínicas, fotos ni finanzas:
  ni siquiera escribiendo la dirección a mano, porque el que no se las entrega es
  el servidor.

### Si algo falla o tenés una duda

En el menú de la izquierda está **Reportar un problema**. Escribís qué pasó y,
si podés, pegás una captura de la pantalla (Ctrl+V). Le llega a Emiliano.

---

## Cómo está organizada la ficha del paciente

La historia clínica completa son unas 200 preguntas. Cargarlas todas de una sentada
es imposible, así que está partida por **quién la contesta**:

| Capa | Qué | Quién | Cuándo |
|---|---|---|---|
| **1 · Datos personales** | Nombre, DNI, contacto | Recepción o el propio paciente | Al dar el alta · 1 minuto |
| **2 · Historia clínica** | Motivo, historia de la caída, antecedentes, medicación, hábitos, expectativas | **El paciente sobre sí mismo** | En la consulta, o desde el celular cuando exista el formulario online |
| **3 · Evaluación médica** | Examen, tricoscopía, escalas, zona donante, diagnóstico y plan | Solo el médico | En cada consulta y en cada control |

Nada es obligatorio: se guarda lo que haya y se sigue en la próxima consulta.
Cada sección muestra un contador ("7 de 12") para saber qué falta.

**Alertas automáticas.** Las respuestas que importan (estrés reciente, cirugía,
pérdida de peso, medicación que provoca caída, expectativa de recuperar el 100 %)
aparecen destacadas arriba de la ficha. Así no hay que releer todo antes de cada
consulta.

---

## Fotos y marcado

- Las fotos se sacan con el celular o la tablet y se suben al sistema. Se clasifican
  por **toma** (frontal, superior, vertex, occipital, zona donante…) y por **momento**
  (consulta inicial, día 7, 1 mes, 3 meses…). Con eso el sistema arma solo la
  comparación de evolución.
- Se achican al subirlas: la calidad clínica se mantiene y la carpeta no se infla.
- **Las fotos están protegidas:** no se pueden abrir con la dirección suelta, hace
  falta tener sesión iniciada.

**El marcado se dibuja ARRIBA de la foto, sin tocar la foto original.** Se guardan
dos cosas: el dibujo (que se puede volver a abrir y corregir meses después) y una
imagen combinada lista para mostrar o imprimir. De la misma foto puede haber varios
marcados, por ejemplo dos propuestas distintas de línea frontal.

---

## Agenda

Se puede ver **por semana o por mes**, con el botón de arriba a la derecha. El
sistema recuerda cuál elegiste.

- **Semana:** los 7 días con la cantidad de turnos de cada uno. Sirve para ver
  rápido dónde hay lugar.
- **Mes:** el calendario completo, con los turnos de cada día escritos adentro
  (hora y apellido). Sirve para ver cómo viene cargado el mes.

En las dos vistas, tocando un día se ven sus turnos ordenados por hora.

- **Dar un turno a alguien que todavía no es paciente:** en el selector de paciente
  se elige *"todavía no es paciente"* y se escribe el nombre y el teléfono. Es el
  caso típico de recepción: llaman para la primera consulta. Cuando la persona
  viene, se la carga como paciente.
- **La duración se sugiere sola** según el tipo de turno (control 20 min, consulta
  inicial 45 min, cirugía FUE 8 horas…), y se puede cambiar.
- **El estado se cambia desde la misma fila**, sin abrir nada: por confirmar →
  confirmado → en sala → atendido (o no vino / cancelado).
- Desde la ficha de un paciente, el botón **"Dar turno"** abre la agenda con ese
  paciente ya elegido.
- Los turnos cancelados quedan tachados, no se borran: sirve para saber quién
  cancela seguido.

Los turnos guardan **la hora del reloj del consultorio**, tal cual. No hay
conversiones de huso horario que puedan correr los horarios.

## Finanzas

Se trabaja **mes por mes**: arriba se ve cuánto entró, cuánto salió y el balance,
y abajo el detalle de cada movimiento.

- Los montos se cargan **siempre en positivo**. Que entre o salga lo define el
  campo "¿Entra o sale plata?". Así los totales nunca salen mal sumados.
- Las categorías cambian solas según el caso: en un ingreso ofrece "Implante FUE,
  Seña, PRP…", en un gasto "Insumos, Alquiler, Sueldos…".
- Un movimiento se puede asociar a un paciente. Eso alimenta la pestaña
  **"Cuenta"** de su ficha, donde se ve todo lo que esa persona pagó y el total.
  Desde ahí también se puede registrar un cobro nuevo directamente.
- Recepción **no entra** a finanzas.

## Licencia

El sistema está **activado para siempre**: no tiene período de prueba ni pide
clave de activación. En Configuración → Licencia dice «Sistema activado».

## Actualizaciones

Las hace Emiliano, fuera del horario de atención. **Vos no tenés que hacer nada**:
como mucho, recargar la página. Una actualización cambia las pantallas y el motor
del sistema, **jamás los datos**: pacientes, historias, fotos, turnos y cuentas
quedan como estaban.

## Copias de seguridad

- **Todas las noches** el sistema se hace solo una copia completa (base de datos
  y fotos) y la guarda **en otro lugar, fuera del servidor**. Se conservan las
  últimas dos semanas.
- Si borraste algo sin querer, avisale a Emiliano: se recupera de la copia de la
  noche anterior.
- **Una vez por mes** Emiliano te pasa una copia completa, para que la tengas vos.
  Tus datos son tuyos.

---

## Para Emiliano

Todo lo técnico (cómo se publica, cómo se actualiza, las variables del servidor,
la mudanza de datos y las contraseñas) está en **`CLAUDE.md`**. Acá, lo de todos
los días:

| Quiero… | Doble clic en… |
|---|---|
| Publicar los cambios que hay en esta carpeta | `SUBIR-CAMBIOS.command` |
| Darle una contraseña provisoria nueva a alguien | `herramientas/claves-nuevas.command` |
| Subir al servidor una copia traída de la clínica | `herramientas/subir-datos-al-servidor.command` |
| Probar el sistema en esta Mac, sin internet | `iniciar-capinoa.command` |

Las contraseñas **no están en esta carpeta** (el repositorio es público): viven en
`../CAPINOA-claves-privadas.txt`, al lado, y en Bitwarden.

Para programar, dos programas en paralelo:

```bash
cd sistema-capinoa && ./pocketbase serve
```

```bash
cd sistema-capinoa/web && npm install && npm run dev
```

- Sistema en desarrollo: http://localhost:4321
- Panel técnico de la base: http://127.0.0.1:8090/_/

### Para agregar o sacar preguntas de la historia clínica

Se toca **un solo archivo**: `web/src/lib/cuestionario.ts`.
Agregar una pregunta es agregar una línea. No hay que tocar la base de datos ni
rehacer ninguna pantalla. Después, `SUBIR-CAMBIOS.command`.

### La versión de la clínica (en retirada)

Los archivos `.bat` (`iniciar-capinoa.bat`, `respaldar.bat`, `actualizar-capinoa.bat`)
son de la etapa en que el sistema corría solo en la computadora de la clínica.
Quedan mientras dure la semana de prueba online, como respaldo. Después se apaga
esa versión y dejan de usarse.

---

## Estado

- ✅ Pacientes: alta, edición, búsqueda y listado
- ✅ Historia clínica tricológica completa por capas, con alertas
- ✅ Evaluaciones médicas y controles (escalas Norwood / Ludwig / Sinclair)
- ✅ Fotos clínicas clasificadas + galería de evolución
- ✅ Marcado sobre la foto (editable y reabrible)
- ✅ Roles y permisos (recepción sin acceso clínico)
- ✅ Agenda de turnos por semana y por mes, con estados y turnos para no-pacientes
- ✅ Finanzas por mes + cuenta de cada paciente en su ficha
- ✅ Configuración: mi cuenta, usuarios, licencia y respaldos
- ✅ Sistema activado, sin período de prueba ni clave
- ✅ Actualizaciones que no tocan los datos + respaldos automáticos
- ✅ En internet: dirección propia con candado, contraseña propia obligatoria,
  límite de intentos de ingreso, copias fuera del servidor y aviso si se cae
- ✅ Botón "Reportar un problema" con captura de pantalla
- ⏭️ Consentimientos digitales con firma
- ⏭️ Formulario online para que el paciente complete la capa 2 desde el celular
- ⏭️ Informe PDF de la ficha
