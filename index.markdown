---
layout: base
title: Home
permalink: /
---

<h1 class="post-title p-name" itemprop="name headline">{{ page.title | escape }}</h1>
---

<div id="index-intro">
    <p>Welcome to my website! (^_^)/</p>
    <p>My name is Chaoyi Hu. I am a biomedical engineering graduate with experience in software development, product prototyping, data processing, machine learning, and more. This website hosts projects and blogs that are technical or just for fun. Please feel free to check them out, and welcome to get in touch if you are interested! 👐</p>
    <li>The <strong>Blogs</strong> section hosts technical posts that document my experiences as a developer, focusing on challenges I have encountered in development and steps I took to build viable solutions. It also includes fun posts on other topics.</li>
    <li>The <strong>Projects</strong> section presents projects I built in detail with videos and demo links.</li>
</div>

## Featured Projects

  <div class="project-row">
    <div class="project-row-content">
      <img src="/assets/images/ultrasound-project-result.png">
      <div class="project-headline-box">
        <p>
          <span class="project-tag">Image Processing</span>
          <span class="project-tag">Deep Learning</span>
          <span class="project-tag">Python</span>
        </p>
        <h3><strong>Semantic Segmentation of Ultrasound Images</strong></h3>
        <p>
          Collaborated with clinicians at Beijing Anzhen Hospital to build a deep learning network that segments anatomical structures in ultrasound images.
        </p>
        <p>
          <a href="/projects/ultrasound-image-segmentation">More Details>>></a><br>
        </p>
      </div>
    </div>
  </div>

  <div class="project-row">
    <div class="project-row-content">
      <img src="/assets/images/maze-setting.png">
      <div class="project-headline-box">
        <p>
          <span class="project-tag">Video Processing</span>
          <span class="project-tag">Python</span>
          <span class="project-tag">MATLAB</span>
          <span class="project-tag">Numpy</span>
          <span class="project-tag">Pandas</span>
        </p>
        <h3><strong>Development of laboratory software tools to assist animal experiment</strong></h3>
        <p>
          Video processing, batch processing, data visualization, and GUI development to assist scientific research.
        </p>
        <p>
          <a href="/projects/behavioral-experiment">More Details>>></a>
        </p>
      </div>
    </div>
  </div>

  <div class="project-row">
    <div class="project-row-content">
      <img src="/assets/images/mri-project-data.png">
      <div class="project-headline-box">
        <p>
          <span class="project-tag">Image Processing</span>
          <span class="project-tag">MRI</span>
          <span class="project-tag">Python</span>
          <span class="project-tag">MATLAB</span>
          <span class="project-tag">SPM</span>
        </p>
        <h3><strong>Detection of Alzheimer’s Disease Based on MRI Data</strong></h3>
        <p>
          Developed models to classify Alzheimer and cognitively-normal patients based on MRI data from ADNI dataset.
        </p>
        <p>
          <a href="/projects/mri-alzheimer">More Details>>></a><br>
        </p>
      </div>
    </div>
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
