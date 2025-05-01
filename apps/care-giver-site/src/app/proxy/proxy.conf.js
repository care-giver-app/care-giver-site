
const proxyConfig = [
    {
        context: [
            "/receiver"
        ],
        target: "https://api-dev.caretosher.com",
        secure: false,
        changeOrigin: true,
        logLevel: "debug"
    },
    {
        context: [
            "/oauth2/token"
        ],
        target: "https://us-east-2vpn29prfx.auth.us-east-2.amazoncognito.com",
        secure: true,
        changeOrigin: true,
        logLevel: "debug"
    }
];

module.exports = proxyConfig