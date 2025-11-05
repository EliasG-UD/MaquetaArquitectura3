// Mock data (sin persistencia; se reinicia al recargar)
window.MockDB = {
  clientes: [
    { id: 1, nombre: "Panadería Doña Rosa", cedula: "3-101-456789", correo:"ventas@donarosa.cr", telefono:"2444-1122" },
    { id: 2, nombre: "Ferretería El Tornillo", cedula: "3-102-123456", correo:"contacto@tornillo.cr", telefono:"2455-3344" },
    { id: 3, nombre: "Papelería Tico", cedula: "3-103-654321", correo:"info@papetic.cr", telefono:"2255-9988" }
  ],
  proveedores: [
    { id: 11, nombre: "Distribuidora Central", contacto:"María", correo:"mc@dist.cr", telefono:"4000-1111" },
    { id: 12, nombre: "Alimentos Costa", contacto:"Luis", correo:"lsp@alicos.cr", telefono:"4000-2222" }
  ],
  productos: [
    { id: 101, sku:"PAN100", nombre:"Pan Baguette", precio: 900.00, unidad:"unidad", stock: 120 },
    { id: 102, sku:"HAR200", nombre:"Harina 1kg", precio: 1250.50, unidad:"kg", stock: 80 },
    { id: 103, sku:"LEV150", nombre:"Levadura 250g", precio: 850.00, unidad:"paq", stock: 45 }
  ],
  ventas: [
    { id: 5001, clienteId: 1, fecha: "2025-11-01", total: 3500.00, estado:"Pagada" },
    { id: 5002, clienteId: 2, fecha: "2025-11-02", total: 12750.75, estado:"Pendiente" }
  ]
};
