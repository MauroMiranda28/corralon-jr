import React, { useState } from "react";
// --- NUEVO: Importar UploadCloud y X ---
import { Edit3, Save, Eye, EyeOff, UploadCloud, X } from "lucide-react";
import TextField from "./TextField.jsx";
import NumberField from "./NumberField.jsx";
import { toARS, uid } from "../utils/utils.js";
import { productsApi } from "../services/products.supabase.js";
// --- NUEVO: Importar supabase para Storage ---
import { supabase } from "../lib/supabase.js";

export default function Panel({ products, setProducts }) {
  const [editing, setEditing] = useState(null);
  // --- NUEVO: Estado para el archivo de imagen ---
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // Para mostrar la imagen seleccionada

  // Añadir 'img' al estado inicial del formulario
  const [form, setForm] = useState({ name: "", brand: "", category: "", price: 0, stock: 0, descripcion: "", is_active: true, img: "" });
  const [busy, setBusy] = useState(false);

  // --- NUEVA FUNCIÓN: Manejar selección de archivo ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Crear previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // --- MODIFICADO: Limpiar también imagen ---
  function resetFormAndState() {
    setEditing(null);
    setForm({ name: "", brand: "", category: "", price: 0, stock: 0, descripcion: "", is_active: true, img: "" });
    setImageFile(null); // Limpiar archivo
    setImagePreview(null); // Limpiar previsualización
  }

  // --- MODIFICADO: Cargar también img y previsualización ---
  function startEdit(p) {
    setEditing(p.id);
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      stock: p.stock,
      descripcion: p.descripcion || "",
      is_active: p.is_active === undefined ? true : p.is_active,
      img: p.img || "" // Cargar URL de imagen existente
    });
    setImageFile(null); // Limpiar archivo al empezar a editar
    setImagePreview(p.img || null); // Mostrar imagen actual como previsualización
  }

  function cancelEdit() {
    resetFormAndState();
  }

  // --- MODIFICADO: Lógica para subir imagen y guardar URL ---
  async function saveProduct() {
    // Validaciones (sin cambios)
    if (!form.name || !form.category || !form.brand) return alert("Completá nombre, marca y categoría");
    if (form.price <= 0) return alert("Precio inválido");
    if (form.stock < 0) return alert("Stock inválido");

    setBusy(true);
    let imageUrl = form.img; // Usar la imagen existente por defecto

    try {
      // 1. Si hay un nuevo archivo de imagen seleccionado, subirlo
      if (imageFile) {
        // Crear un nombre de archivo único (ej: productoId_timestamp.ext)
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${editing || uid("img")}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Ruta dentro del bucket

        // Subir al bucket 'product-images'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, {
            // cacheControl: '3600', // Opcional: Control de caché
            upsert: true // Reemplaza si ya existe un archivo con el mismo nombre
          });

        if (uploadError) {
          throw uploadError;
        }

        // Obtener la URL pública de la imagen subida
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      } else if (!imagePreview && editing) {
          // Si se eliminó la previsualización (sin seleccionar archivo nuevo) y estábamos editando,
          // significa que el usuario quiere quitar la imagen.
          imageUrl = ""; // O null, según cómo lo maneje tu mapeador
          // Opcional: podrías aquí eliminar la imagen anterior de Supabase Storage
      }


      // 2. Preparar payload con la URL de la imagen (nueva o la existente)
      const payload = {
        id: editing || uid("prd"),
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: form.price,
        stock: form.stock,
        descripcion: form.descripcion,
        is_active: form.is_active,
        img: imageUrl // Guardar la URL pública obtenida o la existente
      };

      // 3. Guardar datos del producto en la base de datos
      await productsApi.save(payload);
      const fresh = await productsApi.all();
      setProducts(fresh);
      resetFormAndState();

    } catch (e) {
      console.error("Error al guardar el producto:", e);
      alert("No pude guardar el producto: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  // Elimina un producto (sin cambios necesarios aquí, pero podrías añadir borrado de imagen en Storage si quisieras)
  async function deleteProduct(id) {
    if (!confirm("¿Eliminar producto permanentemente?")) return;
    setBusy(true);
    try {
      // Opcional: Buscar la URL de la imagen del producto a eliminar
      // const productToDelete = products.find(p => p.id === id);
      // const imageUrlToDelete = productToDelete?.img;

      await productsApi.remove(id); // Elimina de la DB

      // Opcional: Si encontraste una URL, intentar borrarla de Storage
      // if (imageUrlToDelete) {
      //   const path = imageUrlToDelete.split('/').pop(); // Extraer el nombre del archivo de la URL
      //   await supabase.storage.from('product-images').remove([path]);
      // }

      const fresh = await productsApi.all();
      setProducts(fresh);
      if (editing === id) cancelEdit();
    } catch (e) {
      console.error("Error al eliminar el producto:", e);
      alert("No pude eliminar el producto: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Tabla de Productos (sin cambios visuales) */}
       <div className="lg:col-span-2">
         {/* ... (contenido de la tabla igual que antes) ... */}
         <h3 className="mb-3 text-lg font-semibold">Productos</h3>
         <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
           <table className="w-full text-sm min-w-[600px]">
             <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                 <th className="p-2 text-left font-medium">Nombre</th>
                 <th className="p-2 text-left font-medium">Marca</th>
                 <th className="p-2 text-left font-medium">Categoría</th>
                 <th className="p-2 text-right font-medium">Precio</th>
                 <th className="p-2 text-right font-medium">Stock</th>
                 <th className="p-2 text-center font-medium">Estado</th>
                 <th className="p-2 text-right font-medium">Acciones</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-neutral-100">
               {products.map((p) => (
                 <tr key={p.id}>
                   <td className="p-2 flex items-center gap-2"> {/* Mostrar imagen pequeña */}
                      {p.img ? <img src={p.img} alt={p.name} className="h-8 w-8 rounded object-cover border"/> : <div className="h-8 w-8 rounded bg-neutral-100 flex-shrink-0"></div>}
                      {p.name}
                   </td>
                   <td className="p-2">{p.brand}</td>
                   <td className="p-2">{p.category}</td>
                   <td className="p-2 text-right">{toARS(p.price)}</td>
                   <td className="p-2 text-right">{p.stock}</td>
                   <td className="p-2 text-center">
                     {p.is_active === false ? <span title="Inactivo"><EyeOff className="h-4 w-4 text-red-500 inline"/></span>
                      : <span title="Activo"><Eye className="h-4 w-4 text-emerald-500 inline"/></span>
                     }
                   </td>
                   <td className="p-2 text-right whitespace-nowrap">
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
                 <tr><td className="p-4 text-center text-neutral-500" colSpan={7}>No hay productos cargados.</td></tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

      {/* --- Formulario de Producto --- */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">{editing ? "Editar producto" : "Nuevo producto"}</h3>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <TextField label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Marca" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <TextField label="Categoría" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Precio" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <NumberField label="Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
          </div>
          <div>
            <label className="block text-sm">
                <div className="mb-1 text-neutral-600">Descripción</div>
                <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Detalles del producto..."
                    rows={3}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10 text-sm"
                />
            </label>
          </div>

          {/* --- NUEVO: Input de Imagen y Previsualización --- */}
          <div>
             <label className="block text-sm">
               <div className="mb-1 text-neutral-600">Imagen</div>
               <div className="flex items-center gap-3">
                 {/* Previsualización */}
                 <div className="relative h-16 w-16 flex-shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden grid place-content-center">
                   {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Previsualización" className="h-full w-full object-cover"/>
                        {/* Botón para quitar previsualización */}
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); setForm({...form, img: "" })}} // Limpia todo lo relacionado a imagen
                          className="absolute top-0 right-0 m-0.5 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-700"
                          title="Quitar imagen"
                        >
                          <X className="h-3 w-3"/>
                        </button>
                      </>
                   ) : (
                      <UploadCloud className="h-6 w-6 text-neutral-400"/>
                   )}
                 </div>
                 {/* Input de archivo */}
                 <input
                   type="file"
                   accept="image/png, image/jpeg, image/webp" // Aceptar formatos comunes
                   onChange={handleImageChange}
                   className="block w-full text-xs text-neutral-500 file:mr-2 file:rounded-full file:border-0 file:bg-neutral-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-neutral-700 hover:file:bg-neutral-200"
                 />
               </div>
             </label>
           </div>
          {/* --- FIN NUEVO --- */}

          <div className="flex items-center pt-2">
              <input id="is_active" type="checkbox" checked={form.is_active}
                     onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                     className="form-checkbox h-4 w-4 text-emerald-600 rounded border-neutral-300 focus:ring-offset-0 focus:ring-emerald-500 cursor-pointer"/>
              <label htmlFor="is_active" className="ml-2 block text-sm text-neutral-700 cursor-pointer select-none">Producto activo (visible en catálogo)</label>
          </div>
          {/* Botones Guardar/Cancelar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
            {editing && (
              <button type="button" onClick={cancelEdit} className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50" disabled={busy}>
                Cancelar
              </button>
            )}
            <button type="button" onClick={saveProduct} className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50" disabled={busy}>
              <Save className="mr-1 inline h-4 w-4" />
              {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}