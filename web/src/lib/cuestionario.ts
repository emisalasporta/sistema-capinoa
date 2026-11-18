/**
 * ============================================================================
 *  CUESTIONARIO CLÍNICO DE CAPINOA — definición única
 * ============================================================================
 *
 * ESTE ES EL ARCHIVO QUE SE TOCA PARA CAMBIAR LA HISTORIA CLÍNICA.
 *
 * Todo el formulario (la historia clínica tricológica de Ricardo) está descripto
 * acá como una lista de secciones y preguntas. Las pantallas NO tienen el
 * formulario escrito adentro: lo leen de acá y lo dibujan solas.
 *
 * Consecuencias prácticas:
 *   · Agregar una pregunta   = agregar una línea en este archivo.
 *   · Sacar una pregunta     = borrar una línea.
 *   · Cambiar el orden       = mover la línea.
 *   → Sin tocar la base de datos, sin rehacer pantallas.
 *
 * ── Las tres capas ──────────────────────────────────────────────────────────
 * La historia completa son ~200 preguntas. Si hubiera que llenarlas todas de una
 * sentada, el sistema no se usa. Por eso está partida por QUIÉN la contesta:
 *
 *   CAPA 1 · Datos personales  → recepción o el propio paciente. 1 minuto.
 *            (no vive acá: son los campos de la collection "pacientes")
 *   CAPA 2 · Anamnesis         → la contesta EL PACIENTE sobre sí mismo.
 *            Hoy la carga Ricardo mientras conversa; el día que exista el
 *            formulario online, estas MISMAS preguntas se publican tal cual.
 *   CAPA 3 · Evaluación médica → solo el médico: examen, tricoscopía, escalas,
 *            zona donante, diagnóstico y plan. Se repite en cada control.
 *
 * Por eso cada sección lleva `quien`. Ese campo es el que permite generar el
 * formulario online el día de mañana sin escribir un formulario nuevo: es
 * "mostrar las secciones con quien = paciente".
 *
 * ── Regla de oro ────────────────────────────────────────────────────────────
 * NADA es obligatorio. La ficha se guarda con lo que haya. Un formulario médico
 * que no deja guardar hasta completar todo es un formulario que se abandona.
 */

export type TipoPregunta =
  | "texto" // una línea
  | "texto_largo" // párrafo
  | "numero"
  | "fecha"
  | "si_no" // Sí / No / (sin responder)
  | "si_no_detalle" // Sí / No + campo de detalle cuando es Sí
  | "opcion" // elegir una
  | "multiple"; // marcar varias

export type Pregunta = {
  /** Clave estable con la que se guarda la respuesta. NO cambiarla nunca:
   *  si se cambia, las respuestas ya cargadas quedan huérfanas. El texto
   *  visible (`label`) se puede cambiar todas las veces que haga falta. */
  id: string;
  label: string;
  tipo: TipoPregunta;
  opciones?: string[];
  /** Texto chico de ayuda debajo de la pregunta. */
  ayuda?: string;
  placeholder?: string;
  /** Si se responde que sí, se muestra como bandera roja arriba de la ficha. */
  alerta?: boolean;
  /** Ocupa el ancho completo de la fila. */
  ancho?: "completo";
};

export type Seccion = {
  id: string;
  titulo: string;
  descripcion?: string;
  /** Quién contesta esta sección. Define además el permiso y el formulario online. */
  quien: "paciente" | "medico";
  capa: 2 | 3;
  /** Sección que solo aplica a un sexo (ginecológica / hormonal masculina). */
  soloSexo?: "masculino" | "femenino";
  preguntas: Pregunta[];
};

