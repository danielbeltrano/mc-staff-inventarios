import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import fs from "fs";
import { Buffer } from "buffer";
import sharp from "sharp";

const supabaseUrl = "https://bnjrzvzanjgqnaxjqofc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuanJ6dnphbmpncW5heGpxb2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTU5NjMsImV4cCI6MjA0MjQzMTk2M30.pGJCRpuSC2d2GSCb-73Qor4Sd97rB7xSAcW8pz-Ek30";
const bucketName = "documentos_estudiantes";
const profilePhotoFolder = "foto_perfil";

const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Constantes para los tipos de fotos
const PHOTO_FOLDERS = {
  PERFIL: "foto_perfil",
  PADRE: "foto_del_padre",
  MADRE: "foto_de_la_madre",
  ACUDIENTE: "foto_del_acudiente",
};

const PHOTO_FILES = {
  PERFIL: (codigo) => `perfil_${codigo}`,
  PADRE: "fotodelpadre",
  MADRE: "fotodelamadre",
  ACUDIENTE: "fotodelacudiente",
};

async function compressImage(buffer) {
  try {
    const compressedImageBuffer = await sharp(buffer)
      .jpeg({
        quality: 80, // Calidad de 0-100
        mozjpeg: true, // Usar compresión mozjpeg para mejor resultado
      })
      .resize({
        width: 800, // Ancho máximo
        height: 800, // Alto máximo
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    return compressedImageBuffer;
  } catch (error) {
    console.error("Error compressing image:", error);
    return buffer; // Retornar el buffer original si hay error
  }
}

// Modificación de fetchStudents
async function fetchStudents() {
  const { data: students, error } = await supabase
    .from("estudiantes")
    .select("codigo_estudiante, foto_descargada_carnet")
    .not("codigo_estudiante", "is", null)
    .or("foto_descargada_carnet.is.null,foto_descargada_carnet.eq.false");

  if (error) {
    console.error("Error fetching students:", error);
    return null;
  }

  const studentSet = new Set(students.map((s) => String(s.codigo_estudiante)));

  console.log("Total estudiantes pendientes:", studentSet.size);
  console.log(
    "Ejemplo de códigos de estudiantes:",
    Array.from(studentSet).slice(0, 5)
  );

  return studentSet;
}

async function updatePhotoStatus(codigoEstudiante) {
  const { error } = await supabase
    .from("estudiantes")
    .update({ foto_descargada_carnet: true })
    .eq("codigo_estudiante", codigoEstudiante);

  if (error) {
    console.error(
      `Error updating photo status for student ${codigoEstudiante}:`,
      error
    );
  }
}

// Función de verificación previa
async function verifyAllPhotosExist(studentCode) {
  const photosStatus = {
    complete: false,
    existingPhotos: [],
    missingPhotos: []
  };

  for (const [type, folderName] of Object.entries(PHOTO_FOLDERS)) {
    const photoPath = `${studentCode}/${folderName}`;
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(photoPath);

      if (!error && data && data.length > 0) {
        photosStatus.existingPhotos.push(type);
      } else {
        photosStatus.missingPhotos.push(type);
      }
    } catch (error) {
      console.error(`Error verificando ${type} para estudiante ${studentCode}:`, error);
      photosStatus.missingPhotos.push(type);
    }
  }

  photosStatus.complete = photosStatus.missingPhotos.length === 0;
  return photosStatus;
}

async function processAndZipPhotos(folders, studentSet, zipFileName) {
  console.log(`\nProcesando ${zipFileName}`);
  console.log(`Total de folders disponibles: ${folders.length}`);
  console.log(`Total de estudiantes en el set: ${studentSet.size}`);

  const filteredFolders = [];
  const incompleteStudents = new Set();

  for (const folder of folders) {
    const studentCode = folder.name;
    if (studentSet.has(String(studentCode))) {
      console.log(`\nVerificando fotos para estudiante ${studentCode}`);
      
      const photoStatus = await verifyAllPhotosExist(studentCode);
      
      if (photoStatus.complete) {
        console.log(`✓ Estudiante ${studentCode} tiene todas las fotos requeridas`);
        console.log(`  Fotos encontradas: ${photoStatus.existingPhotos.join(', ')}`);
        filteredFolders.push(folder);
      } else {
        console.log(`❌ Estudiante ${studentCode} tiene fotos faltantes`);
        console.log(`  Fotos encontradas: ${photoStatus.existingPhotos.join(', ')}`);
        console.log(`  Fotos faltantes: ${photoStatus.missingPhotos.join(', ')}`);
        incompleteStudents.add(studentCode);
      }
    }
  }

  console.log(`\nResumen de verificación:`);
  console.log(`- Estudiantes con fotos completas: ${filteredFolders.length}`);
  console.log(`- Estudiantes con fotos incompletas: ${incompleteStudents.size}`);
  console.log(`- Total estudiantes verificados: ${filteredFolders.length + incompleteStudents.size}`);

  if (filteredFolders.length === 0) {
    console.log('No hay estudiantes con todas las fotos requeridas');
    return false;
  }

  // Inicializar ZIP y procesar resultados
  const zip = new JSZip();
  const results = await processInBatches(filteredFolders, 5);

  let filesAdded = 0;
  if (results && results.length > 0) {
    results.forEach((result) => {
      if (result && result.path && result.data) {
        zip.file(result.path, result.data);
        filesAdded++;
        console.log(`Added to zip: ${result.path}`);
      }
    });

    if (filesAdded > 0) {
      console.log(`\nGenerando ${zipFileName}...`);
      console.log(`Agregando ${filesAdded} archivos al ZIP`);
      try {
        const content = await zip.generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
          compressionOptions: { level: 9 },
        });
        fs.writeFileSync(zipFileName, content);

        const stats = fs.statSync(zipFileName);
        console.log(`\nZIP creado exitosamente:`);
        console.log(`- Nombre: ${zipFileName}`);
        console.log(`- Tamaño: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`- Archivos incluidos: ${filesAdded}`);
        console.log(`- Ruta: ${process.cwd()}/${zipFileName}`);

        return true;
      } catch (error) {
        console.error(`Error generando el archivo ZIP ${zipFileName}:`, error);
        return false;
      }
    }
  }

  console.log(`No se encontraron fotos para procesar`);
  return false;
}


async function processInBatches(items, batchSize) {
  const results = [];
  const processedCodes = new Set();
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  console.log(`\nIniciando procesamiento de ${items.length} estudiantes`);
  console.log(`Tamaño de lote: ${batchSize}`);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(items.length / batchSize);
    
    console.log(`\n>>> Procesando lote ${currentBatch}/${totalBatches}`);
    
    for (const folder of batch) {
      const studentCode = folder.name;
      console.log(`\nProcesando estudiante ${studentCode} (${totalProcessed + 1}/${items.length})`);

      try {
        if (processedCodes.has(studentCode)) {
          console.log(`Estudiante ${studentCode} ya procesado, omitiendo...`);
          continue;
        }

        let allPhotosProcessed = true;
        let studentPhotos = [];

        // Procesar cada tipo de foto
        for (const [type, folderName] of Object.entries(PHOTO_FOLDERS)) {
          const photoPath = `${studentCode}/${folderName}`;
          
          try {
            console.log(`Procesando foto ${type}`);
            const { data: photoFolder } = await supabase.storage
              .from(bucketName)
              .list(photoPath);

            if (!photoFolder?.length) {
              console.log(`No se encontró foto ${type}`);
              allPhotosProcessed = false;
              continue;
            }

            const { data: photoData, error: photoError } = await supabase.storage
              .from(bucketName)
              .download(`${photoPath}/${photoFolder[0].name}`);

            if (photoError || !photoData) {
              console.error(`Error descargando foto ${type}`);
              allPhotosProcessed = false;
              continue;
            }

            const buffer = Buffer.from(await photoData.arrayBuffer());
            let finalBuffer = buffer;

            if (buffer.length / (1024 * 1024) > 1) {
              console.log(`Comprimiendo foto ${type}`);
              finalBuffer = await compressImage(buffer);
            }

            studentPhotos.push({
              path: `${studentCode}/${type.toLowerCase()}/${photoFolder[0].name}`,
              data: finalBuffer
            });
            
            console.log(`Foto ${type} procesada exitosamente`);
          } catch (photoError) {
            console.error(`Error procesando foto ${type}:`, photoError);
            allPhotosProcessed = false;
          }
        }

        if (allPhotosProcessed) {
          results.push(...studentPhotos);
          await updatePhotoStatus(studentCode);
          processedCodes.add(studentCode);
          totalSuccess++;
          console.log(`Estudiante ${studentCode} procesado completamente`);
        } else {
          totalFailed++;
          console.log(`Estudiante ${studentCode} procesado parcialmente`);
        }

      } catch (error) {
        console.error(`Error general procesando ${studentCode}:`, error);
        totalFailed++;
      } finally {
        totalProcessed++;
      }
    }

    console.log(`\n=== Resumen del lote ${currentBatch}/${totalBatches} ===`);
    console.log(`Estudiantes procesados: ${totalProcessed}/${items.length}`);
    console.log(`Fotos procesadas: ${results.length}`);
    console.log(`Estudiantes exitosos: ${totalSuccess}`);
    console.log(`Estudiantes fallidos: ${totalFailed}`);
    console.log(`Progreso: ${((totalProcessed / items.length) * 100).toFixed(2)}%`);
    
    if (currentBatch < totalBatches) {
      console.log('Esperando antes del siguiente lote...');
      await delay(2000);
    }
  }

  return results;
}

const downloadPhotos = async () => {
  try {
    const studentSet = await fetchStudents();
    if (!studentSet) return;

    const { data: studentFolders, error: folderError } = await supabase.storage
      .from(bucketName)
      .list("", { limit: 2000 });

    if (folderError) {
      console.error("Error listing student folders:", error);
      return;
    }

    console.log(`Found ${studentFolders.length} total folders`);

    await processAndZipPhotos(studentFolders, studentSet, "student_photos.zip");
  } catch (error) {
    console.error("General error:", error);
  }
};

downloadPhotos().catch(console.error);
