import React, { useState, useEffect } from "react";
import { Edit3, Save, UploadCloud, X } from "lucide-react"; // Iconos necesarios
import TextField from "./TextField.jsx";
import NumberField from "./NumberField.jsx";
import { toARS, uid } from "../utils/utils.js";
import { productsApi } from "../services/products.supabase.js";
import { supabase } from "../lib/supabase.js"; // Importar cliente Supabase

// --- CONFIGURACIÓN ---
const BUCKET_NAME = 'product-images'; // Reemplaza con el nombre exacto de tu bucket

export default function Panel({ products, setProducts }) {
  const [editing, setEditing] = useState(null); // id del producto en edición o null
  const [form, setForm] = useState({ name: "", brand: "", category: "", price: 0, stock: 0 }); // Datos del formulario
  const [busy, setBusy] = useState(false); // Estado general de ocupado (guardando/borrando)

  // --- Estado para la imagen ---
  const [imageFile, setImageFile] = useState(null); // Archivo seleccionado (File object)
  const [imageUrl, setImageUrl] = useState(""); // URL para previsualización
  const [uploading, setUploading] = useState(false); // Estado de subida de imagen
  const [uploadError, setUploadError] = useState(null); // Mensaje de error de subida

  // Resetea todo el estado del formulario y la imagen
  function resetFormAndState() {
    setEditing(null);
    setForm({ name: "", brand: "", category: "", price: 0, stock: 0 });
    setImageFile(null);
    setImageUrl("");
    setUploading(false);
    setUploadError(null);
  }

  // Prepara el formulario para editar un producto existente
  function startEdit(p) {
    setEditing(p.id);
    setForm({ name: p.name, brand: p.brand, category: p.category, price: p.price, stock: p.stock });
    setImageUrl(p.img || ""); // Muestra la imagen actual del producto
    setImageFile(null); // Limpia selección de archivo previo
    setUploadError(null); // Limpia errores previos
  }

  // Cancela la edición y resetea el formulario
  function cancelEdit() {
    resetFormAndState();
  }

  // Maneja la selección de un archivo de imagen
  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Crea una URL local para previsualizar la imagen seleccionada
      setImageUrl(URL.createObjectURL(file));
      setUploadError(null);
    } else {
      // Si el usuario cancela la selección, revierte
      setImageFile(null);
      const originalProduct = products.find(p => p.id === editing);
      setImageUrl(originalProduct?.img || "");
    }
     // Limpia el valor del input para permitir seleccionar el mismo archivo de nuevo
     if (event.target) {
        event.target.value = null;
     }
  }

  // Guarda el producto (nuevo o editado), incluyendo la subida de imagen
  async function saveProduct() {
    // Validaciones básicas
    if (!form.name || !form.category || !form.brand) return alert("Completá nombre, marca y categoría");
    if (form.price <= 0) return alert("Precio inválido");
    if (form.stock < 0) return alert("Stock inválido");

    setBusy(true); // Bloquea botones
    setUploadError(null);

    // URL final de la imagen a guardar en la base de datos
    let finalImageUrl = "";
    // Si estamos editando, mantenemos la URL existente por defecto
    if (editing) {
       const existingProduct = products.find(p => p.id === editing);
       finalImageUrl = existingProduct?.img || "";
    }

    // --- Subida de Imagen (si se seleccionó un archivo nuevo) ---
    if (imageFile) {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      if (!fileExt) {
          alert("Nombre de archivo inválido.");
          setUploading(false);
          setBusy(false);
          return;
      }
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      // Subir directamente a la raíz del bucket (quitamos 'public/')
      const filePath = uniqueFileName;

      console.log("Intentando subir:", { bucket: BUCKET_NAME, path: filePath, file: imageFile });

      try {
        // Sube el archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, imageFile, {
             cacheControl: '3600', // caché por 1 hora
             upsert: false // No sobrescribir si existe (poco probable)
          });

        if (uploadError) {
          // Si el error es por RLS, se mostrará aquí
          throw uploadError;
        }

        // Obtener la URL pública del archivo recién subido
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
           throw new Error("No se pudo obtener la URL pública de la imagen.");
        }

        finalImageUrl = urlData.publicUrl; // Actualizamos la URL a guardar
        console.log("Imagen subida con éxito:", finalImageUrl);

      } catch (error) {
        console.error("Error al subir la imagen:", error);
        setUploadError(error.message || "Error desconocido al subir imagen.");
        setUploading(false);
        setBusy(false);
        // Muestra el error específico de Supabase si está disponible
        alert("Error al subir la imagen: " + (error.message || "Intenta de nuevo"));
        return; // Detiene el proceso si la subida falla
      } finally {
        setUploading(false); // Termina el estado de subida
      }
    }
    // --- Fin Subida de Imagen ---

    // --- Guardado en Base de Datos ---
    try {
      const payload = {
        id: editing || uid("prd"), // ID existente o nuevo
        ...form, // Datos del formulario
        img: finalImageUrl, // URL de la imagen (nueva o existente/vacía)
      };

      // Llama a la API para guardar/actualizar en la tabla 'products'
      await productsApi.save(payload);

      // Refresca la lista de productos
      const freshProducts = await productsApi.all();
      setProducts(freshProducts);

      resetFormAndState(); // Limpia el formulario tras éxito

    } catch (e) {
      console.error("Error al guardar el producto en DB:", e);
      alert("No pude guardar el producto en la base: " + e.message);
      // Consideración: Si la imagen subió pero esto falló, la imagen queda "huérfana".
      // Se podría intentar borrarla aquí en caso de error.
    } finally {
      setBusy(false); // Libera los botones
    }
  }

  // Elimina un producto (e intenta borrar su imagen)
  async function deleteProduct(id) {
    if (!confirm("¿Eliminar producto permanentemente?")) return;
    setBusy(true);
    try {
      const productToDelete = products.find(p => p.id === id);

      // Intenta borrar la imagen de Storage si existe
      if (productToDelete?.img) {
         try {
            // Extrae la ruta del archivo desde la URL pública
            const url = new URL(productToDelete.img);
            // La ruta empieza después del nombre del bucket
            const filePath = url.pathname.split(`/${BUCKET_NAME}/`)[1];
            if (filePath) {
               console.log(`Intentando borrar imagen de Storage: ${filePath}`);
               await supabase.storage.from(BUCKET_NAME).remove([filePath]);
            }
         } catch (imgError) {
            console.warn("No se pudo borrar la imagen asociada del Storage (quizás ya no existía o hubo un error), pero se continuará borrando el producto:", imgError);
         }
      }

      // Borra el registro del producto de la base de datos
      await productsApi.remove(id);

      // Refresca la lista de productos
      const freshProducts = await productsApi.all();
      setProducts(freshProducts);

      // Si el producto borrado era el que se estaba editando, limpia el formulario
      if (editing === id) {
          cancelEdit();
      }
    } catch (e) {
      console.error("Error al eliminar el producto:", e);
      alert("No pude eliminar el producto de la base: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* --- Tabla de Productos --- */}
      <div className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold">Productos</h3>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-sm min-w-[600px]"> {/* Min width para evitar compresión excesiva */}
            <thead className="bg-neutral-50 text-neutral-600">
               <tr>
                <th className="p-2 text-left font-medium">Nombre</th>
                <th className="p-2 text-left font-medium">Marca</th>
                <th className="p-2 text-left font-medium">Categoría</th>
                <th className="p-2 text-right font-medium">Precio</th>
                <th className="p-2 text-right font-medium">Stock</th>
                <th className="p-2 text-right font-medium">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100"> {/* Divide sutil entre filas */}
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.brand}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2 text-right">{toARS(p.price)}</td>
                  <td className="p-2 text-right">{p.stock}</td>
                  <td className="p-2 text-right whitespace-nowrap"> {/* Evita que los botones se rompan en líneas */}
                    <button onClick={() => startEdit(p)} className="rounded-lg border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50" disabled={busy}>
                      <Edit3 className="mr-1 inline h-3 w-3" /> Editar
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="ml-2 rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={busy}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td className="p-4 text-center text-neutral-500" colSpan={6}>No hay productos cargados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Formulario de Producto --- */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">{editing ? "Editar producto" : "Nuevo producto"}</h3>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4"> {/* Cambiado a form y space-y-4 */}
          <TextField label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Marca" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <TextField label="Categoría" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Precio" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <NumberField label="Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
          </div>

          {/* --- Campo para subir imagen --- */}
          <div>
            <label className="block text-sm">
              <div className="mb-1 text-neutral-600">Imagen del Producto</div>
              {/* Previsualización */}
              {imageUrl && (
                 <div className="mb-2 relative aspect-video w-full rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50">
                    <img src={imageUrl} alt="Previsualización" className="h-full w-full object-contain" /> {/* object-contain para verla completa */}
                    {/* Botón para quitar imagen seleccionada */}
                    {(imageFile || (editing && imageUrl)) && ( // Muestra si hay archivo nuevo O si está editando y hay URL
                        <button
                           type="button"
                           onClick={() => {
                              setImageFile(null); // Quita el archivo seleccionado
                              setImageUrl("");    // Quita la preview/URL existente
                              // Limpiar input file (requiere ref o truco)
                              const fileInput = document.getElementById('product-image-input');
                              if (fileInput) fileInput.value = null;
                           }}
                           className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                           title="Quitar imagen"
                           disabled={busy || uploading}
                        >
                           <X size={14} strokeWidth={3}/>
                        </button>
                    )}
                 </div>
              )}
              {/* Input File */}
              <div className="flex items-center gap-2">
                 <label className={`flex-1 cursor-pointer rounded-xl border border-neutral-300 px-3 py-2 text-center text-sm text-neutral-700 hover:bg-neutral-50 transition-opacity ${busy || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <UploadCloud className="mr-1 inline h-4 w-4" />
                    {imageUrl ? "Cambiar Imagen" : "Seleccionar Imagen"}
                    <input
                       id="product-image-input" // Añadido ID para poder resetearlo
                       type="file"
                       accept="image/png, image/jpeg, image/webp, image/gif"
                       className="sr-only"
                       onChange={handleFileChange}
                       disabled={busy || uploading}
                    />
                 </label>
                 {/* Indicador de subida */}
                 {uploading && <span className="text-xs text-neutral-500 animate-pulse">Subiendo...</span>}
              </div>
              {/* Mensaje de error de subida */}
              {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            </label>
          </div>
          {/* --- FIN Campo Imagen --- */}

          {/* Botones Guardar/Cancelar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100"> {/* Ajuste padding/border */}
            {editing && (
              <button type="button" onClick={cancelEdit} className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50" disabled={busy || uploading}>
                Cancelar
              </button>
            )}
            {/* Cambiado a type="button" para evitar submit por defecto si se presiona Enter */}
            <button type="button" onClick={saveProduct} className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50" disabled={busy || uploading}>
              <Save className="mr-1 inline h-4 w-4" />
              {busy ? (uploading ? "Subiendo..." : "Guardando...") : "Guardar"}
            </button>
          </div>
        </form> {/* Cierre de la etiqueta form */}
      </div>
    </section>
  );
}