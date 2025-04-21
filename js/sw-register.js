if('serviceWorker'in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js')
      .then(r=>console.log('SW',r.scope)).catch(console.error));
  }
  