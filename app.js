const express = require('express');
const hbs = require('hbs');
const morgan = require("morgan");
const { createProxyMiddleware } = require('http-proxy-middleware');
const msal = require('@azure/msal-node');
const https = require('https');
const app = express();
app.set('view engine', 'hbs');

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";
const URL = "https://l8riskmanagement.com";
const REDIRECT_URI = "https://l8risk.co.uk/test";

app.use(morgan('dev'));

app.use(express.static('public'));

const config = {
    auth: {
        clientId: "049ec035-91dd-445e-bfa7-11f9d3d77612",
        authority: "https://login.microsoftonline.com/88546ef2-2aff-4dfc-a538-f012b65a1339",
        clientSecret: "GT17Q~VgVOtu4xhdsKnCYgYxFxFNSOnyIPTgR"
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
                logLevel: msal.LogLevel.Verbose,
        }
    }
};

// Create msal application object
const pca = new msal.ConfidentialClientApplication(config);

app.get('/', createProxyMiddleware({
    target: URL,
    changeOrigin: true,
    pathRewrite: {
        [`^/`]: '',
    },
}))

app.get('/test', (req, res, next) => {
    if (req.query.code) {
        const tokenRequest = {
            code: req.query.code,
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };

        pca.acquireTokenByCode(tokenRequest).then((response) => {
            https.get(URL, (resp) => {
                let data = '';

                resp.on('data', (chunk => {
                    data += chunk;
                }));

                resp.on('end', () => {
                    res.render('main', {body: data, loggedIn: true, user: response.account.name});
                    // res.set('Content-Type', 'text/html');
                    // res.render(data);
                });
            })
        }).catch((error) => {
            res.redirect(REDIRECT_URI);
            // console.log(error);
            // res.status(500).send(error);
        });
    } else {
        const authCodeUrlParameters = {
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };

        // get url to sign user in and consent to scopes needed for application
        pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    }
})

app.get('/l8.png', (req, res, next) => {
    res.sendFile(__dirname + '/l8.png');
})

app.get('*', function (req, res) {
    res.status(404);

    res.format({
        html: function () {
            res.sendFile(__dirname + '/public/html/404.html');
        },
        json: function () {
            res.json({error: 'Not Found'})
        },
        default: function () {
            res.type('txt').send('Not Found')
        }
    })
})

app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
});

module.exports = app;
