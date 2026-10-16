/* --- 0. URL pública base — dominio que ven los papás en la barra del navegador.
   Si la app se embebe en Wix (u otro dominio), pon aquí la URL de esa página
   para que los enlaces generados en la vista de dirección apunten al dominio
   del colegio en lugar del de GitHub Pages. Dejar vacía usa window.location. */
const PUBLIC_BASE_URL = "";

/* --- 1. CONFIG: pega aquí la URL CSV publicada de tu Google Sheet ---
   Para publicar: Archivo → Compartir → Publicar en la Web →
   Hoja entera → Formato: Valores separados por comas (.csv) → Publicar.
   Copia la URL larga que termina en /pub?output=csv y pégala abajo.
   Mientras esté vacía la URL, la página usa datos de ejemplo.            */
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbLbOfHDDk_zXfiSPG5GhwLdJ2rh1Ra7f6rUNiu2_iiJcJX4gw00Yd6R6xU4PcL3NbEFLsFbJC8gCm/pub?gid=1924435207&single=true&output=csv";

/* --- 1.1 URL de EDICIÓN de la hoja (para el botón en la vista de
   dirección). Es distinta a la de arriba: la de arriba es la versión
   publicada solo-lectura; esta es la normal que abres para editar,
   tipo https://docs.google.com/spreadsheets/d/<ID>/edit.
   Si se deja vacía, el botón simplemente no se muestra.               */
const SHEET_EDIT_URL = "https://docs.google.com/spreadsheets/d/1oDPoPPNQD1zo4I3GJLd7X5CJaGjp9_IGFPYO7hmbmkw/edit";

/* --- 2. Horario fijo de secundaria (lun–vie), igual para 1°, 2° y 3°.
   8 bloques lun–jue; el viernes son 7 (termina a las 13:45).
   Los bloques que no se usen se marcan LIBRE en la hoja y no muestran tarjeta.
   Para un receso: { recess: true, from: "HH:MM", to: "HH:MM" } --- */
const SCHEDULE_BLOCKS = [
    { from: "08:00", to: "08:45" },
    { from: "08:45", to: "09:30" },
    { from: "09:30", to: "10:15" },
    { from: "10:15", to: "11:00" },
    { from: "11:30", to: "12:15" },
    { from: "12:15", to: "13:00" },
    { from: "13:00", to: "13:45" },
    { from: "13:45", to: "14:25" }
];

function scheduleForGrade(grade, dayLabel) {
    const label = (dayLabel || getTodayDiaLabel()).trim();
    return /^viernes/i.test(label) ? SCHEDULE_BLOCKS.slice(0, -1) : SCHEDULE_BLOCKS;   // viernes: sin la 8ª sesión
}

function scheduleForGroup(groupId, dayLabel) {
    const g = GROUPS.find(x => x.id === groupId);
    return scheduleForGrade(g ? g.grade : 3, dayLabel);
}

/* --- 2.1 Palabra clave para ocultar una hora -------------------------
   Escribir "LIBRE" en la columna `materia` oculta esa tarjeta por
   completo (días en que solo se dan las hora clase). Dejar la celda
   VACÍA es distinto: la tarjeta sigue visible como "Pendiente".
   La comparación ignora mayúsculas y acentos.                        */
const FREE_SLOT_KEYWORDS = ["libre"];

/* --- 3. Group list --- */
const GROUPS = [];
for (let g = 1; g <= 3; g++) {
    for (const sec of ["A", "B"]) {
        GROUPS.push({
            id: `${g}${sec}`,
            grade: g,
            section: sec,
            display: `${g}°${sec}`,
            longName: `${ordinalName(g)} "${sec}"`
        });
    }
}

function ordinalName(n) {
    return ["Primero", "Segundo", "Tercero"][n - 1] || `${n}°`;
}

