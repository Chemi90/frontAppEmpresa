// js/tabs.js

export function init(navSelector, sectionsSelector) {
    const tabs = [
      { title: 'Desplazamientos', html: 'desplazamientos.html', css: 'desplazamientos.css', js: 'desplazamientos.js' },
      { title: 'Tickets',       html: 'tickets.html',       css: 'tickets.css',       js: 'tickets.js'       },
      { title: 'Facturas',      html: 'facturas.html',      css: 'facturas.css',      js: 'facturas.js'      },
      { title: 'Gastos',        html: 'gastos.html',        css: 'gastos.css',        js: 'gastos.js'        },
      { title: 'Nóminas',       html: 'nominas.html',       css: 'nominas.css',       js: 'nominas.js'       },
    ];
  
    const nav  = document.querySelector(navSelector);
    const main = document.querySelector(sectionsSelector);
  
    // Crear botones
    tabs.forEach((tab, idx) => {
      const btn = document.createElement('button');
      btn.textContent = tab.title;
      btn.addEventListener('click', () => loadTab(idx));
      nav.appendChild(btn);
    });
  
    // Carga inicial
    loadTab(0);
  
    async function loadTab(index) {
      const { html, css, js } = tabs[index];
  
      // 1) Cargar HTML de la sección
      const sectionHtml = await fetch(`partials/${html}`).then(r => r.text());
      main.innerHTML = sectionHtml;
  
      // 2) Inyectar el CSS específico (remueve anteriores si quieres)
      const prevLink = document.getElementById('tab-css');
      if (prevLink) prevLink.remove();
      const link = document.createElement('link');
      link.id   = 'tab-css';
      link.rel  = 'stylesheet';
      link.href = `css/${css}`;
      document.head.appendChild(link);
  
      // 3) Importar el módulo JS de la sección
      await import(`./${js}`);
    }
  }
  