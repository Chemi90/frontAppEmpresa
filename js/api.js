export async function post(path,data){
    const res=await fetch(`https://josemiguelruizguevara.com:5000/api/${path}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
    });if(!res.ok)throw new Error(await res.text());return res.json();
  }
  export async function get(path){const res=await fetch(`https://josemiguelruizguevara.com:5000/api/${path}`);return res.json();}