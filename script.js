// --- PEGA TU URL DE GOOGLE APPS SCRIPT AQUÍ ---
const urlGoogleScript = 'https://script.google.com/macros/s/AKfycbwCa2PbZrU_ohGv4jENNMJhOiykgJwyE7gXORslYM_WycfRZ4MxBx8Q80zJadQxIeQy/exec';

const formulario = document.getElementById('formularioInscripcion');
const botonEnviar = document.getElementById('botonEnviar');
const divMensaje = document.getElementById('mensaje');

formulario.addEventListener('submit', function (e) {
    e.preventDefault();

    // Buscamos todas las casillas que el alumno haya tildado (de cualquier llamado)
    const checkboxesMarcados = document.querySelectorAll('input[name="mesas"]:checked');

    // Validamos que haya elegido al menos una materia
    if (checkboxesMarcados.length === 0) {
        divMensaje.textContent = 'Pero seleccioná una materia por lo menos >:(';
        divMensaje.className = 'error';
        return;
    }

    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Bancame...';
    divMensaje.textContent = '';
    divMensaje.className = '';

    // Extraemos los valores y armamos una lista
    const materiasElegidas = Array.from(checkboxesMarcados).map(cb => cb.value);

    // Preparamos los datos
    const datosFormulario = new FormData(formulario);
    datosFormulario.delete('mesas'); // Borramos el envío por defecto
    datosFormulario.append('mesas', JSON.stringify(materiasElegidas)); // Enviamos nuestra lista empaquetada

    // Petición POST para guardar
    fetch(urlGoogleScript, {
        method: 'POST',
        body: datosFormulario
    })
        .then(respuesta => {
            divMensaje.textContent = '¡Listo! :D';
            divMensaje.className = 'exito';
            formulario.reset(); // Limpiamos el formulario
            cargarInscriptos(); // Actualizamos la lista de abajo
        })
        .catch(error => {
            divMensaje.textContent = 'Hubo un error de conexión.';
            divMensaje.className = 'error';
            console.error('Error:', error);
        })
        .finally(() => {
            botonEnviar.disabled = false;
            botonEnviar.textContent = 'Confirmar Inscripción';
        });
});

// Función para traer y mostrar los inscriptos separados por llamado
function cargarInscriptos() {
    const divInscriptos = document.getElementById('listaInscriptos');
    divInscriptos.innerHTML = '<p>Cargando lista actualizada...</p>';

    fetch(urlGoogleScript)
        .then(respuesta => respuesta.json())
        .then(datos => {
            // Creamos dos "cajas" invisibles para agrupar a los alumnos
            const agrupados1er = {};
            const agrupados2do = {};

            datos.forEach(registro => {
                // Seguridad: verificamos que el texto tenga un guión antes de cortarlo
                if (registro.materia.includes('-')) {
                    // Extraemos solo el número del día (Ej: de "Hardware - 2/3/2026" saca el "2")
                    const parteFecha = registro.materia.split('-')[1].trim();
                    const dia = parseInt(parteFecha.split('/')[0]);

                    // Si el día es 11 o menor, va al 1er llamado. Si es 12 o mayor, al 2do.
                    if (dia <= 11) {
                        if (!agrupados1er[registro.materia]) agrupados1er[registro.materia] = [];
                        agrupados1er[registro.materia].push(registro.nombre);
                    } else {
                        if (!agrupados2do[registro.materia]) agrupados2do[registro.materia] = [];
                        agrupados2do[registro.materia].push(registro.nombre);
                    }
                }
            });

            divInscriptos.innerHTML = '';

            if (Object.keys(agrupados1er).length === 0 && Object.keys(agrupados2do).length === 0) {
                divInscriptos.innerHTML = '<p>Aún no hay inscriptos en las mesas.</p>';
                return;
            }

            // Función interna para dibujar el HTML de cada bloque con su grilla
            function armarBloque(agrupados, titulo) {
                if (Object.keys(agrupados).length === 0) return ''; // Si está vacío, no dibuja nada

                let html = `<h4 class="titulo-llamado">${titulo}</h4>`;
                html += `<div class="grilla-materias">`; // Inicia la grilla de columnas

                for (const materia in agrupados) {
                    html += `<div class="materia-grupo">
                            <h5>${materia}</h5>
                            <ul>`;
                    agrupados[materia].forEach(nombre => {
                        html += `<li>${nombre}</li>`;
                    });
                    html += `</ul></div>`;
                }
                html += `</div>`; // Cierra la grilla
                return html;
            }

            // Armamos y pegamos los dos bloques en la pantalla
            const html1er = armarBloque(agrupados1er, '1er Llamado (del 2/3 al 11/3)');
            const html2do = armarBloque(agrupados2do, '2do Llamado (del 12/3 al 25/3)');

            divInscriptos.innerHTML = html1er + html2do;
        })
        .catch(error => {
            divInscriptos.innerHTML = '<p class="error">Error al cargar la lista.</p>';
            console.error('Error:', error);
        });
}
// Llamamos a la función apenas carga la página
cargarInscriptos();