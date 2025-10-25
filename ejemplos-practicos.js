// EJEMPLOS PRÁCTICOS PARA EL WORKER DE PRINTFUL
// =================================================

// 1. FUNCIÓN PARA OBTENER PRODUCTOS POPULARES
async function obtenerProductosPopulares() {
  try {
    const response = await fetch('/api/products?category_id=24,25');
    const data = await response.json();
    
    if (response.ok) {
      return data.result.map(producto => ({
        id: producto.id,
        nombre: producto.title,
        tipo: producto.type,
        categoria: producto.main_category_id,
        variantes_disponibles: producto.variants?.length || 0
      }));
    } else {
      throw new Error(data.message || 'Error obteniendo productos');
    }
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// 2. FUNCIÓN PARA CREAR PEDIDO SIMPLE
async function crearPedidoSimple(cliente, producto, cantidad = 1) {
  const pedido = {
    external_id: `pedido_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recipient: {
      name: cliente.nombre,
      address1: cliente.direccion,
      city: cliente.ciudad,
      state_code: cliente.estado,
      country_code: cliente.pais,
      zip: cliente.codigoPostal,
      phone: cliente.telefono,
      email: cliente.email
    },
    items: [
      {
        variant_id: producto.variant_id,
        quantity: cantidad,
        retail_price: producto.precio.toString(),
        files: [
          {
            url: producto.urlDiseno,
            type: "default"
          }
        ]
      }
    ],
    shipping: "STANDARD"
  };

  try {
    const response = await fetch('/api/orders?confirm=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pedido)
    });

    const resultado = await response.json();
    
    if (response.ok) {
      return {
        exito: true,
        pedido_id: resultado.result.id,
        numero_pedido: resultado.result.number,
        total: resultado.result.costs?.total
      };
    } else {
      return {
        exito: false,
        error: resultado.message || 'Error creando pedido',
        detalles: resultado
      };
    }
  } catch (error) {
    return {
      exito: false,
      error: error.message
    };
  }
}

// 3. FUNCIÓN PARA CREAR PEDIDO CON MÚLTIPLES PRODUCTOS
async function crearPedidoMultiple(cliente, productos) {
  const pedido = {
    external_id: `pedido_multi_${Date.now()}`,
    recipient: {
      name: cliente.nombre,
      address1: cliente.direccion,
      city: cliente.ciudad,
      state_code: cliente.estado,
      country_code: cliente.pais,
      zip: cliente.codigoPostal,
      phone: cliente.telefono,
      email: cliente.email
    },
    items: productos.map(producto => ({
      variant_id: producto.variant_id,
      quantity: producto.cantidad,
      retail_price: producto.precio.toString(),
      files: producto.disenos.map(diseno => ({
        url: diseno.url,
        type: diseno.tipo || "default"
      })),
      options: producto.opciones || []
    })),
    shipping: "STANDARD",
    packing_slip: {
      email: cliente.emailTienda || 'tienda@tudominio.com',
      message: `Pedido #${Date.now()}`,
      store_name: "Mi Tienda Custom"
    }
  };

  try {
    const response = await fetch('/api/orders?confirm=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pedido)
    });

    const resultado = await response.json();
    
    return {
      exito: response.ok,
      respuesta: resultado
    };
  } catch (error) {
    return {
      exito: false,
      error: error.message
    };
  }
}

// 4. FUNCIÓN PARA SUBIR DISEÑOS AUTOMÁTICAMENTE
async function subirDiseno(urlDiseno, nombrePersonalizado = null) {
  const datosArchivo = {
    url: urlDiseno,
    type: "default",
    filename: nombrePersonalizado || `diseno_${Date.now()}.png`,
    visible: true
  };

  try {
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosArchivo)
    });

    const resultado = await response.json();
    
    if (response.ok) {
      return {
        exito: true,
        file_id: resultado.result.id,
        file_url: resultado.result.preview_url,
        hash: resultado.result.hash,
        nombre: resultado.result.filename
      };
    } else {
      return {
        exito: false,
        error: resultado.message || 'Error subiendo archivo'
      };
    }
  } catch (error) {
    return {
      exito: false,
      error: error.message
    };
  }
}

