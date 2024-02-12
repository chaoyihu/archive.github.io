---
layout: base
title: Fun
---
<h1 class="post-title p-name" itemprop="name headline">Fun! </h1>

<p>Glad to see you here, my curious friend! 🐱 I am really happy that you decided to check out this Fun tab. This is a place where I randomly post about everything that interests me - except software development - those are located in <strong>Blogs</strong> tab on navbar.</p>

<p>Now feel free to grab a drink and explore.🍹</p>
<!-- 
Language, Linguistics
<p>Languages(Natural)</p>
<p>Languages(Programming)</p>
<p>Lambda Calculus inspired by:
https://linguistics.stackexchange.com/questions/11593/what-is-the-relationship-between-lambda-calculus-and-logical-form
https://www.reddit.com/r/linguistics/comments/2w4ir4/intro_to_lambda_calculus_for_linguists/?rdt=50929</p> -->

<h1>Posts</h1>
{% for post in site.categories.fun %}
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