/* ═══════════════════════════════════════════════════════════════════════════
   CAPA 2 — ANAMNESIS. Lo que contesta el paciente sobre sí mismo.
   Se guarda en la collection "historias", campo `respuestas`.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SECCIONES_HISTORIA: Seccion[] = [
  {
    id: "tamizaje",
    titulo: "Tamizaje rápido",
    descripcion:
      "Las preguntas que más rápido explican una caída repentina. Si alguna da que sí, queda marcada como alerta arriba de la ficha.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      { id: "tam_fiebre", label: "¿Tuviste fiebre o alguna infección en los últimos 7 días?", tipo: "si_no_detalle", alerta: true },
      { id: "tam_estres", label: "¿Tuviste estrés físico o psicológico importante?", tipo: "si_no_detalle", alerta: true },
      { id: "tam_cirugia", label: "¿Tuviste alguna cirugía hace poco?", tipo: "si_no_detalle", alerta: true },
      { id: "tam_peso", label: "¿Tuviste pérdida importante de peso?", tipo: "si_no_detalle", alerta: true },
      { id: "tam_dieta", label: "¿Estás haciendo alguna dieta muy estricta?", tipo: "si_no_detalle", alerta: true },
      { id: "tam_tiroides", label: "¿Tenés alguna alteración de la tiroides?", tipo: "si_no_detalle", alerta: true },
      {
        id: "tam_hierro",
        label: "¿Hace mucho que no te hacés un laboratorio para ver cómo está el hierro?",
        tipo: "si_no_detalle",
        ayuda: "El déficit de hierro y el déficit nutricional son causas frecuentes de caída.",
        alerta: true,
      },
      { id: "tam_sistemica", label: "¿Tuviste alguna enfermedad sistémica?", tipo: "si_no_detalle", alerta: true },
      { id: "tam_postparto", label: "¿Estás en un post parto?", tipo: "si_no", alerta: true },
      {
        id: "tam_medicamentos",
        label: "¿Estás tomando alguno de estos medicamentos?",
        tipo: "multiple",
        ayuda: "Todos estos pueden provocar caída del cabello.",
        alerta: true,
        ancho: "completo",
        opciones: [
          "Quimioterapia",
          "Valproato",
          "Retinoides sistémicos (isotretinoína)",
          "Anticoagulantes (heparina, warfarina)",
          "Betabloqueantes (propranolol, metoprolol)",
          "Antitiroideos (metimazol, propiltiouracilo)",
          "Litio",
          "Anticonvulsivantes (carbamazepina)",
          "Antidepresivos (fluoxetina, sertralina, escitalopram)",
          "Anticonceptivos hormonales (estrógeno, progestágeno, levonorgestrel)",
        ],
      },
    ],
  },

  {
    id: "motivo",
    titulo: "Motivo de consulta",
    quien: "paciente",
    capa: 2,
    preguntas: [
      {
        id: "mot_principal",
        label: "¿Cuál es el principal motivo por el que consultás?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Caída del cabello",
          "Afinamiento del cabello",
          "Entradas",
          "Pérdida de densidad",
          "Pérdida de cabello en la coronilla",
          "Alopecia localizada",
          "Alopecia de cejas",
          "Pérdida de cabello después de una enfermedad o estrés",
          "Trasplante capilar previo",
          "Evaluación para implante capilar",
          "Tratamiento preventivo",
          "Otro",
        ],
      },
      { id: "mot_preocupa", label: "¿Qué es lo que más te preocupa de tu cabello?", tipo: "texto_largo", ancho: "completo" },
      { id: "mot_espera", label: "¿Qué resultado esperás del tratamiento?", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "historia_caida",
    titulo: "Historia de la caída",
    descripcion: "Cuándo empezó, cómo se manifiesta y en qué zonas.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      // --- Inicio ---
      { id: "hc_cuando", label: "¿Cuándo empezaste a notar la pérdida de cabello?", tipo: "texto" },
      { id: "hc_edad_inicio", label: "¿Qué edad tenías aproximadamente?", tipo: "numero" },
      { id: "hc_forma", label: "¿La aparición fue gradual o repentina?", tipo: "opcion", opciones: ["Gradual", "Repentina", "No sabe"] },
      { id: "hc_continua", label: "¿La caída continúa actualmente?", tipo: "si_no" },
      { id: "hc_empeoro", label: "¿Empeoró en los últimos 6 a 12 meses?", tipo: "si_no" },
      { id: "hc_periodos", label: "¿La caída aparece por períodos o es continua?", tipo: "opcion", opciones: ["Por períodos", "Continua", "No sabe"] },
      {
        id: "hc_desencadenante",
        label: "¿Notaste algún acontecimiento antes de que empezara la caída?",
        tipo: "texto_largo",
        ancho: "completo",
        ayuda: "Una mudanza, un duelo, una enfermedad, un cambio de trabajo, una dieta.",
      },
      // --- Descripción ---
      { id: "hc_almohada", label: "¿Encontrás mucho cabello en la almohada?", tipo: "si_no" },
      { id: "hc_ducha", label: "¿Y en la ducha?", tipo: "si_no" },
      { id: "hc_peinarse", label: "¿Al peinarte?", tipo: "si_no" },
      { id: "hc_manos", label: "¿Notás más cabello en las manos al lavarte?", tipo: "si_no" },
      { id: "hc_afina", label: "¿Notás que el cabello se está afinando?", tipo: "si_no" },
      { id: "hc_volumen", label: "¿Disminuyó el volumen general?", tipo: "si_no" },
      { id: "hc_raya", label: "¿Se ensanchó la raya?", tipo: "si_no" },
      { id: "hc_entradas", label: "¿Aumentaron las entradas?", tipo: "si_no" },
      { id: "hc_coronilla", label: "¿Se aclaró la coronilla?", tipo: "si_no" },
      { id: "hc_miniaturizacion", label: "¿Notás pelos cada vez más finos y cortos?", tipo: "si_no" },
      // --- Distribución ---
      {
        id: "hc_zonas",
        label: "¿Dónde notás principalmente la pérdida?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Frontal",
          "Entradas",
          "Temporal",
          "Vertex / coronilla",
          "Región parietal",
          "Occipital",
          "Difusa",
          "Placas / localizada",
        ],
      },
    ],
  },

  {
    id: "familiares",
    titulo: "Antecedentes familiares",
    descripcion: "Clave para sospechar alopecia androgenética.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      { id: "fam_hay", label: "¿Hay antecedentes de alopecia en tu familia?", tipo: "si_no" },
      // Familia paterna
      { id: "fam_padre", label: "Padre", tipo: "texto", placeholder: "Ej: Norwood V, empezó a los 30" },
      { id: "fam_abuelo_paterno", label: "Abuelo paterno", tipo: "texto" },
      { id: "fam_tios_paternos", label: "Tíos paternos", tipo: "texto" },
      { id: "fam_hermanos_p", label: "Hermanos", tipo: "texto" },
      // Familia materna
      { id: "fam_madre", label: "Madre", tipo: "texto" },
      { id: "fam_abuelo_materno", label: "Abuelo materno", tipo: "texto" },
      { id: "fam_tios_maternos", label: "Tíos maternos", tipo: "texto" },
      { id: "fam_hermanas", label: "Hermanas", tipo: "texto" },
      {
        id: "fam_edad_inicio",
        label: "¿A qué edad les empezó la calvicie?",
        tipo: "texto",
        ancho: "completo",
      },
      {
        id: "fam_grado",
        label: "¿Qué grado de calvicie alcanzaron? ¿Hubo familiares con pérdida importante?",
        tipo: "texto_largo",
        ancho: "completo",
      },
    ],
  },

  {
    id: "personales",
    titulo: "Antecedentes personales",
    quien: "paciente",
    capa: 2,
    preguntas: [
      {
        id: "per_enfermedades",
        label: "¿Tenés o tuviste alguna de estas condiciones?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Hipertensión",
          "Diabetes",
          "Enfermedad tiroidea",
          "Anemia",
          "Déficit de hierro",
          "Enfermedad autoinmune",
          "Enfermedad dermatológica",
          "Enfermedad hormonal",
          "Síndrome de ovario poliquístico",
          "Enfermedad renal",
          "Enfermedad hepática",
          "Enfermedad gastrointestinal o malabsorción",
          "Antecedente de cáncer",
        ],
      },
      { id: "per_importante", label: "¿Tuviste alguna otra enfermedad importante?", tipo: "texto_largo", ancho: "completo" },
      { id: "per_infecciones", label: "¿Infecciones recientes? (COVID-19 u otra importante)", tipo: "si_no_detalle" },
      { id: "per_fiebre_6m", label: "¿Tuviste fiebre alta o una enfermedad importante en los últimos 3 a 6 meses?", tipo: "si_no_detalle", alerta: true },
      { id: "per_cirugias", label: "¿Cirugías recientes?", tipo: "si_no_detalle" },
      { id: "per_internaciones", label: "¿Internaciones recientes?", tipo: "si_no_detalle" },
    ],
  },

  {
    id: "medicacion",
    titulo: "Medicación",
    quien: "paciente",
    capa: 2,
    preguntas: [
      {
        id: "med_actual",
        label: "¿Qué medicamentos tomás actualmente?",
        tipo: "texto_largo",
        ancho: "completo",
        ayuda: "Anotá nombre, dosis, cada cuánto y desde cuándo. Uno por línea.",
        placeholder: "Finasteride 1 mg · 1 por día · desde marzo 2026",
      },
      {
        id: "med_grupos",
        label: "¿Tomás alguno de estos grupos?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Anticoagulantes",
          "Antihipertensivos",
          "Antidepresivos",
          "Anticonvulsivantes",
          "Retinoides",
          "Antitiroideos",
          "Tratamiento hormonal",
          "Anticonceptivos",
          "Corticoides",
          "Medicación para el colesterol",
          "Otros",
        ],
      },
      {
        id: "med_cambios",
        label: "¿Empezaste, suspendiste o cambiaste algún medicamento en los últimos 6 meses?",
        tipo: "si_no_detalle",
        ancho: "completo",
        alerta: true,
      },
    ],
  },

  {
    id: "nutricion",
    titulo: "Alimentación y estado nutricional",
    quien: "paciente",
    capa: 2,
    preguntas: [
      { id: "nut_como_es", label: "¿Cómo considerás que es tu alimentación?", tipo: "opcion", opciones: ["Muy buena", "Buena", "Regular", "Mala"] },
      { id: "nut_dieta", label: "¿Hiciste alguna dieta recientemente?", tipo: "si_no_detalle" },
      { id: "nut_vegetariana", label: "¿Dieta vegetariana o vegana?", tipo: "si_no" },
      { id: "nut_perdio_peso", label: "¿Perdiste peso recientemente?", tipo: "si_no" },
      { id: "nut_kilos", label: "¿Cuántos kilos?", tipo: "numero" },
      { id: "nut_tiempo", label: "¿En cuánto tiempo?", tipo: "texto", placeholder: "Ej: en 4 meses" },
      { id: "nut_ayuno", label: "¿Tuviste períodos de ayuno o restricción alimentaria?", tipo: "si_no_detalle" },
      { id: "nut_tca", label: "¿Antecedentes de trastornos alimentarios?", tipo: "si_no" },
      { id: "nut_proteina", label: "¿Considerás que consumís suficiente proteína?", tipo: "si_no" },
      { id: "nut_digestivos", label: "¿Tenés problemas digestivos?", tipo: "si_no_detalle" },
      { id: "nut_diarrea", label: "¿Diarrea crónica?", tipo: "si_no" },
      { id: "nut_bariatrica", label: "¿Cirugía bariátrica?", tipo: "si_no_detalle" },
      { id: "nut_absorcion", label: "¿Problemas de absorción intestinal?", tipo: "si_no_detalle" },
    ],
  },

  {
    id: "estres",
    titulo: "Estrés y acontecimientos recientes",
    descripcion: "Últimos 3 a 6 meses. Muy importante para investigar efluvio telógeno.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      {
        id: "est_situaciones",
        label: "¿Atravesaste alguna de estas situaciones?",
        tipo: "multiple",
        ancho: "completo",
        alerta: true,
        opciones: [
          "Período de estrés importante",
          "Problemas familiares",
          "Problemas laborales",
          "Separación",
          "Duelo",
          "Ansiedad intensa",
          "Alteraciones importantes del sueño",
          "Exceso de actividad física",
          "Enfermedad importante",
          "Cirugía",
          "Accidente",
          "Hospitalización",
        ],
      },
      { id: "est_detalle", label: "Contanos un poco más", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "ginecologica",
    titulo: "Historia ginecológica y hormonal",
    quien: "paciente",
    capa: 2,
    soloSexo: "femenino",
    preguntas: [
      { id: "gin_menarca", label: "Edad de la primera menstruación", tipo: "numero" },
      { id: "gin_regulares", label: "¿Ciclos menstruales regulares?", tipo: "si_no" },
      { id: "gin_cada_cuanto", label: "¿Cada cuántos días?", tipo: "numero" },
      { id: "gin_abundantes", label: "¿Menstruaciones abundantes?", tipo: "si_no" },
      { id: "gin_amenorrea", label: "¿Amenorrea? (ausencia de menstruación)", tipo: "si_no" },
      { id: "gin_embarazos", label: "Embarazos", tipo: "numero" },
      { id: "gin_partos", label: "Partos", tipo: "numero" },
      { id: "gin_abortos", label: "Abortos", tipo: "numero" },
      { id: "gin_ultimo_embarazo", label: "¿Cuándo fue el último embarazo?", tipo: "texto" },
      { id: "gin_lactancia", label: "¿Lactancia?", tipo: "si_no" },
      { id: "gin_menopausia", label: "¿Menopausia?", tipo: "si_no" },
      { id: "gin_edad_menopausia", label: "Edad de la menopausia", tipo: "numero" },
      // Hiperandrogenismo
      {
        id: "gin_hiperandrogenismo",
        label: "¿Notás alguno de estos signos?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Acné",
          "Aumento del vello facial",
          "Aumento del vello corporal",
          "Voz más grave",
          "Cambios importantes en la distribución del vello",
        ],
      },
      { id: "gin_sop", label: "¿Diagnóstico de síndrome de ovario poliquístico?", tipo: "si_no" },
      // Anticoncepción
      { id: "gin_anticonceptivos", label: "¿Usás anticonceptivos?", tipo: "si_no" },
      { id: "gin_cual", label: "¿Cuál?", tipo: "texto" },
      { id: "gin_desde", label: "¿Desde cuándo?", tipo: "texto" },
      { id: "gin_suspendio", label: "¿Los suspendiste recientemente?", tipo: "si_no", alerta: true },
      { id: "gin_cambio", label: "¿Cambiaste de anticonceptivo?", tipo: "si_no_detalle" },
    ],
  },

  {
    id: "hormonal_masculino",
    titulo: "Antecedentes hormonales",
    quien: "paciente",
    capa: 2,
    soloSexo: "masculino",
    preguntas: [
      { id: "hom_testosterona", label: "¿Usás testosterona?", tipo: "si_no_detalle", alerta: true },
      { id: "hom_anabolicos", label: "¿Anabólicos?", tipo: "si_no_detalle", alerta: true },
      { id: "hom_tratamiento", label: "¿Algún tratamiento hormonal?", tipo: "si_no_detalle" },
      { id: "hom_suplementos", label: "¿Suplementos para aumentar masa muscular?", tipo: "si_no_detalle" },
      { id: "hom_alteraciones", label: "¿Antecedentes de alteraciones hormonales?", tipo: "si_no_detalle" },
      { id: "hom_libido", label: "¿Disminución de la libido?", tipo: "si_no" },
      { id: "hom_sexuales", label: "¿Alteraciones sexuales?", tipo: "si_no" },
      { id: "hom_prostata", label: "¿Tratamientos para la próstata?", tipo: "si_no_detalle" },
    ],
  },

  {
    id: "cuero_cabelludo",
    titulo: "Cuero cabelludo",
    descripcion: "Qué sentís en el cuero cabelludo.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      {
        id: "cc_sintomas",
        label: "¿Tenés alguno de estos síntomas?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Picazón",
          "Descamación",
          "Caspa",
          "Enrojecimiento",
          "Dolor",
          "Ardor",
          "Sensibilidad",
          "Granitos",
          "Costras",
          "Secreción",
          "Sangrado",
          "Sensación de calor",
          "Dolor al tocar el cuero cabelludo",
        ],
      },
      { id: "cc_detalle", label: "Detalle", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "cosmeticos",
    titulo: "Hábitos cosméticos",
    quien: "paciente",
    capa: 2,
    preguntas: [
      { id: "cos_lavado", label: "¿Cada cuánto te lavás el cabello?", tipo: "texto", placeholder: "Ej: día por medio" },
      { id: "cos_shampoo", label: "¿Qué shampoo usás?", tipo: "texto" },
      {
        id: "cos_productos",
        label: "¿Cuáles de estos usás?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Acondicionador",
          "Mascarillas",
          "Aceites",
          "Gel",
          "Cera",
          "Laca",
          "Otros fijadores",
        ],
      },
      { id: "cos_alisado", label: "¿Te hacés alisados?", tipo: "si_no" },
      { id: "cos_alisado_quimico", label: "¿Alisado químico?", tipo: "si_no" },
      { id: "cos_tintura", label: "¿Tintura?", tipo: "si_no" },
      { id: "cos_decoloracion", label: "¿Decoloración?", tipo: "si_no" },
      { id: "cos_frecuencia", label: "¿Cada cuánto?", tipo: "texto" },
      {
        id: "cos_calor",
        label: "¿Usás alguno de estos?",
        tipo: "multiple",
        ancho: "completo",
        opciones: ["Secador", "Planchita", "Buclera", "Agua muy caliente"],
      },
    ],
  },

  {
    id: "traccion",
    titulo: "Tracción y hábitos",
    quien: "paciente",
    capa: 2,
    preguntas: [
      {
        id: "tra_habitos",
        label: "¿Alguno de estos?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Peinados muy tirantes",
          "Cola de caballo frecuente",
          "Trenzas",
          "Extensiones",
          "Dreadlocks",
          "Casco durante muchas horas",
          "Gorra o sombrero por períodos prolongados",
        ],
      },
      { id: "tra_detalle", label: "Detalle", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "tratamientos_previos",
    titulo: "Tratamientos capilares previos",
    descripcion: "Todo lo que se haya probado antes, aunque no haya funcionado.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      // Minoxidil
      { id: "tp_minoxidil", label: "¿Usaste minoxidil?", tipo: "si_no" },
      { id: "tp_minoxidil_via", label: "¿Tópico u oral?", tipo: "opcion", opciones: ["Tópico", "Oral", "Los dos"] },
      { id: "tp_minoxidil_conc", label: "Concentración", tipo: "texto", placeholder: "Ej: 5%" },
      { id: "tp_minoxidil_desde", label: "¿Desde cuándo?", tipo: "texto" },
      { id: "tp_minoxidil_susp", label: "¿Lo suspendiste?", tipo: "si_no_detalle" },
      { id: "tp_minoxidil_adversos", label: "¿Tuviste efectos adversos?", tipo: "si_no_detalle" },
      // Finasteride
      { id: "tp_finasteride", label: "¿Usaste finasteride?", tipo: "si_no" },
      { id: "tp_finasteride_dosis", label: "Dosis", tipo: "texto", placeholder: "Ej: 1 mg/día" },
      { id: "tp_finasteride_tiempo", label: "¿Cuánto tiempo?", tipo: "texto" },
      { id: "tp_finasteride_respuesta", label: "¿Cómo respondiste?", tipo: "texto" },
      // Dutasteride
      { id: "tp_dutasteride", label: "¿Usaste dutasteride?", tipo: "si_no" },
      { id: "tp_dutasteride_dosis", label: "Dosis", tipo: "texto" },
      { id: "tp_dutasteride_tiempo", label: "¿Cuánto tiempo?", tipo: "texto" },
      // Procedimientos
      {
        id: "tp_procedimientos",
        label: "¿Te hiciste alguno de estos procedimientos?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "PRP",
          "Mesoterapia",
          "Exosomas",
          "Microneedling",
          "Láser / LED",
          "Trasplante capilar",
        ],
      },
      { id: "tp_proc_detalle", label: "¿Cuándo, dónde y con qué resultado?", tipo: "texto_largo", ancho: "completo" },
      // Balance
      { id: "tp_funcionaron", label: "¿Qué tratamientos te funcionaron?", tipo: "texto_largo", ancho: "completo" },
      { id: "tp_no_funcionaron", label: "¿Cuáles no funcionaron?", tipo: "texto_largo", ancho: "completo" },
      { id: "tp_abandono", label: "¿Por qué los abandonaste?", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "trasplante_previo",
    titulo: "Trasplante capilar previo",
    descripcion: "Completar solo si ya se hizo un trasplante antes.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      { id: "trp_realizado", label: "¿Te hiciste un trasplante?", tipo: "si_no" },
      { id: "trp_cuando", label: "¿Cuándo?", tipo: "texto" },
      { id: "trp_tecnica", label: "Técnica", tipo: "opcion", opciones: ["FUE", "FUT", "No sabe"] },
      { id: "trp_uf", label: "Cantidad aproximada de unidades foliculares", tipo: "numero" },
      { id: "trp_donante", label: "Zona donante", tipo: "texto" },
      { id: "trp_receptora", label: "Zona receptora", tipo: "texto" },
      { id: "trp_donde", label: "¿Dónde te lo hiciste?", tipo: "texto" },
      { id: "trp_complicaciones", label: "¿Tuviste complicaciones?", tipo: "si_no_detalle" },
      { id: "trp_satisfecho", label: "¿Estás conforme con el resultado?", tipo: "si_no_detalle" },
      { id: "trp_caida_nativa", label: "¿Siguió cayéndose el cabello propio?", tipo: "si_no" },
      { id: "trp_tto_posterior", label: "¿Hiciste tratamiento médico después?", tipo: "si_no_detalle" },
    ],
  },

  {
    id: "dermatologicos",
    titulo: "Antecedentes dermatológicos",
    quien: "paciente",
    capa: 2,
    preguntas: [
      {
        id: "der_condiciones",
        label: "¿Tuviste alguna de estas?",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Dermatitis seborreica",
          "Psoriasis",
          "Dermatitis atópica",
          "Alopecia areata",
          "Hongos",
          "Foliculitis",
          "Lupus u otra enfermedad autoinmune",
        ],
      },
      { id: "der_cicatrices", label: "¿Cicatrices en el cuero cabelludo?", tipo: "si_no_detalle" },
      { id: "der_lesiones", label: "¿Lesiones previas?", tipo: "si_no_detalle" },
    ],
  },

  {
    id: "expectativas",
    titulo: "Expectativas",
    descripcion:
      "Determinante antes de indicar un implante: una buena indicación quirúrgica no depende solo de cuántas unidades foliculares haya disponibles.",
    quien: "paciente",
    capa: 2,
    preguntas: [
      { id: "exp_conseguir", label: "¿Qué esperás conseguir con el tratamiento?", tipo: "texto_largo", ancho: "completo" },
      { id: "exp_zona", label: "¿Qué zona considerás más importante?", tipo: "texto", ancho: "completo" },
      {
        id: "exp_objetivo",
        label: "¿Buscás recuperar densidad o principalmente modificar la línea frontal?",
        tipo: "opcion",
        opciones: ["Densidad", "Línea frontal", "Las dos cosas", "No lo tiene claro"],
      },
      { id: "exp_satisfactorio", label: "¿Qué resultado considerarías satisfactorio?", tipo: "texto_largo", ancho: "completo" },
      {
        id: "exp_100",
        label: "¿Esperás recuperar el 100 % del cabello perdido?",
        tipo: "si_no",
        ayuda: "Si contesta que sí, hay que trabajar la expectativa antes de indicar cirugía.",
        alerta: true,
      },
      { id: "exp_tto_prolongado", label: "¿Estás dispuesto a hacer un tratamiento médico prolongado?", tipo: "si_no" },
      { id: "exp_cirugia", label: "¿Aceptarías un procedimiento quirúrgico?", tipo: "si_no" },
      { id: "exp_preocupacion", label: "¿Cuál es tu principal preocupación estética?", tipo: "texto_largo", ancho: "completo" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   CAPA 3 — EVALUACIÓN MÉDICA. Solo la escribe el médico, en cada encuentro.
   Se guarda en la collection "evaluaciones", campo `datos`.
   (Fecha, tipo, diagnóstico, escalas, candidato a FUE, UF estimadas, impresión
   y próximo control son campos propios de la collection, no van acá.)
   ═══════════════════════════════════════════════════════════════════════════ */

