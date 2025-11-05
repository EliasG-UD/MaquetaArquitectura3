// Integra PYME Fácil — Maqueta SPA (hash routing, sin backend)
(() => {
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
  const state = {
    route: location.hash.replace('#','') || '/dashboard',
    filter: '',
    session: { logged: false, user: null }
  };

  // Simple router
  const routes = {
    '/': viewDashboard,
    '/dashboard': viewDashboard,
    '/clientes': viewClientes,
    '/proveedores': viewProveedores,
    '/productos': viewProductos,
    '/inventario': viewInventario,
    '/ventas': viewVentas,
    '/reportes': viewReportes,
    '/configuracion': viewConfiguracion,
    '/acerca': viewAcerca
  };

  window.addEventListener('hashchange', () => {
    state.route = location.hash.replace('#','') || '/dashboard';
    render();
  });

  // Keyboard shortcut for search
  window.addEventListener('keydown', (e)=>{
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      $('#global-search').focus();
    }
  });

  $('#fake-login').addEventListener('click', () => {
    state.session.logged = !state.session.logged;
    state.session.user = state.session.logged ? { name:'Usuario Demo', role:'Administrador' } : null;
    $('#fake-login').innerText = state.session.logged ? 'Cerrar sesión' : 'Simular login';
    render();
  });

  $('#global-search').addEventListener('input', (e)=>{
    state.filter = e.target.value.toLowerCase();
    render(); // re-render views that use filter
  });

  function renderNavbarActive() {
    $$('.nav a').forEach(a => {
      const href = a.getAttribute('href').slice(1);
      a.classList.toggle('active', href === state.route);
    });
  }

  function setTitleAndCrumbs(title) {
    $('#view-title').innerText = title;
    $('#breadcrumbs').innerText = 'Integra PYME Fácil / ' + title;
  }

  function render() {
    renderNavbarActive();
    const view = $('#view');
    const fn = routes[state.route] || viewNotFound;
    const { title, html } = fn();
    setTitleAndCrumbs(title);
    view.innerHTML = html;
    attachViewHandlers(state.route);
  }

  /* ---------- Vistas ---------- */

  function viewDashboard() {
    const totalClientes = MockDB.clientes.length;
    const totalVentas = MockDB.ventas.length;
    const totalIngresos = MockDB.ventas.reduce((s,v)=>s+v.total,0).toFixed(2);
    return {
      title: 'Dashboard',
      html: `
        <div class="grid">
          <div class="card kpi" style="grid-column: span 4">
            <h3>Clientes</h3>
            <div class="kpi"><span class="value">${totalClientes}</span><span class="badge">activos</span></div>
          </div>
          <div class="card kpi" style="grid-column: span 4">
            <h3>Ventas (últimos 7 días)</h3>
            <div class="kpi"><span class="value">${totalVentas}</span><span class="badge">comprobantes</span></div>
          </div>
          <div class="card kpi" style="grid-column: span 4">
            <h3>Ingresos estimados</h3>
            <div class="kpi"><span class="value">₡ ${totalIngresos}</span><span class="kpi trend up">+4.2%</span></div>
          </div>
          <div class="card" style="grid-column: span 12">
            <h3>Actividad reciente</h3>
            <table class="table">
              <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody>
                ${MockDB.ventas.map(v => `
                  <tr>
                    <td>#${v.id}</td>
                    <td>${getClienteNombre(v.clienteId)}</td>
                    <td>${v.fecha}</td>
                    <td>₡ ${v.total.toFixed(2)}</td>
                    <td><span class="badge">${v.estado}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`
    };
  }

  function viewClientes() {
    const data = MockDB.clientes.filter(c =>
      !state.filter || c.nombre.toLowerCase().includes(state.filter) || (c.cedula||'').includes(state.filter)
    );
    return {
      title: 'Clientes',
      html: `
        <div class="toolbar">
          <div><button class="btn" id="nuevo-cliente">Nuevo cliente</button></div>
          <div class="badge">${data.length} resultados</div>
        </div>
        <div class="card">
          <table class="table" id="tabla-clientes">
            <thead><tr><th>Nombre</th><th>Cédula</th><th>Correo</th><th>Teléfono</th><th></th></tr></thead>
            <tbody>
              ${data.map(c => `
                <tr data-id="${c.id}">
                  <td>${c.nombre}</td>
                  <td>${c.cedula||'-'}</td>
                  <td>${c.correo||'-'}</td>
                  <td>${c.telefono||'-'}</td>
                  <td class="row-actions">
                    <button class="btn secondary" data-act="edit">Editar</button>
                    <button class="btn warn" data-act="quote">Cotizar</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `
    };
  }

  function viewProveedores() {
    const data = MockDB.proveedores.filter(p =>
      !state.filter || p.nombre.toLowerCase().includes(state.filter)
    );
    return {
      title: 'Proveedores',
      html: `
        <div class="toolbar">
          <button class="btn" id="nuevo-proveedor">Nuevo proveedor</button>
          <div class="badge">${data.length} resultados</div>
        </div>
        <div class="card">
          <table class="table">
            <thead><tr><th>Nombre</th><th>Contacto</th><th>Correo</th><th>Teléfono</th><th></th></tr></thead>
            <tbody>
              ${data.map(p => `
               <tr data-id="${p.id}">
                 <td>${p.nombre}</td>
                 <td>${p.contacto||'-'}</td>
                 <td>${p.correo||'-'}</td>
                 <td>${p.telefono||'-'}</td>
                 <td class="row-actions">
                   <button class="btn secondary" data-act="edit">Editar</button>
                 </td>
               </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `
    };
  }

  function viewProductos() {
    const data = MockDB.productos.filter(p =>
      !state.filter || p.nombre.toLowerCase().includes(state.filter) || (p.sku||'').toLowerCase().includes(state.filter)
    );
    return {
      title: 'Productos',
      html: `
        <div class="toolbar">
          <button class="btn" id="nuevo-producto">Nuevo producto</button>
          <div class="badge">${data.length} resultados</div>
        </div>
        <div class="card">
          <table class="table">
            <thead><tr><th>SKU</th><th>Nombre</th><th>Precio</th><th>Unidad</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              ${data.map(p => `
                <tr data-id="${p.id}">
                  <td>${p.sku}</td>
                  <td>${p.nombre}</td>
                  <td>₡ ${p.precio.toFixed(2)}</td>
                  <td>${p.unidad}</td>
                  <td>${p.stock}</td>
                  <td class="row-actions">
                    <button class="btn secondary" data-act="add">Añadir a cotización</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `
    };
  }

  function viewInventario() {
    const low = MockDB.productos.filter(p => p.stock < 50);
    return {
      title: 'Inventario',
      html: `
        <div class="grid">
          <div class="card" style="grid-column: span 12">
            <h3>Nivel de existencias</h3>
            <p>Productos con bajo inventario:</p>
            <ul>
              ${low.map(p => `<li>${p.nombre} — <b>${p.stock}</b> en stock</li>`).join('') || '<li>Todos con stock suficiente.</li>'}
            </ul>
          </div>
        </div>
      `
    };
  }

  function viewVentas() {
    const data = MockDB.ventas;
    return {
      title: 'Ventas & Facturas',
      html: `
        <div class="toolbar">
          <button class="btn" id="nueva-venta">Nueva venta</button>
          <div class="badge">${data.length} documentos</div>
        </div>
        <div class="card">
          <table class="table">
            <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              ${data.map(v => `
                <tr>
                  <td>#${v.id}</td>
                  <td>${getClienteNombre(v.clienteId)}</td>
                  <td>${v.fecha}</td>
                  <td>₡ ${v.total.toFixed(2)}</td>
                  <td><span class="badge">${v.estado}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `
    };
  }

  function viewReportes() {
    return {
      title: 'Reportes',
      html: `
        <div class="grid">
          <div class="card" style="grid-column: span 6">
            <h3>Ventas por cliente</h3>
            <p>Maqueta: gráfico no interactivo. (En versión real: barras/lineas).</p>
            <div class="placeholder-chart"></div>
          </div>
          <div class="card" style="grid-column: span 6">
            <h3>Productos más vendidos</h3>
            <ul>
              ${MockDB.productos.slice(0,3).map(p => `<li>${p.nombre}</li>`).join('')}
            </ul>
          </div>
        </div>
      `
    };
  }

  function viewConfiguracion() {
    return {
      title: 'Configuración',
      html: `
        <div class="card">
          <h3>Preferencias</h3>
          <form class="form" id="form-config">
            <div class="field">
              <label>Moneda</label>
              <select name="moneda">
                <option value="CRC">CRC (₡)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div class="field">
              <label>Nombre de la empresa</label>
              <input name="empresa" placeholder="Ej. Panadería Doña Rosa S.A." />
            </div>
            <div class="field">
              <label>Comprobantes (demo)</label>
              <label><input type="checkbox" name="folios" checked /> Usar folios consecutivos de prueba</label>
            </div>
            <div class="field">
              <button class="btn" type="submit">Guardar (sin persistencia)</button>
            </div>
          </form>
          <p class="note">Nota: esta es una maqueta. No hay almacenamiento ni conexión a bases de datos.</p>
        </div>
      `
    };
  }

  function viewAcerca() {
    return {
      title: 'Acerca de',
      html: `
        <div class="card">
          <h3>Integra PYME Fácil — Maqueta</h3>
          <p>Esta es una <b>maqueta estática</b> para presentación en GitHub Pages. No hay backend ni base de datos.</p>
          <ul>
            <li>Ruteo de una sola página (SPA) con hash.</li>
            <li>Listados, formularios y tablas con datos ficticios.</li>
            <li>Accesos directos: <code>Ctrl+/</code> para enfoque en búsqueda.</li>
          </ul>
        </div>
      `
    };
  }

  function viewNotFound() {
    return { title: 'No encontrado', html: `<div class="card"><h3>404</h3><p>Ruta no encontrada.</p></div>` };
  }

  /* ---------- Helpers y eventos por vista ---------- */

  function getClienteNombre(id){
    const c = MockDB.clientes.find(x => x.id === id);
    return c ? c.nombre : 'Desconocido';
  }

  function attachViewHandlers(route){
    if (route === '/clientes') {
      $('#nuevo-cliente')?.addEventListener('click', () => {
        const nombre = prompt('Nombre del cliente (demo):');
        if (!nombre) return;
        const id = Math.max(...MockDB.clientes.map(c=>c.id))+1;
        MockDB.clientes.push({ id, nombre, cedula:'', correo:'', telefono:'' });
        render();
      });
      $('#tabla-clientes')?.addEventListener('click', (e)=>{
        const btn = e.target.closest('button');
        if (!btn) return;
        const tr = e.target.closest('tr');
        const id = Number(tr.dataset.id);
        const act = btn.dataset.act;
        if (act === 'edit') {
          const c = MockDB.clientes.find(x=>x.id===id);
          const nuevo = prompt('Editar nombre (demo):', c.nombre);
          if (nuevo) { c.nombre = nuevo; render(); }
        } else if (act === 'quote') {
          alert('Abriría flujo de cotización (maqueta).');
        }
      });
    }

    if (route === '/proveedores') {
      $('#nuevo-proveedor')?.addEventListener('click', () => {
        const nombre = prompt('Nombre del proveedor (demo):');
        if (!nombre) return;
        const id = Math.max(...MockDB.proveedores.map(p=>p.id))+1;
        MockDB.proveedores.push({ id, nombre, contacto:'', correo:'', telefono:'' });
        render();
      });
    }

    if (route === '/productos') {
      $('#nuevo-producto')?.addEventListener('click', () => {
        const nombre = prompt('Nombre del producto (demo):');
        if (!nombre) return;
        const id = Math.max(...MockDB.productos.map(p=>p.id))+1;
        MockDB.productos.push({ id, sku: 'NEW'+id, nombre, precio:0, unidad:'unidad', stock:0 });
        render();
      });
    }

    if (route === '/configuracion') {
      $('#form-config')?.addEventListener('submit', (e)=>{
        e.preventDefault();
        alert('Cambios guardados (demo, sin persistencia).');
      });
    }
  }

  // Primera carga
  render();
})();
