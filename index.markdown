---
layout: base
title: Home
---

<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>

<p>Welcome to my website! Let me quickly navigate you through the tabs:</p>

- <strong>Projects</strong> showcases projects I built.

- <strong>Blogs</strong> includes a list of technical posts documenting my experience and ideas as a developer. Many of the posts focus on the challenges I have encountered in development and steps I took to build viable solutions.

<!-- - <strong>Fun</strong> offers a booster shot for your curiosity. Posts here cover various fun topics such as linguistics, neuroscience, comics, and gardening. Feel free to head over for a dose of fun! -->

<p>Following is a quick feed. Navigate through the tabs for more contents. </p>

<h1>Projects</h1>
  <div class="project-item"></div>

<h1>Blogs</h1>
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
