---
layout: base
title: Home
---

<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>

<p>Welcome to my website! This page provides a quick feed. Please feel free to navigate through the tabs for more contents: </p>

- <strong>Projects</strong> showcases projects I built, with project details, videos, and demo links.

- <strong>Blogs</strong> includes technical posts documenting my experience and ideas as a developer, focusing on challenges I have encountered in development and steps I took to build viable solutions.

<!-- - <strong>Fun</strong> offers a booster shot for your curiosity. Posts here cover various fun topics such as linguistics, neuroscience, comics, and gardening. Feel free to head over for a dose of fun! -->

## Projects
---
<div id="project-pane">
    <div class="project-row">
        <img src="/assets/images/sprinting-project-cover.png">
        <div class="project-headline-box">
            <h3><strong>Sprinting: Web-Based Sprint Planning and Collaboration</strong></h3>
            <p>Sprinting a dynamic web application to streamline sprint planning, sprint events hosting and progress sharing among team members.</p>
            <p>You can use following username and password to play with the demo:</p>
            <ul>
                <li>username: testuser</li>
                <li>password: pwd</li>
            </ul>
            <p><a href="/projects#sprinting-web-based-sprint-planning-and-collaboration">More Details>>></a></p><br>
            <p><a href="https://44.203.49.24/" target="_blank">Visit Demo>>></a></p>
        </div>
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
