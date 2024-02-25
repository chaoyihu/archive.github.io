---
layout: post
title: "Run Multiple Apps on One EC2 Instance using NGINX"
date: 2024-02-23
tags: [NGINX, AWS]
categories: [developer]
description: "This post documented how I set up NGINX as a reverse proxy to route requests to multiple applications running on one single Amazon EC2 instance."
---

# Intro

I want to deploy multiple hobby web projects on the same EC2 instance, since I don't want the extra cost of running each of them on a separate server.

When I had just one web app running on the instance, I simply let it listen on a specific port, and that was sufficient. For multiple applications, I cannot have them directly listen on the same port on the same network interface, but I can achieve similar effect by setting up a reverse proxy such as NGINX, which will listen on a single port and then forward incoming requests to different applications based on criteria such as the domain name, URL path, or other headers.

In this post, I am documenting how I set up NGINX as a reverse proxy to run two web applications on one Amazon EC2 instance.


# Experimenting on local machine

## Set up proxy_pass for request routing

```shell
$ sudo apt update
$ sudo apt install nginx
$ systemctl status nginx
```

The service status shows active, and the nginx welcome page shows up when accessing localhost.

According to [nginx doc](https://docs.nginx.com/nginx/admin-guide/basic-functionality/managing-configuration-files/), write a minimal configuration in `/etc/nginx/nginx.conf`:

```
events {
}

http {
        server {
            listen 80;
            location /app1/ {
                proxy_pass http://127.0.0.1:3000/;
            }
            location /app2/ {
                proxy_pass http://127.0.0.1:8000/;
            }
        }
}
```

> NOTE
> [The NGINX directory structure](https://wiki.debian.org/Nginx/DirectoryStructure) explains different configuration files. 
> 
https://stackoverflow.com/questions/19108044/nginx-routing-path-to-server

Then reload the configuration:

```shell
$ sudo systemctl reload nginx
```

Till this step, app1 can be accessed at localhost/app1, and app2 can be accessed at localhost/app2.

## Serving static files

Serving static files can be handled by NGINX or the web application. Referring to [a discussion on Stack Overflow](https://stackoverflow.com/questions/46692341/express-nginx-cant-serve-static-files), I set up my static file serving in the following way:

### With Express

For app1, which uses Express framework, the static files reside in a public folder:
```shell
app1
├── app.js
├── bin
│   └── www
├── database
│   └── ...
├── node_modules
│   └── ...
├── package.json
├── package-lock.json
├── public
│   ├── images
│   ├── javascripts
│   ├── stylesheets
│   └── views
└── routes
    └── ...
```
Use the static file handler middleware in app definition:
```javascript
// app.js
app.use(express.static('public'));
```
And since NGINX maps '/app1/' requests to '/' in project directory of app1, static files need to be included like this in my project code: 
```html
<link rel="stylesheet" href="/app1/stylesheets/style.css">
<script src="/app1/javascripts/words.js"></script>
```

Any redirects in project code should be modified accordingly, for example:
```javascript
var redirect_url = "http://" + window.location.host + "/app1/endpoint";
window.location.replace(redirect_url);
```

### With Tornado

App2 is developed based on Python's Tornado web framework. Project structure:

```shell
app2
├── compose.yaml
├── README.md
├── redis
│   └── Dockerfile
└── web
    ├── Dockerfile
    ├── handlers
    ├── requirements.txt
    ├── server.py
    ├── static     # images, stylesheets and js files
    ├── templates  # views
    └── utils
```

In my application code, templates path is defined in Dockerfile as ENV HTML_PATH=./templates, and called in the following way which does not need any modification:
```python
    async def get(self):
        html_file = os.getenv("HTML_PATH") + "/index.html"
        with open(html_file) as f:
            self.write(f.read())
```

But for other files in /static:
```html
<!-- In HTML -->
<link rel="stylesheet" type="text/css" href="/app2/static/style.css" />
<script type="text/javascript" src="/app2/static/common.js"></script>
```

## Proxying WebSocket connections

I added a new location configuration in /etc/nginx/nginx.conf for the websocket:

```
events {
}

http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    server {
        listen 80;

        location /app1/ {
            proxy_pass http://127.0.0.1:3000/;
        }
        location /app2/ {
            proxy_pass http://127.0.0.1:8000/;
        }

        location /app2/ws {
            proxy_pass http://127.0.0.1:8000/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }
    }
}
```

Note that in both `/ws` occurrences, there is no slash at the end of the url, and in my application's routing table, the entry is defined as `(r"/pubsub",  WebSocketHandler)`, also without a slash at the end.

Another problem I noticed is that web sockets proxyed by NGINX closes after 60 seconds of inactivity. In order to keep the websocket connection alive, I added a heartbeat function that gets called every 30 seconds sending a ping message from client to server:

```javascript
setInterval(function () {
if (document.ws && document.ws.readyState === WebSocket.OPEN) {
    document.ws.send(JSON.stringify({
    type: "heartbeat"
    }));
}
}, 30000);
```

References:

- [Python websockets doc - configure and run nginx](https://websockets.readthedocs.io/en/stable/howto/nginx.html#configure-and-run-nginx)

- [NGINX doc - WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)

## Modification in application code

Since the url has changed, I need to fix internal links, like redirecting to a different page:

```javascript
// new user, redirect to register page
var redirect_url = window.location.host + "/app1/register";
...

```

# Set up the EC2 instance

In the previous section, we already have both applications running on localhost using NGINX as a proxy. Now we just need to run it on the remote EC2 instance using basically the same steps.

## Install and run NGINX

SSH into the remote server, then do:
```shell
$ sudo yum install nginx
$ sudo vi /etc/nginx/nginx.conf
```

Paste the config from previous section to nginx.conf, and activate nginx:

```
events {
}

http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    server {
        listen 80;

        location /app1/ {
            proxy_pass http://127.0.0.1:3000/;
        }
        location /app2/ {
            proxy_pass http://127.0.0.1:8000/;
        }

        location /app2/ws {
            proxy_pass http://127.0.0.1:8000/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }
    }
}
```

```shell
$ sudo systemctl start nginx
```

## Run the applications

Run your application. In my case, app1 listens on port 3000 and app2 listens on port 8000.

> NOTE
> For app1 I pulled the code using git and needed to install npm.
>
> Install Git: `sudo yum install git -y`
>
> Set up Node: [Setting up node on EC2 - AWS Doc](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html), and [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
>
> And here is a link explaining how to run npm continuously after logging out from ssh: [npmjs package - forever](https://www.npmjs.com/package/forever).


That's basically it! Now the two applications can be accessed at:
- http://ec2.public.ip.address/app1
- http://ec2.public.ip.address/app2


An additional benefit of using NGINX is that I do not have to manage ssl certificates separately in my applications - like what I did in [this previous post]({% post_url 2024-02-07-setting-up-secure-communication-protocols-for-dockerized-web-server %}) in development. Instead, NGINX can handle ssl termination. But for now I just link to them using public ip - no domain name nor CA-signed ssl certs configured, and I might work on that some other time.

Thanks for reading! ✨✨