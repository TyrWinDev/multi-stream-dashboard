const selfsigned = require('selfsigned');
const fs = require('fs');

(async () => {
    try {
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = await selfsigned.generate(attrs, {
            days: 365,
            keySize: 2048,
            algorithm: 'sha256'
        });
        fs.writeFileSync('debug_output.txt', `SUCCESS: Generated certs!\nPrivate Key Length: ${pems.private.length}`);
    } catch (e) {
        fs.writeFileSync('debug_output.txt', `FAILURE: ${e.message}\nCause: ${e.cause}`);
    }
})();