export const SECCIONES_EVALUACION: Seccion[] = [
  {
    id: "examen_fisico",
    titulo: "Examen físico",
    quien: "medico",
    capa: 3,
    preguntas: [
      {
        id: "ef_cuero",
        label: "Cuero cabelludo",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Normal",
          "Eritema",
          "Descamación",
          "Seborrea",
          "Foliculitis",
          "Costras",
          "Cicatrices",
          "Atrofia",
          "Alteración de la pigmentación",
        ],
      },
      { id: "ef_densidad", label: "Densidad", tipo: "texto" },
      { id: "ef_grosor", label: "Grosor", tipo: "texto" },
      { id: "ef_variabilidad", label: "Variabilidad del diámetro", tipo: "texto" },
      { id: "ef_miniaturizacion", label: "Miniaturización", tipo: "texto" },
      { id: "ef_terminal", label: "Pelo terminal", tipo: "texto" },
      { id: "ef_velloso", label: "Pelo velloso", tipo: "texto" },
      { id: "ef_longitudes", label: "Pelos en diferentes longitudes", tipo: "texto" },
      { id: "ef_rotos", label: "Pelos rotos", tipo: "texto" },
    ],
  },

  {
    id: "tricoscopia",
    titulo: "Tricoscopía",
    quien: "medico",
    capa: 3,
    preguntas: [
      {
        id: "tri_regiones",
        label: "Regiones examinadas",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Frontal",
          "Fronto-temporal derecha",
          "Fronto-temporal izquierda",
          "Mid-scalp",
          "Vertex",
          "Parietal derecha",
          "Parietal izquierda",
          "Occipital",
        ],
      },
      { id: "tri_densidad_folicular", label: "Densidad folicular", tipo: "texto", placeholder: "Ej: 42 UF/cm²" },
      { id: "tri_unidades", label: "Unidades foliculares", tipo: "texto" },
      { id: "tri_diametro", label: "Diámetro de los tallos", tipo: "texto" },
      { id: "tri_variabilidad", label: "Variabilidad del diámetro", tipo: "texto" },
      { id: "tri_miniaturizacion", label: "Miniaturización", tipo: "texto", placeholder: "Ej: 35% (moderada)" },
      { id: "tri_vellosos", label: "Pelos vellosos", tipo: "texto" },
      { id: "tri_terminales", label: "Pelos terminales", tipo: "texto" },
      {
        id: "tri_hallazgos",
        label: "Hallazgos",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Pelos distróficos",
          "Pelos en signo de exclamación",
          "Pelos en punto",
          "Pelos rotos",
          "Pelos en círculo",
          "Descamación perifolicular",
          "Eritema",
          "Signos de inflamación",
          "Signos de fibrosis / cicatrización",
        ],
      },
      { id: "tri_caracteristicos", label: "Hallazgos característicos", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "zona_donante",
    titulo: "Zona donante",
    descripcion: "Fundamental para evaluar un implante.",
    quien: "medico",
    capa: 3,
    preguntas: [
      { id: "zd_densidad", label: "Densidad donante", tipo: "texto" },
      { id: "zd_calidad", label: "Calidad del cabello", tipo: "texto" },
      { id: "zd_grosor", label: "Grosor", tipo: "texto" },
      { id: "zd_area", label: "Área disponible", tipo: "texto" },
      { id: "zd_estabilidad", label: "Estabilidad de la zona", tipo: "texto" },
      { id: "zd_miniaturizacion", label: "Miniaturización", tipo: "texto" },
      { id: "zd_cicatrices", label: "Cicatrices", tipo: "texto" },
      { id: "zd_extracciones", label: "Extracciones previas", tipo: "texto" },
      { id: "zd_capacidad", label: "Capacidad estimada de extracción", tipo: "texto", ancho: "completo" },
    ],
  },

  {
    id: "diagnostico",
    titulo: "Diagnóstico presuntivo",
    quien: "medico",
    capa: 3,
    preguntas: [
      {
        id: "dx_presuntivo",
        label: "Diagnóstico",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Alopecia androgenética masculina",
          "Alopecia androgenética femenina",
          "Efluvio telógeno",
          "Alopecia areata",
          "Alopecia traccional",
          "Alopecia por tricotilomanía",
          "Alopecia cicatricial",
          "Dermatitis seborreica asociada",
          "Alopecia medicamentosa",
          "Efluvio anágeno",
          "Alopecia por déficit nutricional",
          "Otra",
          "Diagnóstico diferencial pendiente",
        ],
      },
      { id: "dx_diferenciales", label: "Diagnósticos diferenciales", tipo: "texto_largo", ancho: "completo" },
      { id: "dx_pronostico", label: "Pronóstico", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "estudios",
    titulo: "Estudios complementarios",
    descripcion:
      "Se piden según la sospecha clínica, no de rutina a todos los pacientes.",
    quien: "medico",
    capa: 3,
    preguntas: [
      {
        id: "est_solicitados",
        label: "Estudios solicitados",
        tipo: "multiple",
        ancho: "completo",
        opciones: [
          "Hemograma",
          "Ferritina",
          "Hierro",
          "Transferrina / saturación",
          "TSH",
          "T4 libre",
          "Vitamina D",
          "Vitamina B12",
          "Folato",
          "Zinc",
          "Perfil hormonal",
        ],
      },
      { id: "est_otros", label: "Otros estudios", tipo: "texto", ancho: "completo" },
      { id: "est_resultados", label: "Resultados", tipo: "texto_largo", ancho: "completo" },
    ],
  },

  {
    id: "plan",
    titulo: "Plan terapéutico",
    quien: "medico",
    capa: 3,
    preguntas: [
      {
        id: "plan_medico",
        label: "Tratamiento médico",
        tipo: "multiple",
        ancho: "completo",
        opciones: ["Minoxidil", "Finasteride", "Dutasteride", "Otro", "No indicado"],
      },
      {
        id: "plan_complementarios",
        label: "Tratamientos complementarios",
        tipo: "multiple",
        ancho: "completo",
        opciones: ["PRP", "Mesoterapia", "Microneedling", "Fotobiomodulación / LED", "Otro"],
      },
      { id: "plan_objetivo", label: "Objetivo terapéutico", tipo: "texto_largo", ancho: "completo" },
      { id: "plan_indicado", label: "Tratamiento indicado", tipo: "texto_largo", ancho: "completo" },
      { id: "plan_frecuencia", label: "Frecuencia", tipo: "texto" },
      { id: "plan_duracion", label: "Duración estimada", tipo: "texto" },
      { id: "plan_controles", label: "Controles", tipo: "texto" },
      { id: "plan_zonas", label: "Zonas a implantar", tipo: "texto", ancho: "completo" },
    ],
  },

  {
    id: "seguimiento",
    titulo: "Evolución y seguimiento",
    descripcion: "Se completa en los controles.",
    quien: "medico",
    capa: 3,
    preguntas: [
      { id: "seg_subjetiva", label: "Evolución subjetiva", tipo: "texto_largo", ancho: "completo", ayuda: "Cómo se ve el paciente a sí mismo." },
      { id: "seg_objetiva", label: "Evolución objetiva", tipo: "texto_largo", ancho: "completo" },
      { id: "seg_adherencia", label: "Adherencia al tratamiento", tipo: "opcion", opciones: ["Buena", "Regular", "Mala", "Abandonó"] },
      { id: "seg_adversos", label: "Efectos adversos", tipo: "si_no_detalle" },
      { id: "seg_cambios_medicacion", label: "Cambios de medicación", tipo: "texto_largo", ancho: "completo" },
      { id: "seg_cambios_densidad", label: "Cambios en densidad", tipo: "texto" },
      { id: "seg_cambios_diametro", label: "Cambios en diámetro", tipo: "texto" },
      { id: "seg_decision", label: "Decisión terapéutica", tipo: "texto_largo", ancho: "completo" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Utilidades
   ═══════════════════════════════════════════════════════════════════════════ */

/** Todas las secciones, de las dos capas. */
export const TODAS_LAS_SECCIONES: Seccion[] = [
  ...SECCIONES_HISTORIA,
  ...SECCIONES_EVALUACION,
];

/**
 * Filtra las secciones que corresponden a un paciente según su sexo.
 * (A una mujer no se le muestra "antecedentes hormonales masculinos" y viceversa.
 * Si el sexo no está cargado, se muestran las dos: mejor de más que de menos.)
 */
export function seccionesPara(
  secciones: Seccion[],
  sexo?: string | null
): Seccion[] {
  if (!sexo || sexo === "otro") return secciones;
  return secciones.filter((s) => !s.soloSexo || s.soloSexo === sexo);
}

/** Busca una pregunta por su id en cualquier sección. */
export function buscarPregunta(id: string): Pregunta | undefined {
  for (const s of TODAS_LAS_SECCIONES) {
    const p = s.preguntas.find((q) => q.id === id);
    if (p) return p;
  }
  return undefined;
}

/** ¿La respuesta tiene contenido? Sirve para contar progreso y para no
 *  mostrar en el resumen las preguntas que quedaron vacías. */
export function tieneRespuesta(valor: unknown): boolean {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string") return valor.trim() !== "";
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === "object") {
    const v = valor as { valor?: unknown; detalle?: unknown };
    return tieneRespuesta(v.valor) || tieneRespuesta(v.detalle);
  }
  return true;
}

/** Cuenta cuántas preguntas de una sección están contestadas. */
export function progresoSeccion(
  seccion: Seccion,
  respuestas: Record<string, unknown>
): { contestadas: number; total: number } {
  let contestadas = 0;
  for (const p of seccion.preguntas) {
    if (tieneRespuesta(respuestas?.[p.id])) contestadas++;
  }
  return { contestadas, total: seccion.preguntas.length };
}

/**
 * Devuelve las banderas rojas: preguntas marcadas con `alerta` que el paciente
 * respondió afirmativamente. Es lo que se muestra arriba de la ficha para que
 * Ricardo no tenga que releer 200 preguntas antes de cada consulta.
 */
export function alertas(respuestas: Record<string, unknown>): string[] {
  const encontradas: string[] = [];
  for (const seccion of SECCIONES_HISTORIA) {
    for (const p of seccion.preguntas) {
      if (!p.alerta) continue;
      const valor = respuestas?.[p.id];
      if (!tieneRespuesta(valor)) continue;

      if (p.tipo === "multiple" && Array.isArray(valor)) {
        for (const opcion of valor) encontradas.push(`${p.label} → ${opcion}`);
      } else if (p.tipo === "si_no" && valor === "si") {
        encontradas.push(p.label);
      } else if (p.tipo === "si_no_detalle") {
        const v = valor as { valor?: string; detalle?: string };
        if (v?.valor === "si") {
          encontradas.push(v.detalle ? `${p.label} → ${v.detalle}` : p.label);
        }
      }
    }
  }
  return encontradas;
}
