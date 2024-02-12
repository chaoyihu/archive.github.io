---
layout: base
title: Blogs
---

<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>

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