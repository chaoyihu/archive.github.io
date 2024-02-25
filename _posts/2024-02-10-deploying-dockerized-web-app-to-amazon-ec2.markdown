---
layout: post
title: "Running Web App on Amazon EC2 with Docker Compose"
date: 2024-02-10
tags: [AWS, Amazon EC2, Docker]
categories: [developer]
description: "Deploying a web application managed by docker compose to an Amazon EC2 Instance."
---

This post documents the steps I took to deploy my web app to an Amazon EC2 instance with docker compose.

# Steps

In this section, I referred mainly to [the AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html) and this tutorial: [How to run docker-compose on EC2 AWS](https://www.youtube.com/watch?v=gRgdnHHuvoI).

## Create a EC2 instance

First, I logged in to AWS console and navigated to the EC2 dashboard to started a new instance.

- For type of the new instance, I chose [t2.micro](https://aws.amazon.com/ec2/instance-types/t2/#:~:text=%240.002-,t2.micro,-1) with [Amazon Linux 2023](https://aws.amazon.com/linux/amazon-linux-2023/faqs/).
- As prompted, I created a new ssh keypair and the .pem file was automatically downloaded upon creation.
- In security group, I allowed ssh, https and http.

I pasted following script in Advanced - User data. The script here will be run by root user automatically once the instance is launched to install docker, docker compose and grant necessary access to non-root users.


```shell
#!/bin/bash
set -x
yum update -y
#install docker
yum install docker`
service docker start
systemctl enable docker
#allow docker to run as non-root user
usermod -a -G docker ec2-user
chmod 666 /var/run/docker.sock
#install docker compose
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

> **Quote**:
> - "Scripts entered as user data are run as the root user, so do not use the sudo command in the script."
> - "Remember that any files you create will be owned by the root user; if you need a non-root user to have file access, you should modify the permissions accordingly in the script."
> - "The script is not run interactively, so you cannot include commands that require user feedback (such as yum update without the -y flag)."
> 
> For more details, refer to [Run commands on your Linux instance at launch](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html).
>
> And here is a quick tip on [installation commands on different Amazon Machine Image (AMI) versions](https://gist.github.com/npearce/6f3c7826c7499587f00957fee62f8ee9) in case any of the install commands does not work.


## SSH into the instance

After launching the instance, it should be visible from the dashboard. Now click on the instance to find its public IP address, then open a local terminal and do the following to ssh into the instance:

```shell
$ chmod 0400 PEM_FILE.pem
$ ssh -i PEM_FILE.pem  ec2-user@the.public.ip.address
[ec2-user@ip-private ~]$ 
```

> **NOTE**
> If you do not change permissions on the pem file, which was automatically downloaded when you created the key pair, the following error will be raised:
> ```shell
> @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
> @         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
> @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
> Permissions 0664 for 'keyname.pem' are too open.
> It is required that your private key files are NOT accessible by others.
> This private key will be ignored.
> Load key "keyname.pem": bad permissions
> ```

Check docker and docker compose to make sure they are installed.

```shell
[ec2-user@ip-private ~]$ whoami
ec2-user
[ec2-user@ip-private ~]$ docker -v
Docker version 20.10.25, build b82b9f3
[ec2-user@ip-private ~]$ docker-compose -v
Docker Compose version v2.24.5
```
## Mount a data volume

According to [Amazon EC2 instance root volume - Root volume type](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/RootDeviceStorage.html), root volumes behave when ba Amazon EBS-backed instances and Instance store-backed instances, which behaves differently in case of a instance failure: basically, data persists on EBS volumes until you delete the volume while instance store disks get erased when the instance shuts down. This [discussion on Stack Overflow](https://stackoverflow.com/questions/74678898/what-does-ec2-store-and-why-does-it-even-need-a-storage-solution-like-ebs-or-ins) provides an accessible explanation. 

In my case, a [root volume](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/RootDeviceStorage.html) was automatically created when I launched the instance. I viewed the attached volume by visiting the storage tab under EC2 > Instances > instance_id, and confirmed that the root device type for the volume is EBS, which means the session can be restored in case of a instance failure, so I feel comfortable running my server without mounting an extra volume. 

But in case extra volumes need to be added, following is what to do:

Go to AWS EC2 console, find volume on sidebar. Create a volume - use same availability zone as the instance and attach it to the instance.

View the volumes to find the name of the volume you just created:
```shell
$ lsblk
```

Then format the volume using:
```shell
$ mkfs -t xfs /dev/volumename
```

Finally, make a directory as your mountpoint and mount the volume there:
```shell
$ mkdir /data
$ mount /dev/volumename /data
```

Ref: [Make the data volume available](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/step2-make-data-volume-available.html)

## Run the application

The application is managed by Docker Compose. This is the project structure on my local machine:

```shell
project
├── compose.yaml
├── README.md
├── redis
│   └── Dockerfile
└── web
    ├── Dockerfile
    ├── handlers/
    ├── requirements.txt
    ├── server.py
    ├── static/
    ├── templates/
    └── utils/
```

Two services are included in this application: web and redis. Web is the server application, I built it as a docker image and pushed it to registry. And for redis, the official docker image is used with default configurations (exposing port 6379). I had a Dockerfile for redis but it's actually not necessary unless custom configurations are added - in that case redis needs to be built as a custom image as well.

> Attaching the commands here for documentation purposes:
> ```shell
> $ docker login
> $ docker build -t dockeraccountname/dockerimagename:tag web/
> $ docker push dockeraccountname/dockerimagename:tag
> ```
> Replace `dockeraccountname/dockerimagename:tag` in use.


Following is what I wrote in compose.yaml. 

```yaml
# compose.yaml
version: '3.9'
  
services:
  redis:
    image: "redis:alpine"
    build: ./redis
  web:
    image: "dockeraccountname/dockerimagename:tag"
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

Since all the docker images used in this application are now available in the registry, compose.yaml is the only file needed to be transferred to the EC2 instance. The commands below copies necessary files into the instance by running `scp` in the local terminal, with `-i` specifying the key to use for this operation, and `-r` mapping local file location to the directory it mounts to on the instance.

```shell
$ scp -i ~/.ssh/yourkey.pem -r ~/project/compose.yaml ec2-user@public-ip:compose.yaml
$ scp -i ~/.ssh/yourkey.pem -r /etc/ssl/certs/test* ec2-user@public-ip:
```

And in the ssh terminal:
```shell
[ec2-user@ip-private ~]$ sudo mv test.* /etc/ssl/certs/
```

Finally, run the app:
```shell
[ec2-user@ip-private ~]$ docker-compose -f compose.yaml up -d
```

Done! Visit https://public-ip to access the server running on the instance, and the application is running as expected.

## Set AWS Cost Alert and Budget

As an additional step to avoid unexpected expenses, I set a billing alert and budget following documentation on [Creating a budget](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).

The process is straight-forward. I only had a permission issue with the IAM role assumed to perform the action of stopping the instance when exceeding budget, and solved it by adding a ststement to the policy of trusted relationship suggested in [this stack overflow discussion](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).

# To-Do

The web application is running fine now on the instance! I am simply using the public IP of the instance to access the application, and the ssl certs are still self-signed, but this is only temporary. Following steps may be completed and documented in a future post:

- Get a CA-signed SSL/TLS certificate to replace the self-signed certificate.
- Set up Elastic IP for the instance.

Thanks for reading! (•◡•)/