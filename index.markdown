---
layout: base
title: Home
---

<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>

<p>Welcome to my website! This page provides a quick feed. Please feel free to navigate through the tabs for more contents: </p>

- <strong>Projects</strong> showcases projects I built, with project details, videos, and demo links.

- <strong>Blogs</strong> includes technical posts documenting my experience and ideas as a developer, focusing on challenges I have encountered in development and steps I took to build viable solutions.

<!-- - <strong>Fun</strong> collects posts on various topics, from Linguistics and neuroscience to reading notes, comics, and gardening logs.-->

## Projects
---
<div id="project-pane">
  <div class="project-row">
    <img src="/assets/images/sprinting-project-cover.gif">
    <div class="project-headline-box">
        <h3><strong>Sprinting: Web-Based Sprint Planning and Collaboration</strong></h3>
        <p>Sprinting a dynamic web application to streamline sprint planning, sprint events hosting and progress sharing among team members.</p>
        <p><a href="/projects#sprinting-web-based-sprint-planning-and-collaboration">More Details>>></a></p><br>
        <p><a href="https://youtu.be/354mPbYTccc">Demo Video>>></a></p><br>
        <p><a href="http://44.203.49.24/sprinting" target="_blank">Web Demo>>></a></p>
    </div>
  </div>
  <div class="project-row">
    <div class="project-headline-box">
      <h3><strong>Vocabbler: Language Learner Helper App</strong></h3>
      <p>Vocabbler is a language-study application that helps you:</p>
      <ul>
          <li>Build and manage your own vocabulary</li>
          <li>Quiz yourself on what you have studied.</li>
      </ul>
      <p><a href="/projects#vocabbler-language-learner-helper-app">More Details>>></a></p><br>
      <p><a href="http://44.203.49.24/vocabbler" target="_blank">Web Demo>>></a></p>
    </div>
    <img src="/assets/images/vocabbler-words-page.png">
  </div>
</div>


## Blogs
---
<br>
{% for post in site.categories.developer %}
  <ul>
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <div style="float: right;">
        {% for tag in post.tags %}
          <span class="blog-tag">{{ tag }}</span>
        {% endfor %}
      </div>
      <p>
        {{ post.description }}
        {%- assign date_format = site.minima.date_format | default: "%b %-d, %Y" -%}
        <time class="dt-published" datetime="{{ post.date | date_to_xmlschema }}" itemprop="datePublished">
          ({{ post.date | date: date_format }})
        </time>
      </p>
    </li>
  </ul>
{% endfor %}
