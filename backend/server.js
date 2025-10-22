// backend/server.js
require('dotenv').config(); // Carga variables de .env para desarrollo local
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

const app = express();
const port = process.env.PORT || 3001; // Render usa la variable PORT

// --- Configuración MercadoPago ---
// ¡IMPORTANTE! Usa tus credenciales de PRUEBA primero.
// En Render, estas vendrán de las Variables de Entorno.
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// --- Middlewares ---
app.use(cors()); // Permite peticiones del frontend
app.use(express.json()); // Para entender el JSON que enviará el frontend

// --- Endpoint para crear preferencia ---
app.post('/crear-preferencia', async (req, res) => {
  const { items, orderId, shippingCost } = req.body; // Recibe items del carrito y el costo de envío

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No hay items en el pedido' });
  }

  // Prepara los items para MercadoPago
  const mpItems = items.map(item => ({
    id: item.productId, // ID de tu producto
    title: item.name, // Nombre de tu producto
    quantity: item.qty,
    unit_price: item.price,
    currency_id: 'ARS' // Moneda Argentina
  }));

   // Agrega el costo de envío como un item separado si es mayor a cero
   if (shippingCost > 0) {
       mpItems.push({
           id: 'shipping',
           title: 'Costo de Envío',
           quantity: 1,
           unit_price: shippingCost,
           currency_id: 'ARS'
       });
   }


  // Crea el objeto de preferencia
  const preference = {
    items: mpItems,
    back_urls: { // URLs a donde redirigir al usuario
      success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso`, // Cambia localhost por tu URL de Render Frontend
      failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-fallido`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-pendiente`
    },
    auto_return: 'approved', // Regresa automáticamente si el pago es aprobado
    external_reference: orderId, // Puedes usar el ID de tu pedido para relacionarlo
    notification_url: `${process.env.BACKEND_URL}/webhook-mercadopago` // URL donde MP notificará cambios (¡Importante para producción!)
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    console.log('Preferencia creada:', response.body.id);
    // Devuelve el ID de la preferencia al frontend
    res.json({ preferenceId: response.body.id });
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ error: 'Error al contactar MercadoPago' });
  }
});

// --- Endpoint para Webhook (opcional pero recomendado para producción) ---
app.post('/webhook-mercadopago', (req, res) => {
    console.log('Webhook recibido:', req.query, req.body);
    // Aquí deberías verificar el pago (req.query.type === 'payment')
    // y actualizar el estado de tu pedido en Supabase si es necesario.
    // ¡IMPORTANTE: Verifica la autenticidad de la notificación!
    res.sendStatus(200); // Responde a MercadoPago que recibiste la notificación
});


// --- Iniciar servidor ---
app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});