// 5. FUNCIÓN PARA OBTENER INFORMACIÓN DE PEDIDOS
async function obtenerPedidos(estado = null, limite = 10) {
  let url = `/api/orders?limit=${limite}`;
  if (estado) {
    url += `&status=${estado}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      return data.result.map(pedido => ({
        id: pedido.id,
        numero: pedido.number,
        estado: pedido.status,
        fecha: pedido.created,
        total: pedido.costs?.total,
        cliente: pedido.recipient?.name,
        items: pedido.items?.length || 0
      }));
    } else {
      throw new Error(data.message || 'Error obteniendo pedidos');
    }
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// 6. FUNCIÓN PARA CONFIGURAR WEBHOOKS
async function configurarWebhook(urlWebhook, tiposEventos) {
  const webhookData = {
    url: urlWebhook,
    types: tiposEventos // ["order_created", "order_fulfilled", "package_shipped"]
  };

  try {
    const response = await fetch('/api/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    const resultado = await response.json();
    
    return {
      exito: response.ok,
      respuesta: resultado
    };
  } catch (error) {
    return {
      exito: false,
      error: error.message
    };
  }
}

// 7. COMPONENTE REACT PARA CATÁLOGO DE PRODUCTOS
import React, { useState, useEffect } from 'react';

function CatalogoProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarProductos() {
      try {
        setCargando(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (response.ok) {
          setProductos(data.result || []);
          setError(null);
        } else {
          throw new Error(data.message || 'Error cargando productos');
        }
      } catch (err) {
        setError(err.message);
        setProductos([]);
      } finally {
        setCargando(false);
      }
    }

    cargarProductos();
  }, []);

  if (cargando) {
    return <div className="loading">Cargando productos...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="catalogo-productos">
      <h2>Catálogo de Productos</h2>
      <div className="productos-grid">
        {productos.map(producto => (
          <div key={producto.id} className="producto-card">
            <h3>{producto.title}</h3>
            <p className="producto-id">ID: {producto.id}</p>
            <p className="producto-tipo">Tipo: {producto.type}</p>
            <button 
              onClick={() => console.log('Seleccionar producto:', producto.id)}
              className="btn-seleccionar"
            >
              Seleccionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. COMPONENTE REACT PARA CREAR PEDIDO
import React, { useState } from 'react';

function CrearPedido() {
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: '',
    pais: 'ES',
    codigoPostal: '',
    variant_id: '',
    cantidad: 1,
    urlDiseno: '',
    precio: '25.99'
  });

  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setResultado(null);

    try {
      const cliente = {
        nombre: formulario.nombre,
        email: formulario.email,
        telefono: formulario.telefono,
        direccion: formulario.direccion,
        ciudad: formulario.ciudad,
        estado: formulario.estado,
        pais: formulario.pais,
        codigoPostal: formulario.codigoPostal
      };

      const producto = {
        variant_id: parseInt(formulario.variant_id),
        urlDiseno: formulario.urlDiseno,
        precio: parseFloat(formulario.precio)
      };

      const resultadoPedido = await crearPedidoSimple(cliente, producto, parseInt(formulario.cantidad));
      setResultado(resultadoPedido);

      if (resultadoPedido.exito) {
        // Resetear formulario en caso de éxito
        setFormulario({
          nombre: '',
          email: '',
          telefono: '',
          direccion: '',
          ciudad: '',
          estado: '',
          pais: 'ES',
          codigoPostal: '',
          variant_id: '',
          cantidad: 1,
          urlDiseno: '',
          precio: '25.99'
        });
      }

    } catch (error) {
      setResultado({
        exito: false,
        error: error.message
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="crear-pedido">
      <h2>Crear Nuevo Pedido</h2>
      
      <form onSubmit={handleSubmit} className="pedido-form">
        <div className="seccion-cliente">
          <h3>Información del Cliente</h3>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            value={formulario.nombre}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formulario.email}
            onChange={handleInputChange}
            required
          />
          <input
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            value={formulario.telefono}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={formulario.direccion}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="ciudad"
            placeholder="Ciudad"
            value={formulario.ciudad}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="estado"
            placeholder="Estado/Provincia"
            value={formulario.estado}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="pais"
            placeholder="Código País (ej: ES, US)"
            value={formulario.pais}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="codigoPostal"
            placeholder="Código Postal"
            value={formulario.codigoPostal}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="seccion-producto">
          <h3>Información del Producto</h3>
          <input
            type="number"
            name="variant_id"
            placeholder="ID de Variante"
            value={formulario.variant_id}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            name="cantidad"
            placeholder="Cantidad"
            value={formulario.cantidad}
            onChange={handleInputChange}
            min="1"
            required
          />
          <input
            type="url"
            name="urlDiseno"
            placeholder="URL del Diseño"
            value={formulario.urlDiseno}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            name="precio"
            placeholder="Precio"
            value={formulario.precio}
            onChange={handleInputChange}
            step="0.01"
            required
          />
        </div>

        <button type="submit" disabled={enviando} className="btn-enviar">
          {enviando ? 'Enviando...' : 'Crear Pedido'}
        </button>
      </form>

      {resultado && (
        <div className={`resultado ${resultado.exito ? 'exito' : 'error'}`}>
          {resultado.exito ? (
            <div>
              <h4>✅ Pedido creado exitosamente!</h4>
              <p>ID: {resultado.pedido_id}</p>
              <p>Número: {resultado.numero_pedido}</p>
              <p>Total: {resultado.total}</p>
            </div>
          ) : (
            <div>
              <h4>❌ Error creando pedido</h4>
              <p>{resultado.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 9. FUNCIÓN PARA OBTENER ESTADÍSTICAS DEL WORKER
async function verificarEstadoWorker() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    return {
      estado: response.ok ? 'online' : 'error',
      timestamp: new Date().toISOString(),
      detalles: data
    };
  } catch (error) {
    return {
      estado: 'offline',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// 10. EXPORTAR TODAS LAS FUNCIONES
export {
  obtenerProductosPopulares,
  crearPedidoSimple,
  crearPedidoMultiple,
  subirDiseno,
  obtenerPedidos,
  configurarWebhook,
  verificarEstadoWorker
};