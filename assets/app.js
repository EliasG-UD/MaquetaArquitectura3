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

  
  /* ---------- Data loader por actor (archivos JSON) ---------- */
  const Data = {
    actor: 'vengatuercas', // por defecto
    db: { meta:{displayName:'Los Vengatuercas'}, clientes:[], proveedores:[], productos:[], inventario:[], ventas:[] },
  };
  async function loadActors(){
    const res = await fetch('assets/data/actors.json'); return res.json();
  }
  async function loadActorData(actorId){
    Data.actor = actorId || 'vengatuercas';
    const base = `assets/data/${Data.actor}`;
    const [meta, clientes, proveedores, productos, inventario, ventas] = await Promise.all([
      fetch(`${base}/meta.json`).then(r=>r.json()),
      fetch(`${base}/clientes.json`).then(r=>r.json()),
      fetch(`${base}/proveedores.json`).then(r=>r.json()),
      fetch(`${base}/productos.json`).then(r=>r.json()),
      fetch(`${base}/inventario.json`).then(r=>r.json()),
      fetch(`${base}/ventas.json`).then(r=>r.json()),
    ]);
    Data.db = { meta, clientes, proveedores, productos, inventario, ventas };
  }
/* ---------- Vistas ---------- */

  function viewDashboard() {
    const totalClientes = Data.db.clientes.length;
    const totalVentas = Data.db.ventas.length;
    const totalIngresos = Data.db.ventas.reduce((s,v)=>s+v.total,0).toFixed(2);
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
                ${Data.db.ventas.map(v => `
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
    const data = Data.db.clientes.filter(c =>
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
    const data = Data.db.proveedores.filter(p =>
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
    const data = Data.db.productos.filter(p =>
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
    const low = Data.db.productos.filter(p => p.stock < 50);
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
    const data = Data.db.ventas;
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
              ${Data.db.productos.slice(0,3).map(p => `<li>${p.nombre}</li>`).join('')}
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

  
  /* ---------- Modal helpers ---------- */
  function openModal(innerHtml){
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-overlay" data-close>
      <div class="modal" role="dialog" aria-modal="true">
        ${innerHtml}
      </div>
    </div>`;
    root.addEventListener('click', (e)=>{
      if (e.target.matches('[data-close]') || e.target.closest('[data-close-btn]')) closeModal();
    });
  }
  function closeModal(){ document.getElementById('modal-root').innerHTML = ''; }

  function openClienteForm(editing){
    const title = editing ? 'Editar cliente' : 'Nuevo cliente';
    const model = editing || { nombre:'', cedula:'', correo:'', telefono:'' };
    openModal(`
      <header>
        <h3>${title}</h3>
        <button class="btn secondary" data-close-btn>×</button>
      </header>
      <form class="form" id="form-cliente">
        <div class="field">
          <label>Nombre <span class="badge">obligatorio</span></label>
          <input name="nombre" value="${model.nombre||''}" required placeholder="Ej. Panadería Doña Rosa" />
          <div class="error" data-error-nombre></div>
        </div>
        <div class="field">
          <label>Cédula jurídica/física</label>
          <input name="cedula" value="${model.cedula||''}" placeholder="3-101-456789" />
        </div>
        <div class="field">
          <label>Correo</label>
          <input type="email" name="correo" value="${model.correo||''}" placeholder="ventas@empresa.cr" />
          <div class="error" data-error-correo></div>
        </div>
        <div class="field">
          <label>Teléfono</label>
          <input name="telefono" value="${model.telefono||''}" placeholder="2444-1122" />
        </div>
        <div class="modal-actions">
          <button class="btn secondary" type="button" data-close-btn>Cancelar</button>
          <button class="btn" type="submit">${editing ? 'Guardar cambios' : 'Crear cliente'}</button>
        </div>
      </form>
    `);

    const form = document.getElementById('form-cliente');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const nombre = (fd.get('nombre')||'').toString().trim();
      const correo = (fd.get('correo')||'').toString().trim();
      const cedula = (fd.get('cedula')||'').toString().trim();
      const telefono = (fd.get('telefono')||'').toString().trim();

      let ok = true;
      const emailOk = !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
      $('[data-error-nombre]').textContent = nombre ? '' : 'El nombre es obligatorio.';
      $('[data-error-correo]').textContent = emailOk ? '' : 'Formato de correo inválido.';
      ok = !!nombre && emailOk;
      if (!ok) return;

      if (editing){
        editing.nombre = nombre; editing.correo = correo; editing.cedula = cedula; editing.telefono = telefono;
      } else {
        const id = Math.max(0, ...Data.db.clientes.map(c=>c.id)) + 1;
        Data.db.clientes.push({ id, nombre, correo, cedula, telefono });
      }
      closeModal();
      render();
    });
  }
  function openProveedorForm(editing){
    const title = editing ? 'Editar proveedor' : 'Nuevo proveedor';
    const model = editing || { nombre:'', contacto:'', correo:'', telefono:'' };
    openModal(`
      <header>
        <h3>${title}</h3>
        <button class="btn secondary" data-close-btn>×</button>
      </header>
      <form class="form" id="form-proveedor">
        <div class="field">
          <label>Nombre <span class="badge">obligatorio</span></label>
          <input name="nombre" value="${model.nombre||''}" required placeholder="Ej. Distribuidora El Sol" />
          <div class="error" data-error-nombre></div>
        </div>
        <div class="field">
          <label>Contacto</label>
          <input name="contacto" value="${model.contacto||''}" placeholder="Persona contacto" />
        </div>
        <div class="field">
          <label>Correo</label>
          <input type="email" name="correo" value="${model.correo||''}" placeholder="proveedor@empresa.cr" />
          <div class="error" data-error-correo></div>
        </div>
        <div class="field">
          <label>Teléfono</label>
          <input name="telefono" value="${model.telefono||''}" placeholder="2444-1122" />
        </div>
        <div class="modal-actions">
          <button class="btn secondary" type="button" data-close-btn>Cancelar</button>
          <button class="btn" type="submit">${editing ? 'Guardar cambios' : 'Crear proveedor'}</button>
        </div>
      </form>
    `);
    const form = document.getElementById('form-proveedor');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const nombre = (fd.get('nombre')||'').toString().trim();
      const contacto = (fd.get('contacto')||'').toString().trim();
      const correo = (fd.get('correo')||'').toString().trim();
      const telefono = (fd.get('telefono')||'').toString().trim();
      const emailOk = !correo || /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(correo);
      document.querySelector('[data-error-nombre]').textContent = nombre ? '' : 'El nombre es obligatorio.';
      document.querySelector('[data-error-correo]').textContent = emailOk ? '' : 'Formato de correo inválido.';
      if (!nombre || !emailOk) return;
      if (editing){
        editing.nombre = nombre; editing.contacto = contacto; editing.correo = correo; editing.telefono = telefono;
      } else {
        const id = Math.max(0, ...Data.db.proveedores.map(p=>p.id||0)) + 1;
        Data.db.proveedores.push({ id, nombre, contacto, correo, telefono });
      }
      closeModal(); render();
    });
  }

  function openProductoForm(editing){
    const title = editing ? 'Editar producto' : 'Nuevo producto';
    const model = editing || { sku:'', nombre:'', descripcion:'', proveedor:'', precio:0, unidad:'unidad', stock:0 };
    const proveedoresOpts = Data.db.proveedores.map(p=>`<option value="${p.nombre}" ${p.nombre===model.proveedor?'selected':''}>${p.nombre}</option>`).join('');
    openModal(`
      <header>
        <h3>${title}</h3>
        <button class="btn secondary" data-close-btn>×</button>
      </header>
      <form class="form" id="form-producto">
        <div class="field">
          <label>SKU <span class="badge">obligatorio</span></label>
          <input name="sku" value="${model.sku||''}" required placeholder="ABC-001" />
          <div class="error" data-error-sku></div>
        </div>
        <div class="field">
          <label>Nombre <span class="badge">obligatorio</span></label>
          <input name="nombre" value="${model.nombre||''}" required placeholder="Tornillo 1/4&quot;" />
          <div class="error" data-error-nombre></div>
        </div>
        <div class="field">
          <label>Proveedor</label>
          <select name="proveedor"><option value="">—</option>${proveedoresOpts}</select>
        </div>
        <div class="field">
          <label>Precio (CRC)</label>
          <input name="precio" type="number" min="0" step="0.01" value="${Number(model.precio)||0}" />
        </div>
        <div class="field">
          <label>Unidad</label>
          <input name="unidad" value="${model.unidad||'unidad'}" />
        </div>
        <div class="field">
          <label>Stock</label>
          <input name="stock" type="number" min="0" step="1" value="${Number(model.stock)||0}" />
        </div>
        <div class="field" style="grid-column:1/-1">
          <label>Descripción</label>
          <textarea name="descripcion" rows="2">${model.descripcion||''}</textarea>
        </div>
        <div class="modal-actions">
          <button class="btn secondary" type="button" data-close-btn>Cancelar</button>
          <button class="btn" type="submit">${editing ? 'Guardar cambios' : 'Crear producto'}</button>
        </div>
      </form>
    `);
    const form = document.getElementById('form-producto');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const sku = (fd.get('sku')||'').toString().trim();
      const nombre = (fd.get('nombre')||'').toString().trim();
      const proveedor = (fd.get('proveedor')||'').toString().trim();
      const precio = Number(fd.get('precio')||0);
      const unidad = (fd.get('unidad')||'unidad').toString().trim() || 'unidad';
      const stock = Number(fd.get('stock')||0);
      document.querySelector('[data-error-sku]').textContent = sku ? '' : 'El SKU es obligatorio.';
      document.querySelector('[data-error-nombre]').textContent = nombre ? '' : 'El nombre es obligatorio.';
      if (!sku || !nombre) return;
      if (editing){
        editing.sku = sku; editing.nombre = nombre; editing.proveedor = proveedor;
        editing.precio = isNaN(precio)?0:precio; editing.unidad = unidad; editing.stock = isNaN(stock)?0:stock;
      } else {
        const id = Math.max(0, ...Data.db.productos.map(p=>p.id||0)) + 1;
        Data.db.productos.push({ id, sku, nombre, proveedor, precio:isNaN(precio)?0:precio, unidad, stock:isNaN(stock)?0:stock });
      }
      closeModal(); render();
    });
  }

  function openVentaForm(){
    const clientesOpts = Data.db.clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
    const productosOpts = Data.db.productos.map(p=>`<option value="${p.id}">${p.sku} — ${p.nombre} (₡${p.precio.toFixed(2)})</option>`).join('');
    let items = [];
    function calcTotal(){ return items.reduce((s,it)=>s + it.cantidad * it.precio, 0); }
    function renderItems(){
      const tbody = document.getElementById('venta-items-body');
      tbody.innerHTML = items.map((it,idx)=>`
        <tr>
          <td>${it.sku}</td><td>${it.nombre}</td><td>${it.cantidad}</td>
          <td>₡ ${it.precio.toFixed(2)}</td><td>₡ ${(it.cantidad*it.precio).toFixed(2)}</td>
          <td><button class="btn warn" data-rm="${idx}" type="button">Quitar</button></td>
        </tr>`).join('');
      document.getElementById('venta-total').textContent = '₡ ' + calcTotal().toFixed(2);
    }
    openModal(`
      <header>
        <h3>Nueva venta</h3>
        <button class="btn secondary" data-close-btn>×</button>
      </header>
      <form class="form" id="form-venta">
        <div class="field">
          <label>Cliente</label>
          <select name="clienteId" required><option value="">Seleccionar…</option>${clientesOpts}</select>
        </div>
        <div class="field">
          <label>Fecha</label>
          <input type="date" name="fecha" required />
        </div>
        <div class="field" style="grid-column:1/-1">
          <fieldset>
            <legend>Ítems</legend>
            <div class="row" style="gap:.5rem; align-items: end;">
              <div class="field">
                <label>Producto</label>
                <select id="venta-prod" ><option value="">—</option>${productosOpts}</select>
              </div>
              <div class="field">
                <label>Cantidad</label>
                <input id="venta-cant" type="number" min="1" step="1" value="1" />
              </div>
              <button class="btn" type="button" id="venta-add">Agregar ítem</button>
            </div>
            <table class="table" style="margin-top:.5rem">
              <thead><tr><th>SKU</th><th>Producto</th><th>Cant.</th><th>P. Unit</th><th>Subtotal</th><th></th></tr></thead>
              <tbody id="venta-items-body"></tbody>
              <tfoot><tr><td colspan="4" style="text-align:right">Total</td><td id="venta-total">₡ 0.00</td><td></td></tr></tfoot>
            </table>
          </fieldset>
        </div>
        <div class="modal-actions">
          <button class="btn secondary" type="button" data-close-btn>Cancelar</button>
          <button class="btn" type="submit">Registrar venta</button>
        </div>
      </form>
    `);
    document.getElementById('venta-add').addEventListener('click', ()=>{
      const sel = document.getElementById('venta-prod');
      const qty = Number(document.getElementById('venta-cant').value||1);
      const prod = Data.db.productos.find(p=>String(p.id)===String(sel.value));
      if (!prod){ alert('Seleccione un producto.'); return; }
      if (!(qty>=1)){ alert('Cantidad inválida.'); return; }
      items.push({ productoId: prod.id, sku: prod.sku, nombre: prod.nombre, precio: Number(prod.precio)||0, cantidad: qty });
      renderItems();
    });
    document.getElementById('venta-items-body').addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-rm]'); if (!btn) return;
      const idx = Number(btn.dataset.rm); items.splice(idx,1); renderItems();
    });
    renderItems();
    const form = document.getElementById('form-venta');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      if (items.length===0){ alert('Agregue al menos un ítem.'); return; }
      const fd = new FormData(form);
      const clienteId = Number(fd.get('clienteId'));
      const fecha = (fd.get('fecha')||'').toString();
      const id = Math.max(0, ...Data.db.ventas.map(v=>v.id||0)) + 1;
      const total = calcTotal();
      Data.db.ventas.push({ id, clienteId, fecha, total, estado: 'Emitida', items });
      closeModal(); render();
    });
  }

