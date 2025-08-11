// Basic headless test for initial placement undo & re-place logic
// Prepare a browser-like global BEFORE importing buildLogic
global.window = global.window || {};
window.location = window.location || { hostname: 'localhost' };

async function run() {
  const { initializeInitialPlacement, validateInitialPlacement, undoLastInitialPlacement, recordInitialPlacementAction } = await import('../modules/buildLogic.js');

  function makePlayer(name) {
  return { name, color: 0xffffff, settlements: [], cities: [], roads: [], resources: { wood:1, clay:1, wheat:1, sheep:1, ore:0 } };
  }

  // Minimal land-tile stubs
  window.tileMeshes = { '0,0': { name:'center.glb' }, '1,0': { name:'wood.glb' }, '0,1': { name:'wood.glb' } };

  const players = [makePlayer('P1'), makePlayer('P2')];
  window.players = players;

  initializeInitialPlacement(players);

  // Place settlement for P1 at (0,0,0)
  let res = validateInitialPlacement(players[0], 0, 'settlements', 0,0,0, null, players);
  if(!res.success) throw new Error('Should be valid first placement: '+res.reason);
  players[0].settlements.push({q:0,r:0,corner:0});
  recordInitialPlacementAction('settlements',0,0,0,0);

  // Undo
  const undo = undoLastInitialPlacement(0, players);
  if(!undo.success) throw new Error('Undo failed: '+undo.reason);
  if(players[0].settlements.length!==0) throw new Error('Settlement not removed');

  // Re-place same spot
  res = validateInitialPlacement(players[0], 0, 'settlements', 0,0,0, null, players);
  if(!res.success) throw new Error('Rebuild after undo should pass: '+res.reason);

  console.log('undoRebuildTest OK');
}

run().catch(e => { console.error(e); process.exit(1); });
