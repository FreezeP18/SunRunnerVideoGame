//obtener valores del canva de html
var canvas = document.getElementById('CanvasJuego');
//nos permite dibujar en 2d
var ctx = canvas.getContext('2d');

//obtener el puntaje
var scoreElement = document.getElementById('score');
var puntuacionMasAlta = 0;

//crear parametros para usar en el juego
var config = {
    velocidadNave: 5,
    tamanoNave: 30,
    probabilidadSolInicial: 0.02,
    incrementoVelocidadSol: 0.5,
    incrementoProbabilidadSol: 0.01,
    incrementoPuntaje: 5,
    frecuenciaIncrementoPuntaje: 20
};

//definir todo lo que se va a usar
//se crea el objeto nave
var nave = {x: canvas.width / 2, y: canvas.height / 2, width: config.tamanoNave, height: config.tamanoNave, speed: config.velocidadNave};
//arreglo para guardar los soles/obstaculos
var soles = [];
var estaPausado = false;
//objeto para guardar las teclas presionadas
var teclas = {};
var intervaloActualizacion, intervaloDibujado;
//variables adicionales
var puntaje = 0, contadorPuntaje = 0, velocidadSol = 2, probabilidadSol = config.probabilidadSolInicial;
var mostrarHitbox = false;

//imagenes a usar
var imgNave = new Image();
imgNave.src = "img/naveS.png";

//dibujar a la nave en el canvas
function dibujarNave() {
    ctx.drawImage(imgNave, nave.x, nave.y, config.tamanoNave, config.tamanoNave);
    if (mostrarHitbox) {
        ctx.strokeStyle = "red"; // Cambia a rojo para la hitbox
        ctx.strokeRect(nave.x, nave.y, config.tamanoNave, config.tamanoNave);
        ctx.strokeStyle = "black";
    }
}
//devtools
function alternarHitbox() {
    mostrarHitbox = !mostrarHitbox;
}