/* --- 3.1 Tokens: enlace público -> grupo -------------------------------
   A propósito son cadenas revueltas (no "1A", "2B"...) para que alguien que
   cambie la URL a mano no pueda adivinar el enlace de otro grupo. Es la
   única lista de tokens — la usan tanto index.html como grupo.html.
   NOTA: al ser una página estática, esta lista vive en el código fuente;
   frena a un papá curioso, no a alguien con conocimientos técnicos.       */
const TOKENS = {
    "rsfi1onl": "1A",
    "u7rd95r4": "1B",
    "qnxz8o2y": "2A",
    "tmxep8hw": "2B",
    "rpl3x3n6": "3A",
    "w4myq8i0": "3B"
};

function tokenForGroup(groupId) {
    for (const t in TOKENS) { if (TOKENS[t] === groupId) return t; }
    return "";
}

/* --- 3.2 Token de dirección/coordinación -------------------------------
   index.html (el listado completo de los 6 grupos) también exige token,
   igual que grupo.html: así nadie llega al listado completo solo
   adivinando "index.html" en el navegador. Este token se comparte
   ÚNICAMENTE con dirección/coordinación, nunca con los papás.            */
const DIRECTOR_TOKEN = "nai19wlp";

/* --- Date helpers --- */
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function getTodayDiaLabel(date) {
    const d = date || new Date();
    const day = DAY_NAMES[d.getDay()];
    return `${day} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
}
function getTodayShortDay(date) {
    const d = date || new Date();
    return DAY_NAMES[d.getDay()].slice(0, 3).toUpperCase();
}

/* --- 4. Sample data (used when SHEET_CSV_URL is empty or fetch fails) --- */
const SAMPLE_ROWS = (function () {
    const todayDia = getTodayDiaLabel();
    const plans = {
        1: ["Español", "Matemáticas", "Biología", "Historia", "Inglés", "Geografía", "Educación física", "Tutoría"],
        2: ["Matemáticas", "Español", "Física", "Historia", "Inglés", "Formación Cívica", "Computación", "Educación física"],
        3: ["Español", "Matemáticas", "Química", "Historia", "Inglés", "Formación Cívica", "Artes", "Tutoría"]
    };
    const teachersA = ["Mtra. Lucía Hernández", "Mtro. Andrés Salinas", "Mtra. Paola Ríos", "Mtra. Mariana Cervantes", "Mtro. Iván Fuentes", "Mtra. Daniela Ortega", "Mtro. Roberto Vázquez", "Mtra. Sofía Domínguez"];
    const teachersB = ["Mtra. Adriana López", "Mtro. Sergio Romero", "Mtra. Karla Mendoza", "Mtra. Verónica Ibarra", "Mtro. Óscar Treviño", "Mtra. Renata Cárdenas", "Mtro. Diego Aguilar", "Mtra. Paulina Estrada"];

    const rows = [];
    GROUPS.forEach(group => {
        const subjects = plans[group.grade];
        const teachers = group.section === "A" ? teachersA : teachersB;
        const teachingSlots = scheduleForGrade(group.grade, todayDia).filter(b => !b.recess);
        teachingSlots.forEach((slot, i) => {
            const subject = subjects[i % subjects.length];
            const teacher = teachers[i % teachers.length];
            let link = "";
            const seed = (group.grade * 31 + group.section.charCodeAt(0) + i * 7) % 11;
            if (seed === 0 || seed === 4) {
                link = "";
            } else if (seed % 2 === 0) {
                link = `https://zoom.us/j/${1000000000 + group.grade * 1000 + i * 111 + (group.section === "B" ? 37 : 0)}`;
            } else {
                link = `https://meet.google.com/${"abc".charAt(group.grade % 3)}-${group.section.toLowerCase()}${group.grade}${i}-xyz`;
            }
            rows.push({
                grupoId: group.id,
                grado: group.display,
                dia: todayDia,
                hora_inicio: slot.from,
                hora_fin: slot.to,
                materia: subject,
                profesor: teacher,
                link: link
            });
        });
    });
    return rows;
})();
