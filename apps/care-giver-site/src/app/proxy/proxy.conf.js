
const proxyConfig = [
    {
        context: [
            "/receiver"
        ],
        target: "https://xxg5eol023.execute-api.us-east-2.amazonaws.com/Stage",
        secure: false,
        changeOrigin: true,
        logLevel: "debug"
    },
];

module.exports = proxyConfig