//dibujar obstaculos
function dibujarSol(sol) {
    //se inicializa el proceso de dibujo
    ctx.beginPath();
    //se definen parametros, como el color y forma
    ctx.arc(sol.x, sol.y, sol.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "orange";
    ctx.fill();
    ctx.strokeStyle = "yellow"; // Cambia este valor para cambiar el color de los soles
    //se dibuja
    ctx.stroke();
}

//creacion del sol
function crearSol() {
    //se determina la direccion que va a ocupar cada sol
    var direccion = Math.random() < 0.5 ? -1 : 1;
    var x = direccion === -1 ? canvas.width : 0;
    //tamaño del radio
    var radioSol = 30;
    //Incrementamos el tamaño de los soles segun avanza la puntuacion del juego
    if (puntaje > 200) {
        radioSol = 35;
    } else if (puntaje > 400) {
        radioSol = 45;
    } else if (puntaje > 600) {
        radioSol = 55;
    }
    //se crea el objeto sol
    var sol = {x: x, y: Math.random() * canvas.height, radius: radioSol, speed: velocidadSol, direction: direccion};
    return sol;
}

//deteccion de colision aka la hitbox
function colisionConSol(nave, sol) {
    //calcula la diferencia en la posición en el eje x entre el centro de la nave
    var dx = nave.x + config.tamanoNave / 2 - sol.x;
    //calcula la diferencia en la posición en el eje y entre el centro de la nave y el centro del sol.
    var dy = nave.y + config.tamanoNave / 2 - sol.y;
    //calcular la distancia entre el centro de la nave y el centro del sol por medio de pitagoras
    var distancia = Math.sqrt(dx * dx + dy * dy);
    //detectar colision
    if (distancia < sol.radius + config.tamanoNave / 2) {
        //si choca
        return true;
    }

    //si no choca
    return false;
}

//asegurarse que no se salga del borde
function colisionConBorde(nave) {
    return nave.y < 0 || nave.y > canvas.height - config.tamanoNave;
}

//funcion juego que actualiza los valores constantemente
function actualizarEstado() {
    //funcion pausa
    if (estaPausado)
        return;
    //movimiento vertical nave
    if (teclas.ArrowUp && nave.y - config.velocidadNave >= 0) {
        nave.y -= config.velocidadNave;
    }
    if (teclas.ArrowDown && nave.y + config.velocidadNave <= canvas.height - config.tamanoNave) {
        nave.y += config.velocidadNave;
    }
    //cada cuanto o probabilidad de generacion
    if (Math.random() < probabilidadSol) {
        soles.push(crearSol());
    }

    //aca se actualizan las posiciones de los soles segun su direccion
    for (var i = 0; i < soles.length; i++) {
        soles[i].x += soles[i].speed * soles[i].direction;

        // Si el sol se ha movido fuera de la pantalla, elimínalo
        if (soles[i].x < -soles[i].radius || soles[i].x > canvas.width + soles[i].radius) {
            soles.splice(i, 1);
            i--;  // Decrementa el índice para ajustarlo después de la eliminación
            continue;  // Salta al siguiente ciclo del bucle
        }

        // Comprobar colisión con sol
        if (colisionConSol(nave, soles[i])) {
            gameOver();
            return;
        }
    }

    // Comprobar colisión con borde
    if (colisionConBorde(nave)) {
        gameOver();
        return;
    }

    // Incrementar el puntaje y ajustar dificultad del juego
    contadorPuntaje++;
    if (contadorPuntaje >= config.frecuenciaIncrementoPuntaje) {
        puntaje += config.incrementoPuntaje;
        contadorPuntaje = 0;
        //cada 50 puntos aumenta la velocidad y la cantidad de soles
        if (puntaje % 50 === 0) {
            velocidadSol += config.incrementoVelocidadSol;
            probabilidadSol += config.incrementoProbabilidadSol;
        }
        //modificamos en tiempo real el puntaje
        scoreElement.textContent = "Puntuacion: " + puntaje;
    }
}
//cuando se pierde
function gameOver() {
    //detencion del juego
    clearInterval(intervaloActualizacion);
    clearInterval(intervaloDibujado);
    //se pausa
    estaPausado = true;
    //actualizacion del highsocre
    if (puntaje > puntuacionMasAlta) {
        puntuacionMasAlta = puntaje;
        document.getElementById('highScore').textContent = "Puntuacion mas alta: " + puntuacionMasAlta;
    }
    //alerta de perder
    alert('Perdiste');
}
//funcion encargada de actualizar la pantalla
function dibujarEstado() {
    //mueve los objetos en el juego a su nueva posicion constatemente
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //dibuja la posicion actual
    dibujarNave();
    //dibuja el sol en la posision en la que se encuentre en ese momento
    for (var i = 0; i < soles.length; i++) {
        dibujarSol(soles[i]);
    }
}

//funcion que inicia el juego
function iniciarJuego() {
    //cada cuanto se actualiza la pantalla en este caso 20ms
    intervaloActualizacion = setInterval(actualizarEstado, 20);
    //esta se encarga de borrar y dibujar su nuevo estado cada 20ms
    intervaloDibujado = setInterval(dibujarEstado, 20);
}
//reiniciar juego
function reiniciarJuego() {
    //limpia y devuelve todo al estado inicial, para asi volver a empezar desde cero
    clearInterval(intervaloActualizacion);
    clearInterval(intervaloDibujado);
    nave = {x: canvas.width / 2, y: canvas.height / 2, speed: config.velocidadNave}; // Resetea nave al centro
    soles = [];
    puntaje = 0;
    contadorPuntaje = 0;
    velocidadSol = 2;
    probabilidadSol = config.probabilidadSolInicial;
    scoreElement.textContent = "Puntuación: " + puntaje;
    estaPausado = false;
    document.getElementById('pauseButton').textContent = 'Pausar';
}
//añadir las funciones a los botones
document.getElementById('Iniciar').addEventListener('click', iniciarJuego);
document.getElementById('Reiniciar').addEventListener('click', reiniciarJuego);
document.getElementById('Pausa').addEventListener('click', function () {
    estaPausado = !estaPausado;
    this.textContent = estaPausado ? 'Reanudar' : 'Pausar';
});

document.getElementById('Hitbox').addEventListener('click', alternarHitbox);


document.addEventListener('keydown', function (event) {
    teclas[event.key] = true;
});

document.addEventListener('keyup', function (event) {
    teclas[event.key] = false;
});


