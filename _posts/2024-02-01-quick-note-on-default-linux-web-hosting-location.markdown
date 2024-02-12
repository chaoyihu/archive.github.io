---
layout: post
title: "Web Hosting Directory on Linux"
date: 2024-02-01
tags: [Linux]
categories: [developer]
description: "TL;DR: It's /var/www for me. I came across this when configuring NGINX."
---

This post documents how I learned about the web hosting directory on Linux when trying to remove a nginx welcome page that keeps showing up when I visit localhost.

# Background

I had a toy project using NGINX as proxy, and used it for testing on my local machine (Ubuntu 22.04.3).

Since I am not actively working on that project, the repo has been removed from my local machine.

# Problem

However, today I noticed that when I visit localhost, the "Welcome to NGINX" page still shows up.

# Digging it Up

## Try stopping the nginx system service

First, since the page is showing, I assumed that nginx is still running. So I checked the system service status. It turns out NGINX was indeed running, so I went ahead and stopped it:

```shell
$ sudo systemctl status nginx
$ sudo systemctl stop nginx
```

After confirming that the service is inactive, I visited localhost again, only to find the same welcome page.

## Try apt removing nginx

My second step is to try removing nginx.

```shell
$ sudo apt remove nginx
$ sudo apt autoremove
```

According to [this post](https://www.baeldung.com/linux/nginx-uninstall), I removed some possible variants as well:
```shell
sudo apt remove nginx*
```
But the welcome page is still there when I visit localhost.

## Try clearing browser cache

Simple, but worked.

## Locating the html file

When googling around I saw [someone else having a similar problem](https://stackoverflow.com/questions/51040372/nginx-uninstalled-localhost8080-still-showing-nginx-welcome-page). The answers suggest that for macOS there is actually a file in `/usr/local/var/www/` that will remain even after uninstalling nginx, which happens to be called up by httpd and keeps showing up.

I did not find that specific directory on my machine, maybe because I am using Ubuntu. But I did locate the file eventually in `/var/www` mentioned in [another discussion](https://askubuntu.com/questions/877261/why-is-var-www-a-recommended-location-to-host-your-web-app). The discussion also indicates that `/var/www` is where other developers can expect to find your software in web hosting.

# Useful links

- [Discussion on Ubuntu Forums](https://ubuntuforums.org/archive/index.php/t-1447454.html)
- [Linux Filesystem Hierarchy](https://tldp.org/LDP/Linux-Filesystem-Hierarchy/html/var.html)

This marks the end of my post! Tiny bite of knowledge on Linux filesystems. Thanks for reading ^_^