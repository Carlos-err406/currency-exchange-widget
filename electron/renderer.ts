// const setupPing = async () => {
//   const callPing = async () => {
//     const start = Date.now();
//     const [error, pong] = await window.ipc.ping();
//     if (error) console.error('Error, could not reach main process', error);
//     else console.log(`ping - ${pong} ${Date.now() - start}ms`);
//   };

//   await callPing();
//   setInterval(callPing, 15_000);
// };

// (function () {
  // setupPing();
// })();
