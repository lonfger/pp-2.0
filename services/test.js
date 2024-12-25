async function test(){
 const res = await fetch('https://pipe-network-backend.pipecanary.workers.dev/api/getBaseUrl')
  if (res.ok) {
    console.log(await res.json())
  } else {
    console.log('fetch error')
  }
}
test()