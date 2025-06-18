require('dotenv').config();
const { setPosition, open, close, stop } = require('./utils/blinds');

(async () => {
    await setPosition(80);
    process.exit(0);
})();
