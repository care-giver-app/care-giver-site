
urls = {
    caretosher: {
        dev: "https://api-dev.caretosher.com",
        prod: "https://api.caretosher.com"
    }
}

caretosherUrl = urls.caretosher.dev;
if (process.env.ENV === "prod") {
    caretosherUrl = urls.caretosher.prod;
}

const proxyConfig = [
    {
        context: [
            "/receiver",
            "/user",
            "/event",
        ],
        target: caretosherUrl,
        secure: false,
        changeOrigin: true,
        logLevel: "debug"
    }
];

module.exports = proxyConfig