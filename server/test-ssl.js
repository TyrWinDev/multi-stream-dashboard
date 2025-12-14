const https = require('https');
const selfsigned = require('selfsigned');

console.log("Generating certs...");
console.log("Generating certs...");

(async () => {
    try {
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = await selfsigned.generate(attrs, { days: 365 });

        console.log("Pems Object:", Object.keys(pems));
        console.log("Private Key Length:", pems.private.length);
        console.log("Cert Length:", pems.cert.length);

        const server = https.createServer({
            key: pems.private,
            cert: pems.cert
        }, (req, res) => {
            res.writeHead(200);
            res.end('hello https\n');
        });

        server.listen(3001, () => {
            console.log('Test HTTPS server listening on port 3001');
            console.log('Try visiting https://localhost:3001');
        });
    } catch (err) {
        console.error("Error generating certs:", err);
    }
})();
