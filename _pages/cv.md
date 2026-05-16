---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education
======
* **Peking University**, Beijing
  * Undergraduate in Intelligence Science, Aug 2023 to Present

* **Jiangsu Dongtai High School**, Yancheng, Jiangsu
  * Sept 2020 to Jun 2023

Research Experience
======
* **Agentic E-commerce Assistant with Function Calling (In Progress)**
  * Joint University-Enterprise Innovation Workstation Project, Beijing / Shanghai / Hangzhou
  * May 2025 to May 2026
  * With support from Xiaoduo AI Co., Ltd.
  * Working on enhancing LLM agent capabilities in e-commerce customer service, especially tool use and function calling.
  * Introducing a long-term memory unit and expanding the e-commerce customer service benchmark.
  * Built an end-to-end LLM agent post-training pipeline, EComBench, integrating supervised fine-tuning and reinforcement learning.
  * Designed rollout strategies to construct high-quality reasoning data from successful agent trajectories.
  * Proposed a dual-path RL data construction framework with step-level semantic evaluation and trajectory-level preference optimization.
  * Introduced reward variance-driven sampling and group filtering to stabilize RL training.
  * Addressed state misalignment, long-context training, and sparse reward signals.

* **Research Intern**
  * Prof. Chen's Lab, Peking University
  * Feb 2025 to Present
  * Assisted in spike camera data collection for *SpikeStereoNet: A Brain-Inspired Framework for Stereo Depth Estimation from Spike Streams*.
  * Currently working on VLA efficiency by designing a conditional SSM-based action denoiser in a flow-matching framework.
  * Reducing cross-modal interaction overhead through low-dimensional conditional summarization.
  * Exploring few-step ODE solvers and distillation for a better efficiency and success-rate tradeoff.

* **Collaborator**
  * TarraVerse Group, Peking University
  * Dec 2025 to Feb 2026
  * Contributed to TerraVerse, an IROS 2026 submission on a large-scale vision-language terrain dataset.
  * Participated in data collection, cleaning, annotation, and scalable pipeline construction.
  * Worked on cross-dataset aggregation, Mask-to-Patch transformation, VLM-based parallel annotation, and multi-stage quality filtering.
  * Improved annotation scalability and consistency across heterogeneous terrain datasets.
  
Research Interests
======
* Embodied Intelligence
* Cognitive Architectures for LLMs
* Model Interpretability

Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

Hobbies
======
* Cue sports
* Molecular gastronomy
* Karaoke
* Learning Cantonese and Japanese through multilingual pop songs
  
<!-- Talks
======
  <ul>{% for post in site.talks reversed %}
    {% include archive-single-talk-cv.html  %}
  {% endfor %}</ul> -->
  
<!-- Teaching
======
  <ul>{% for post in site.teaching reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul> -->
  
<!-- Service and leadership
======
* Currently signed in to 43 different slack teams -->
