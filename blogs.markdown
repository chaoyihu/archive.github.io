---
layout: base
title: Blogs
permalink: /blogs
---

<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>

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