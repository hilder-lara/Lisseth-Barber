import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const imagesDir = './assets/images';

async function optimizeImages() {
  try {
    if (!fs.existsSync(imagesDir)) {
      console.error(`La carpeta ${imagesDir} no existe.`);
      return;
    }
    
    const files = fs.readdirSync(imagesDir);
    console.log(`Buscando imágenes en ${imagesDir}...`);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        // Ignorar si el archivo ya es un WebP o si es un archivo no de imagen
        const basename = path.basename(file, ext);
        const inputPath = path.join(imagesDir, file);
        const outputPath = path.join(imagesDir, `${basename}.webp`);

        console.log(`Optimizando: "${file}" -> "${basename}.webp"...`);
        await sharp(inputPath)
          .webp({ quality: 82 })
          .toFile(outputPath);
        
        const originalSize = fs.statSync(inputPath).size;
        const optimizedSize = fs.statSync(outputPath).size;
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        console.log(`  ¡Completado! Ahorro del ${reduction}% (${(originalSize / 1024 / 1024).toFixed(2)} MB -> ${(optimizedSize / 1024 / 1024).toFixed(2)} MB)`);
      }
    }
    console.log('--- Proceso de optimización finalizado ---');
  } catch (error) {
    console.error('Error durante la optimización:', error);
  }
}

optimizeImages();
