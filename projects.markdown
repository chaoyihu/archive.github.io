---
layout: base
title: Projects
---
<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>

# Sprinting: Web-Based Sprint Planning and Collaboration

## Introduction

Imagine you're grappling with inefficient team collaboration. Your team members lack a clear understanding of the goal, constantly getting bogged down by distractions and irrelevant tasks.

Enter Sprinting – your solution to turn chaos into cohesion. Sprinting is an app meticulously designed to sharpen your team's focus. It works by defining crystal-clear goals, breaking them into manageable tasks, and setting a timer to keep everyone on track.

With Sprinting, watch as your team transforms into a synchronized powerhouse. Clarity replaces confusion, distractions fade into the background, and each member moves purposefully toward the shared objective.


## Highlights

- Designed and built a dynamic web application to streamline sprint planning, sprint events hosting and
progress sharing among team members, leveraging Python with Tornado web framework for backend
development, JavaScript for responsive frontend interfaces, and Redis for efficient data storage.
- Utilized Redis pub/sub for seamless team communication via instant messages.
- Deployed the application using Docker on Amazon EC2.


## Walkthrough

Here is the entrypoint to the application:

![index page](/assets/images/sprinting-demo-index.png)

After registering or logging in, a profile page is presented. The left pane contains user information, and on the right pane, user can either initiate a new sprint or join an existing one using sprint id shared by the event initiator.

![profile page](/assets/images/sprinting-demo-profile.png)

This is what the event planning stage look like, you can:
- Choose a descriptive title for the sprint event.
- Write an introduction, setting clear goals and introducing main methodology.
- Define specific tasks to be completed.
- Add, edit, or delete tasks.
- Set a timer for the event.

![sprint planning](/assets/images/sprinting-demo-planning.png)

Initiating the sprint will redirect you to the main event page. Event info is shown on the left pane, including title, introduction, initiator and the event timer. Copy and share sprint id to invite other sprinters. The middle pane shows the task list and real-time standing of all sprinters. In the message pane on the right, sprinters can communicate each other via instant messaging.

![sprint page](/assets/images/sprinting-demo-sprint.png)

## Links
- Source on GitHub: [![chaoyihu - sprinting](https://img.shields.io/static/v1?label=chaoyihu&message=sprinting&color=blue&logo=github)](https://github.com/chaoyihu/sprinting)

<!-- - Project Video: [Create a team sprint]() -->

- Project Demo: [Sprinting](http://44.203.49.24/)
> You can use username: testuser and password: pwd to play with the demo, or register your own user.