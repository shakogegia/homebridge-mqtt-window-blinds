const { debounce } = require('lodash');

console.log('🧪 Testing Lodash Debounce...\n');

// Create a debounced function
const debouncedFunction = debounce((message) => {
    console.log(`✅ Debounced function called: ${message}`);
}, 1000);

console.log('📝 Calling debounced function multiple times quickly...');
console.log('⏰ Should only execute once after 1 second delay\n');

// Call the function multiple times quickly
debouncedFunction('First call');
debouncedFunction('Second call');
debouncedFunction('Third call');

console.log('⏳ Waiting for debounce delay...');

// Wait for the debounce to complete
setTimeout(() => {
    console.log('\n✅ Debounce test completed!');
    console.log('📝 The function should have only executed once.');
}, 1500); 