/* ---------- Helpers y eventos por vista ---------- */

  function getClienteNombre(id){
    const c = Data.db.clientes.find(x => x.id === id);
    return c ? c.nombre : 'Desconocido';
  }

  function attachViewHandlers(route){
    if (route === '/clientes') {
      $('#nuevo-cliente')?.addEventListener('click', () => {
        openClienteForm();
      });
      $('#tabla-clientes')?.addEventListener('click', (e)=>{
        const btn = e.target.closest('button');
        if (!btn) return;
        const tr = e.target.closest('tr');
        const id = Number(tr.dataset.id);
        const act = btn.dataset.act;
        if (act === 'edit') {
          const c = Data.db.clientes.find(x=>x.id===id);
          openClienteForm(c);
        } else if (act === 'quote') {
          alert('Abriría flujo de cotización (maqueta).');
        }
      });
    }

    if (route === '/proveedores') {
      $('#nuevo-proveedor')?.addEventListener('click', () => {
        openProveedorForm();
      });
      // permitir editar desde la tabla
      document.querySelector('table.table')?.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-act="edit"]');
        if (!btn) return;
        const tr = e.target.closest('tr');
        const id = Number(tr.dataset.id);
        const p = Data.db.proveedores.find(x=>x.id===id);
        if (p) openProveedorForm(p);
      });
    }

    if (route === '/productos') {
      $('#nuevo-producto')?.addEventListener('click', () => {
        openProductoForm();
      });
    }

    if (route === '/ventas') {
      $('#nueva-venta')?.addEventListener('click', () => {
        openVentaForm();
      });
    }

    if (route === '/configuracion') {
      $('#form-config')?.addEventListener('submit', (e)=>{
        e.preventDefault();
        alert('Cambios guardados (demo, sin persistencia).');
      });
    }
  }

  
  // Inicialización: cargar actores y actor por defecto
  (async () => {
    const actors = await loadActors();
    const sel = document.getElementById('actor-select');
    actors.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.name;
      if (a.id === Data.actor) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', async (e)=>{
      await loadActorData(e.target.value);
      render();
    });
    await loadActorData(Data.actor);
    render();
  })();

})();
