---
layout: post
title: "Configuring SSL/TLS certificates for Dockerized Tornado Web Server"
date: 2024-02-07
tags: [Tornado, Docker]
categories: [developer]
description: "This post documents how I configured self-signed SSL/TLS certificates for my Tornado web server, which runs in Docker containers managed by Docker compose. This setup enhances security by allowing encrypted transmission over HTTPS and WSS protocols."
---

# Planning

I have developed a web application in Python based on the Tornado web framework, which currently uses HTTP and WebSocket protocols for communication. To enhance security, I want to convert to using HTTPS and WSS protocols instead.

The basic idea is that I need to set up SSL/TLS certificates and configure Tornado to use them for secure communication, and since the application runs in Docker containers, I need to ensure that the certs are accessible within the container while keeping the certificates confidential.

> 
> **ALERT** 
>
> I saw posts online using COPY in Dockerfile to copy the certs into the docker image, which is a bad idea. Including confidential files directly in a Docker image posts security risks, as it effectively embeds sensitive info into the image, and as you distribute the image, anyone with access to it can view the sensitive info.

The solution adopted in this post uses secrets management with Docker Compose, referencing [this Stack Overflow discussion](https://stackoverflow.com/questions/72280771/how-to-use-secrets-when-building-docker-compose-locally) and [Docker Docs - Using Secrets in Compose](https://docs.docker.com/compose/use-secrets/). I chose this solution since it works well in development and I am already using Docker Compose for containers management, but this solution actually has its limitations (for example, [this file permission issue](#file-permissions-of-docker-secrets-when-using-docker-compose)), and you may consider alternatives that works best for you. Please see [discussion](#discussion) for details.


# My Steps

## Development Environment

My development environment:
- Ubuntu 22.04.3
- Docker version 25.0.3
- Tornado 6.2.0

## Create self-signed SSL certificates

First, I generated self-signed certificates using openssl.

```shell
$ openssl genrsa  -out test.key 2048
$ openssl req -key test.key -new -out test.csr
$ openssl x509 -signkey test.key -in test.csr -req -days 36500 -out test.crt
```

> 
> Understanding the commands:
> 
> 1. *genrsa* is used for generating a RSA private key. The *-out* option specifies the output file that stores the generated key, *2048* denotes the key size (2048-bit).
> 2. *req* is used for generating a Certificate Signing Request (CSR). The *-key* option specifies the private key used to generate the CSR. The CSR file is used in certificate issuance, and is typically not needed for ongoing server operation - I'm keeping it anyway for a record of the certificate generation process.
> 3. *x509* is used for signing certificates. This command signs the CSR in test.csr with the private key test.key, and generates a self-signed certificate test.crt with validity of 100 years. Long live the cert! but bad practice alert here: any serious certs should have a much shorter validity to reduce security risks, and you can read more about this, for example: [About SSL/TLS Certificate - AWS](https://aws.amazon.com/what-is/ssl-certificate/).

Ref: [How to create self-signed SSL TLS X.509 certificates using OpenSSL](https://www.bastionxp.com/blog/how-to-create-self-signed-ssl-tls-x.509-certificates-using-openssl/)

## Managing SSL certs using Docker Secrets with Docker Compose


### Where to place the certificates

I moved the certificates created in the previous section to a folder named secrets in my project directory. Below is the project structure. There are two services, `redis` for redis data storage and `web` for the Tornado web server.

```shell
project
├── compose.yaml
├── README.md
├── redis        # redis database
│   └── Dockerfile
├── secrets      # secrets folder
│   └── ssl_certs
│       ├── test.crt
│       ├── test.csr
│       └── test.key
└── web          # the Tornado web server
    ├── Dockerfile
    ├── handlers
    ├── requirements.txt
    ├── server.py
    ├── static
    ├── templates
    └── utils
```

Or actually, a common practice it to place the certs in `/etc/ssl/certs/` on your server machine.

```shell
project
├── compose.yaml
├── README.md
├── redis        # redis database
│   └── Dockerfile
└── web          # the Tornado web server
    ├── Dockerfile
    ├── handlers
    ├── requirements.txt
    ├── server.py
    ├── static
    ├── templates
    └── utils

/etc/ssl/certs
├── ...
├── test.crt
├── test.csr
└── test.key
```

> 
> **Should I add the secrets .dockerignore?**
>
> Docker compose builds images based on the context of the Dockerfile and its adjacent files instead of the project directory, thus my `secrets/` folder is not included in any image by default and does not need to be added to .dockerignore.
> 
> If the secrets folder is placed under any service directory, it should be added to .dockerignore.

> **Reminder: Add secrets to .gitignore if it's placed in project directory**
> ```shell
> # .gitignore
> **/secrets/*
> ```


### Configure secrets in compose.yaml and Dockerfile

Refer to [this page](https://docs.docker.com/compose/use-secrets/) for details, but basically, the top-level `secrets` section defines secret variables with specified files as their values, the `secrets` attribute under the `web` service mean I want to inject the two secrets to that specific container:

```yaml
# compose.yaml
version: '3'
  
services:
  redis:
    image: "redis:alpine"
    build: ./redis
  web:
    build: ./web
    ports:
      - 443:443
    secrets:
      - ssl_certfile
      - ssl_keyfile

secrets:
  ssl_certfile:
    file: /etc/ssl/certs/test.crt
  ssl_keyfile:
    file: /etc/ssl/certs/test.key
```

In Dockerfile for the tornado server, include the following environment variable. This is because for each container, Docker creates a temporary mount under /run/secrets/ for the injected secrets:

```yaml
ENV SECRETS_PATH=/run/secrets
```

And in Tornado server, use ssl_options to enable SSL/TLS when instantiating HTTPServer:
```python
# server.py
def main():
    # ...
    application = Application(routing_table)
    server = HTTPServer(
        application,
        ssl_options = {
            "certfile": os.path.join(os.getenv("SECRETS_PATH"), "ssl_certfile"),
            "keyfile" : os.path.join(os.getenv("SECRETS_PATH"), "ssl_keyfile")
        }
    )
    server.listen(443)
    print("Server listening on port %s ...\n" % port)
    main_loop = IOLoop.current()
    main_loop.start()

```

### File permissions of docker secrets in docker compose

As is suggested by [Docker Doc - Best Practices](https://docs.docker.com/develop/develop-images/instructions/#user), I was running my containers under a non-privileged user:

```yaml
# Dockerfile
# Run the application as a non-privileged user.
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser
USER appuser
```

To make the certs readable, I changed file permissions on my local machine. Please note that this is not ideal, nor is it ideal to run the container as a root user. See [dicussion](#using-one-node-docker-swarm) on this.

```shell
$ chmod 644 /etc/ssl/certs/test.*
```

### Run the server and check the connection

Finally, I ran the server using `docker compose up`, made sure the certs are in the expected folder by running `docker exec <server-container-id> ls /run/secrets/`, and visited `https://localhost` in chrome to check the connection.

As can be seen from the screenshot below, the server successfully accepted requests over HTTPS. Note that there is a "not secure" prompt in the search bar because the certificate is self-signed. See a discussion on this: [Stack Overflow - SSL self-signed certificates in development vs acquired cert in production](https://security.stackexchange.com/questions/111821/ssl-self-signed-certificates-in-development-vs-acquired-cert-in-production). To remove the prompt, we simply need to replace the self-signed certs with a valid certificate issued by a certificate authority (CA). Free, recognized certificates can be obtained from nonprofit CAs such as [Let's Encrypt](https://letsencrypt.org/).

![Show certificate](/assets/images/2024-02-10-https-localhost-443.png)


# Discussion

This part contains other possible solutions.

## Using one-node docker swarm?

The file permission issue was a surprise to me. I expected to be able to configure access permissions of secrets in a style similar to what is demonstrated in this [pull request regarding secrets management for non-swarm containers](https://github.com/moby/moby/pull/43543), but such a feature is actually unavailable.

As of May 2023, the recommended practice for secrets management is using a one-node docker swarm to access swarm secrets, as can be traced in [Secrets: write-up best practices, do's and don'ts, roadmap](https://github.com/moby/moby/issues/13490). Though I'm keeping relevant docs here for future references, the Docker Swarm solution is not included in this post, since I do not expect to scale my application to run across multiple hosts and using Docker Swarm solely for the reason of secrets management appears to be overshooting at this time. 

Ref: [Manage Docker Secrets in Docker Swarm](https://docs.docker.com/engine/swarm/secrets/)

## Using Apache Web Server for SSL termination?

There is a possibility of using Apache HTTP Server for SSL termination, handling encryption and managing certificates. In that case, Apache acts as a reverse proxy that handles incoming encrypted requests, decrypts them using the SSL/TLS certificate, and forwards decrypted requests to Tornado for processing. This is quite a nice solution, because besides simplifying certification management, the added reverse proxy can also do load balancing, serving static files, and offloading SSL/TLS processing.

One extra consideration here: since my application also accepts WebSocket connections, do they bypass Apache's SSL termination? The security risk will still pose if WebSocket connections are established directly between clients and the Tornado server without going through the Apache Web Server. The solution is probably Apache Websockets support Module [mod_proxy_wstunnel](https://httpd.apache.org/docs/2.4/mod/mod_proxy_wstunnel.html) to configure the proxy to use secure websocket communication. Anyway, this is left for future exploration.


# Ending

That's it! I call it a success now that the Tornado web server uses the self-signed SSL certificate to secure communication and working well in development.

Thanks for reading. The next post will probably be about deployment. 🤔