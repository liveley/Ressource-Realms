// Test script to validate the turn controller refactoring
// This script can be run in the browser console to test all functionality

console.log('🧪 Starting Turn Controller Validation Tests...');

// Import functions (assumes modules are available)
import { 
  getActivePlayerIdx, 
  setActivePlayerIdx, 
  getCurrentPhase, 
  setPhase, 
  nextPlayer, 
  nextPhase,
  canBuild, 
  canTrade, 
  canRollDice,
  validateGameState,
  initializeTurnController,
  TURN_PHASES 
} from './modules/turnController.js';

// Test suite
class TurnControllerTests {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  assert(condition, message) {
    if (condition) {
      this.passed++;
      console.log(`✅ ${message}`);
    } else {
      this.failed++;
      console.log(`❌ ${message}`);
    }
    this.tests.push({ condition, message, passed: condition });
  }

  runTests() {
    console.log('\n🔧 Testing Turn Controller Initialization...');
    this.testInitialization();
    
    console.log('\n👤 Testing Player Management...');
    this.testPlayerManagement();
    
    console.log('\n⚡ Testing Phase Management...');
    this.testPhaseManagement();
    
    console.log('\n🎮 Testing Game Actions...');
    this.testGameActions();
    
    console.log('\n🛡️ Testing Error Handling...');
    this.testErrorHandling();
    
    this.printResults();
  }

  testInitialization() {
    // Test initialization
    const initResult = initializeTurnController();
    this.assert(initResult === true, 'Turn controller initializes successfully');
    
    // Test initial state
    this.assert(typeof getActivePlayerIdx() === 'number', 'Active player index is a number');
    this.assert(getActivePlayerIdx() >= 0, 'Active player index is non-negative');
    this.assert(Object.values(TURN_PHASES).includes(getCurrentPhase()), 'Current phase is valid');
    
    // Test game state validation
    const validState = validateGameState();
    this.assert(validState === true, 'Initial game state is valid');
  }

  testPlayerManagement() {
    const initialPlayer = getActivePlayerIdx();
    
    // Test valid player switch
    const nextPlayerResult = nextPlayer();
    this.assert(nextPlayerResult === true, 'Next player transition succeeds');
    this.assert(getActivePlayerIdx() !== initialPlayer, 'Active player actually changed');
    
    // Test specific player setting
    const setResult = setActivePlayerIdx(0);
    this.assert(setResult === true, 'Setting specific player succeeds');
    this.assert(getActivePlayerIdx() === 0, 'Active player set correctly');
    
    // Test invalid player index
    const invalidResult = setActivePlayerIdx(-1);
    this.assert(invalidResult === false, 'Invalid player index rejected');
    
    const tooHighResult = setActivePlayerIdx(999);
    this.assert(tooHighResult === false, 'Too high player index rejected');
  }

  testPhaseManagement() {
    // Test phase setting
    const dicePhaseResult = setPhase(TURN_PHASES.DICE);
    this.assert(dicePhaseResult === true, 'Setting DICE phase succeeds');
    this.assert(getCurrentPhase() === TURN_PHASES.DICE, 'Current phase is DICE');
    
    // Test phase progression
    const nextPhaseResult = nextPhase();
    this.assert(nextPhaseResult === true, 'Next phase transition succeeds');
    this.assert(getCurrentPhase() === TURN_PHASES.TRADE, 'Phase progressed to TRADE');
    
    // Test invalid phase
    const invalidPhaseResult = setPhase('INVALID_PHASE');
    this.assert(invalidPhaseResult === false, 'Invalid phase rejected');
  }

  testGameActions() {
    // Test dice rolling permission
    setPhase(TURN_PHASES.DICE);
    this.assert(canRollDice() === true, 'Can roll dice in DICE phase');
    
    // Test trading permission
    setPhase(TURN_PHASES.TRADE);
    this.assert(canTrade() === true, 'Can trade in TRADE phase');
    this.assert(canRollDice() === false, 'Cannot roll dice in TRADE phase');
    
    // Test building permission
    setPhase(TURN_PHASES.BUILD);
    this.assert(canBuild() === true, 'Can build in BUILD phase');
    this.assert(canTrade() === true, 'Can still trade in BUILD phase');
  }

  testErrorHandling() {
    // Test with no players
    const originalPlayers = window.players;
    window.players = [];
    
    const noPlayersResult = setActivePlayerIdx(0);
    this.assert(noPlayersResult === false, 'Rejects player setting with no players');
    
    const nextPlayerNoPlayersResult = nextPlayer();
    this.assert(nextPlayerNoPlayersResult === false, 'Rejects next player with no players');
    
    // Restore players
    window.players = originalPlayers;
    
    // Test state validation after corruption
    window.activePlayerIdx = 'invalid';
    const invalidStateResult = validateGameState();
    this.assert(invalidStateResult === false, 'Detects invalid game state');
    
    // Restore valid state
    initializeTurnController();
  }

  printResults() {
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('🎉 All tests passed! Turn controller refactoring is successful.');
    } else {
      console.log('⚠️ Some tests failed. Please review the implementation.');
      console.log('\nFailed tests:');
      this.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  • ${t.message}`);
      });
    }
  }
}

// Manual testing functions for browser console
window.testTurnController = function() {
  const tests = new TurnControllerTests();
  tests.runTests();
};

window.quickTest = function() {
  console.log('🚀 Quick Turn Controller Test');
  console.log('Current Player:', getActivePlayerIdx());
  console.log('Current Phase:', getCurrentPhase());
  console.log('Can Build:', canBuild());
  console.log('Can Trade:', canTrade());
  console.log('Can Roll Dice:', canRollDice());
  console.log('Game State Valid:', validateGameState());
  
  console.log('\n🔄 Testing player switch...');
  const oldPlayer = getActivePlayerIdx();
  nextPlayer();
  console.log('New Player:', getActivePlayerIdx());
  console.log('Player changed:', oldPlayer !== getActivePlayerIdx());
  
  console.log('\n✅ Quick test complete');
};

// Export for module usage
export { TurnControllerTests };

console.log('✅ Turn Controller Test Suite Loaded');
console.log('Run testTurnController() for full tests or quickTest() for a quick check');
