// src/services/azure/AzureADServices.jsx

// Enviar email al correoDestino desde notificaciones@gimnasiomariecurie.edu.co
export const sendEmail = async (asunto, mensaje, correoDestino) => {
  try {
    console.log("📧 Enviando email a:", correoDestino, "con asunto:", asunto);
    
    const respuesta = await fetch('https://bnjrzvzanjgqnaxjqofc.supabase.co/functions/v1/azure-ad', {
    //const respuesta = await fetch('https://bnjrzvzanjgqnaxjqofc.supabase.co/functions/v1/azure-ad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({
        tipo: 'correo',
        asunto: asunto,
        mensaje: mensaje,
        correoDestino: correoDestino,
      })
    });

    const data = await respuesta.json();
    
    if (!respuesta.ok) {
      console.error('❌ Error en respuesta del servidor:', data);
      throw new Error(data.error || 'Error enviando correo');
    }
    
    console.log('✅ Email enviado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('💥 Error enviando email:', error);
    throw error;
  }
};

// Generar link reunión (Enviar link a Profesional y Aspirante)
export const generarLinkReunion = async (asunto, startDateTime, endDateTime, correoDestino, correoProfesional) => {
  try {
    console.log("🎥 Generando link de reunión:", {
      asunto,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      correoDestino,
      correoProfesional
    });

    const respuesta = await fetch('https://bnjrzvzanjgqnaxjqofc.supabase.co/functions/v1/azure-ad', {
    //const respuesta = await fetch('https://bnjrzvzanjgqnaxjqofc.supabase.co/functions/v1/azure-ad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({
        tipo: 'reunion',
        asunto,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        correoDestino,
        correoProfesional,
      }),
    });
    
    console.log("🔗 Respuesta del servidor:", respuesta.status, respuesta.statusText);
    
    const data = await respuesta.json();
    
    if (!respuesta.ok) {
      console.error('❌ Error generando reunión:', data);
      throw new Error(data.error || 'Error generando link de reunión');
    }
    
    console.log("✅ Link de reunión generado:", data.link);
    return data.link;
  } catch (error) {
    console.error('💥 Error de red o ejecución generando link:', error);
    throw error;
  }
};