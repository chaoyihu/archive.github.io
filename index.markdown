---
layout: base
title: Home
permalink: /
---

<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>
---

<div class="index-intro">
  <p>  Welcome to my website! (^_^)/</p>
  <p>The <strong>Blogs</strong> section hosts technical posts that document my experiences as a developer, focusing on challenges I have encountered in development and steps I took to build viable solutions. It also includes fun posts on other topics.</p>
  <p>The <strong>Projects</strong> section presents projects I built in detail with videos and demo links.</p>
</div>

## Recent Blogs

{% for post in site.categories.developer %}
  <div class="blog-item">
    <div class="blog-item-title">
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {% for tag in post.tags %}
        <span class="blog-tag">{{ tag }}</span>
      {% endfor %}
    </div>
    <div class="blog-item-description">
      {{ post.description }}
    </div>
    <div class="blog-item-date">
      {%- assign date_format = site.minima.date_format | default: "%b %-d, %Y" -%}
      <time class="dt-published" datetime="{{ post.date | date_to_xmlschema }}" itemprop="datePublished">
        {{ post.date | date: date_format }}
      </time>
    </div>
  </div>
{% endfor %}
