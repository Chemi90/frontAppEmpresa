const BASE='https://josemiguelruizguevara.com:5000/api';

export async function api(path,{method='GET',body=null}={}){
  const o={method,headers:{}};
  if(body){
    if(body instanceof FormData){o.body=body;}
    else{o.headers['Content-Type']='application/json';o.body=JSON.stringify(body);}
  }
  const r=await fetch(`${BASE}${path}`,o);
  if(!r.ok){
    let m='Error de red';try{m=(await r.json()).error||m;}catch{}
    throw new Error(m);
  }
  return r.status===204?null:r.json();
}
