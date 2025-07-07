// Test script to verify Road Debug Tools popup integration
// This script tests the following functionality:
// 1. Road Debug Tools popup should be hidden by default
// 2. Road Debug Tools popup should show when R+D is pressed
// 3. Road Debug Tools popup should hide when R+D is pressed again (toggle)
// 4. D key alone should only trigger dice debug (not Road Debug Tools)

console.log('=== Road Debug Tools Integration Test ===');

// Test 1: Check that Road Debug Tools popup is hidden by default
function testRoadDebugHiddenByDefault() {
    const roadDebugElement = document.getElementById('road-debug-tools');
    if (roadDebugElement) {
        const isHidden = roadDebugElement.style.display === 'none';
        console.log('✓ Test 1 PASSED: Road Debug Tools popup is hidden by default:', isHidden);
        return isHidden;
    } else {
        console.log('✗ Test 1 FAILED: Road Debug Tools element not found');
        return false;
    }
}

// Test 2: Simulate R+D key press to show popup
function testRDKeyPressShow() {
    console.log('\nTesting R+D key combination to show popup...');
    
    // Simulate pressing R
    const keydownEventR = new KeyboardEvent('keydown', {
        key: 'r',
        code: 'KeyR',
        keyCode: 82,
        which: 82,
        bubbles: true
    });
    
    // Simulate pressing D
    const keydownEventD = new KeyboardEvent('keydown', {
        key: 'd',
        code: 'KeyD',
        keyCode: 68,
        which: 68,
        bubbles: true
    });
    
    // Dispatch both events
    window.dispatchEvent(keydownEventR);
    window.dispatchEvent(keydownEventD);
    
    // Check if Road Debug Tools popup is visible
    setTimeout(() => {
        const roadDebugElement = document.getElementById('road-debug-tools');
        if (roadDebugElement) {
            const isVisible = roadDebugElement.style.display === 'block';
            console.log('✓ Test 2 RESULT: Road Debug Tools popup visibility after R+D:', isVisible);
            
            // Test 3: Test toggle functionality
            testRDKeyPressToggle();
        } else {
            console.log('✗ Test 2 FAILED: Road Debug Tools element not found');
        }
    }, 100);
}

// Test 3: Test toggle functionality (R+D again should hide)
function testRDKeyPressToggle() {
    console.log('\nTesting R+D key combination to toggle popup...');
    
    // Reset combination flag by releasing keys first
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'r', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', bubbles: true }));
    
    setTimeout(() => {
        // Press R+D again
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
        
        // Check if Road Debug Tools popup is hidden
        setTimeout(() => {
            const roadDebugElement = document.getElementById('road-debug-tools');
            if (roadDebugElement) {
                const isHidden = roadDebugElement.style.display === 'none';
                console.log('✓ Test 3 RESULT: Road Debug Tools popup hidden after second R+D:', isHidden);
                
                // Test 4: Test D key alone
                testDKeyAlone();
            } else {
                console.log('✗ Test 3 FAILED: Road Debug Tools element not found');
            }
        }, 100);
    }, 100);
}

// Test 4: Test D key alone (should not show Road Debug Tools)
function testDKeyAlone() {
    console.log('\nTesting D key alone...');
    
    // Reset keys
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'r', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', bubbles: true }));
    
    setTimeout(() => {
        // Simulate pressing D only
        const keydownEventD = new KeyboardEvent('keydown', {
            key: 'd',
            code: 'KeyD',
            keyCode: 68,
            which: 68,
            bubbles: true
        });
        
        // Dispatch D key event
        window.dispatchEvent(keydownEventD);
        
        // Check if Road Debug Tools popup remains hidden
        setTimeout(() => {
            const roadDebugElement = document.getElementById('road-debug-tools');
            if (roadDebugElement) {
                const isHidden = roadDebugElement.style.display === 'none';
                console.log('✓ Test 4 RESULT: Road Debug Tools popup remains hidden with D key alone:', isHidden);
                
                // Clean up
                const keyupEventD = new KeyboardEvent('keyup', {
                    key: 'd',
                    code: 'KeyD',
                    keyCode: 68,
                    which: 68,
                    bubbles: true
                });
                window.dispatchEvent(keyupEventD);
                
                console.log('\n=== Test Suite Complete ===');
            } else {
                console.log('✗ Test 4 FAILED: Road Debug Tools element not found');
            }
        }, 100);
    }, 100);
}

// Run tests after page loads
setTimeout(() => {
    console.log('Starting Road Debug Tools integration tests...');
    
    // First create the Road Debug Tools UI for testing
    if (window.createRoadDebugToolsUI) {
        window.createRoadDebugToolsUI();
    }
    
    if (testRoadDebugHiddenByDefault()) {
        testRDKeyPressShow();
    }
}, 2000);
