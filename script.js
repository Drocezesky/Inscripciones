
const urlGoogleScript = 'https://script.google.com/macros/s/AKfycbwCa2PbZrU_ohGv4jENNMJhOiykgJwyE7gXORslYM_WycfRZ4MxBx8Q80zJadQxIeQy/exec';

const formulario = document.getElementById('formularioInscripcion');
const botonEnviar = document.getElementById('botonEnviar');
const divMensaje = document.getElementById('mensaje');

formulario.addEventListener('submit', function (e) {
    e.preventDefault();


    const checkboxesMarcados = document.querySelectorAll('input[name="mesas"]:checked');

    
    if (checkboxesMarcados.length === 0) {
        divMensaje.textContent = 'Pero seleccioná una materia por lo menos >:(';
        divMensaje.className = 'error';
        return;
    }

    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Bancame...';
    divMensaje.textContent = '';
    divMensaje.className = '';

    const materiasElegidas = Array.from(checkboxesMarcados).map(cb => cb.value);

    const datosFormulario = new FormData(formulario);
    datosFormulario.delete('mesas'); 
    datosFormulario.append('mesas', JSON.stringify(materiasElegidas)); 
    
    fetch(urlGoogleScript, {
        method: 'POST',
        body: datosFormulario
    })
        .then(respuesta => {
            divMensaje.textContent = '¡Listo! :D';
            divMensaje.className = 'exito';
            formulario.reset(); 
            cargarInscriptos(); 
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


function cargarInscriptos() {
    const divInscriptos = document.getElementById('listaInscriptos');
    divInscriptos.innerHTML = '<p>Cargando lista actualizada...</p>';

    fetch(urlGoogleScript)
        .then(respuesta => respuesta.json())
        .then(datos => {
          
            const agrupados1er = {};
            const agrupados2do = {};

            datos.forEach(registro => {
                if (registro.materia.includes('-')) {
                    const parteFecha = registro.materia.split('-')[1].trim();
                    const dia = parseInt(parteFecha.split('/')[0]);

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

            function armarBloque(agrupados, titulo) {
                if (Object.keys(agrupados).length === 0) return ''; 

                let html = `<h4 class="titulo-llamado">${titulo}</h4>`;
                html += `<div class="grilla-materias">`; 

                for (const materia in agrupados) {
                    html += `<div class="materia-grupo">
                            <h5>${materia}</h5>
                            <ul>`;
                    agrupados[materia].forEach(nombre => {
                        html += `<li>${nombre}</li>`;
                    });
                    html += `</ul></div>`;
                }
                html += `</div>`; 
                return html;
            }

         
            const html1er = armarBloque(agrupados1er, '1er Llamado (del 2/3 al 11/3)');
            const html2do = armarBloque(agrupados2do, '2do Llamado (del 12/3 al 25/3)');

            divInscriptos.innerHTML = html1er + html2do;
        })
        .catch(error => {
            divInscriptos.innerHTML = '<p class="error">Error al cargar la lista.</p>';
            console.error('Error:', error);
        });
}

cargarInscriptos();
